import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import appleSigninAuth from "apple-signin-auth";
import { nanoid } from "nanoid";
import User from "../../models/user.model.js";
import {
  MAX_ACTIVE_SESSIONS,
  generateAccessToken,
  generateRefreshToken,
  hashToken
} from "../../utils/generateToken.js";
import { selfUser } from "../../utils/serialize.js";
import { refreshCookieOptions } from "../../utils/cookies.js";
import { badRequest, forbidden, unauthorized } from "../../utils/appError.js";
import env from "../../config/env.js";
import logger from "../../utils/logger.js";
import type { IUser } from "../../models/user.model.js";

/**
 * Google and Apple sign-in.
 *
 * These handlers used to live inline in the route file and signed their own
 * tokens with `JWT_SECRET` / `REFRESH_JWT_SECRET`, each with a hardcoded
 * fallback string. That had two consequences: a deployment missing those
 * variables signed real sessions with a secret published in the repository,
 * and tokens issued here could not be verified anywhere else in the system,
 * so mobile social users silently could not refresh or open a chat socket.
 *
 * Everything now goes through the shared token helper, so there is one secret
 * per token type and one place to rotate it.
 */

/** Every client id that may appear as the audience of a Google ID token. */
const googleAudiences = [
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_ANDROID_CLIENT_ID,
  env.GOOGLE_ANDROID_CLIENT2_ID,
  env.GOOGLE_IOS_CLIENT_ID
].filter((value): value is string => Boolean(value));

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/** Issues a session for an account that has just proved its identity socially. */
const issueSession = async (user: IUser, res: Response, includeRefreshInBody: boolean) => {
  const accessToken = generateAccessToken(user._id.toString(), "user");
  const refreshToken = generateRefreshToken(user._id.toString(), "user");

  const withTokens = await User.findById(user._id).select("+refreshTokens");
  if (withTokens) {
    withTokens.refreshTokens = [...(withTokens.refreshTokens ?? []), hashToken(refreshToken)].slice(
      -MAX_ACTIVE_SESSIONS
    );
    await withTokens.save();
  }

  if (!includeRefreshInBody) res.cookie("refreshToken", refreshToken, refreshCookieOptions());

  return { accessToken, refreshToken: includeRefreshInBody ? refreshToken : undefined };
};

const assertUsable = (user: IUser) => {
  if (user.isDeleted || ["pending", "approved"].includes(user.deleteStatus)) {
    throw forbidden("This account is scheduled for deletion.");
  }
  if (user.blocked) throw forbidden("Your account has been blocked. Please contact the club administration.");
};

/* ================================================================
   GOOGLE
================================================================ */

export const googleMobileLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body as { idToken?: string };
  if (!idToken) throw badRequest("idToken is required.");
  if (googleAudiences.length === 0) throw badRequest("Google sign-in is not configured on this server.");

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: googleAudiences });
    payload = ticket.getPayload();
  } catch (error) {
    logger.warn({ err: error }, "Google ID token failed verification");
    throw unauthorized("That Google sign-in could not be verified.");
  }

  if (!payload?.sub) throw unauthorized("That Google sign-in could not be verified.");

  const googleId = payload.sub;
  const emailAddress = payload.email?.toLowerCase();
  const emailVerified = payload.email_verified === true;

  if (!emailAddress) throw badRequest("This Google account has no email address attached.");

  let user = await User.findOne({ $or: [{ googleId }, { email: emailAddress }] });

  if (!user) {
    user = await User.create({
      userId: `USR-${nanoid(8)}`,
      googleId,
      fullName: payload.name || emailAddress.split("@")[0],
      email: emailAddress,
      profileImage: payload.picture || ""
    });
    logger.info({ userId: user._id.toString() }, "Member created via Google sign-in");
  } else if (!user.googleId) {
    // Linking a social identity to an existing password account is only safe
    // when the provider has verified the address, otherwise anybody who can
    // create a Google account with that address takes over the member.
    if (!emailVerified) {
      throw unauthorized("This email is registered here but is not verified on Google. Sign in with your password.");
    }
    user.googleId = googleId;
    await user.save();
  }

  assertUsable(user);

  const { accessToken, refreshToken } = await issueSession(user, res, true);

  res.status(200).json({
    success: true,
    status: 200,
    message: "Google login successful",
    accessToken,
    refreshToken,
    data: selfUser(user)
  });
};

/**
 * Browser OAuth callback. Passport has already verified the profile.
 *
 * These are real paths, not `/#/...` fragments. The member site used to route
 * on the hash and moved to real URLs; the redirect did not follow. A browser
 * sent to `https://site/#/auth-success?...` asks the server for `/`, so the
 * app rendered the public landing page and never saw the token. Signing in
 * with Google appeared to do nothing.
 */
export const googleWebCallback = async (req: Request, res: Response) => {
  const user = req.user as IUser | undefined;
  const frontend = env.FRONTEND_USER_PRODUCTION_URL || env.FRONTEND_USER_LOCAL_URL || "";

  if (!user) return res.redirect(`${frontend}/login?error=auth_failed`);

  try {
    assertUsable(user);
  } catch {
    return res.redirect(`${frontend}/login?error=account_unavailable`);
  }

  const { accessToken } = await issueSession(user, res, false);

  // Only the access token travels in the URL, and the profile is fetched by
  // the client from /me afterwards. The whole user document used to be
  // JSON-encoded into this redirect, which put every field in browser history,
  // in the referrer header and in any proxy log along the way.
  return res.redirect(`${frontend}/auth-success?accessToken=${encodeURIComponent(accessToken)}`);
};

/* ================================================================
   APPLE
================================================================ */

export const appleMobileLogin = async (req: Request, res: Response) => {
  const { identityToken, firstName, lastName } = req.body as {
    identityToken?: string;
    firstName?: string;
    lastName?: string;
  };

  if (!identityToken) throw badRequest("identityToken is required.");
  if (!env.APPLE_BUNDLE_ID) throw badRequest("Apple sign-in is not configured on this server.");

  let payload;
  try {
    payload = await appleSigninAuth.verifyIdToken(identityToken, {
      audience: env.APPLE_BUNDLE_ID,
      ignoreExpiration: false
    });
  } catch (error) {
    logger.warn({ err: error }, "Apple identity token failed verification");
    throw unauthorized("That Apple sign-in could not be verified.");
  }

  const appleId = payload.sub;
  const emailAddress = payload.email?.toLowerCase();

  let user = await User.findOne({
    $or: [{ appleId }, ...(emailAddress ? [{ email: emailAddress }] : [])]
  });

  if (!user) {
    const displayName = firstName
      ? `${firstName} ${lastName ?? ""}`.trim()
      : emailAddress?.split("@")[0] || "Apple User";

    // No password is generated. The schema makes `password` optional for
    // social accounts precisely so this handler does not have to invent one;
    // the previous version derived it from the display name, which made every
    // Apple member's password guessable from the public directory.
    user = await User.create({
      userId: `USR-${nanoid(8)}`,
      appleId,
      fullName: displayName,
      email: emailAddress
    });

    logger.info({ userId: user._id.toString() }, "Member created via Apple sign-in");
  } else if (!user.appleId) {
    // Apple only releases a verified address, so linking is safe here.
    user.appleId = appleId;
    if (!user.email && emailAddress) user.email = emailAddress;
    await user.save();
  }

  assertUsable(user);

  const { accessToken, refreshToken } = await issueSession(user, res, true);

  res.status(200).json({
    success: true,
    status: 200,
    message: "Apple login successful",
    accessToken,
    refreshToken,
    data: selfUser(user)
  });
};
