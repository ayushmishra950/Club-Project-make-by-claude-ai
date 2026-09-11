import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { nanoid } from "nanoid";
import User from "../models/user.model.js";
import env from "../config/env.js";
import logger from "./logger.js";

/**
 * Google sign-in for the browser flow.
 *
 * Three things were wrong here and are worth not reintroducing:
 *
 *   - A new member got a password derived from their display name
 *     (`priyank@123`), which anyone could guess from the member directory. The
 *     schema now allows a social account to have no password at all, so none
 *     is invented.
 *   - That password was hashed here and then hashed again by the model's
 *     pre-save hook, so it never worked anyway.
 *   - A missing Google configuration threw at import time and took the whole
 *     server down on boot. Google sign-in is optional; without it configured
 *     the strategy is simply not registered and the route reports that.
 */

const configured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL);

if (!configured) {
  logger.warn(
    { missing: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"].filter((key) => !process.env[key]) },
    "Google sign-in is not configured; the browser OAuth route is disabled."
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        callbackURL: env.GOOGLE_CALLBACK_URL!
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: Function) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("No email is attached to this Google account."), undefined);

          const emailVerified = profile._json?.email_verified === true;

          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

          // New member. No password is created: the account signs in through
          // Google, and can set one later from their profile if they want.
          if (!user) {
            user = await User.create({
              userId: `USR-${nanoid(8)}`,
              googleId: profile.id,
              fullName: profile.displayName || email.split("@")[0],
              email,
              profileImage: profile.photos?.[0]?.value || ""
            });

            logger.info({ userId: user._id.toString() }, "Member created via Google sign-in");
            return done(null, user);
          }

          // Linking Google to an existing password account is only safe when
          // Google has verified the address; otherwise anyone who can create a
          // Google account with that address takes over the member.
          if (!user.googleId) {
            if (!emailVerified) {
              return done(
                new Error("This email is registered here but is not verified on Google. Sign in with your password."),
                undefined
              );
            }
            user.googleId = profile.id;
            await user.save();
          }

          return done(null, user);
        } catch (error) {
          logger.error({ err: error }, "Google strategy failed");
          return done(error, undefined);
        }
      }
    )
  );
}

export const googleSignInConfigured = configured;
export default passport;
