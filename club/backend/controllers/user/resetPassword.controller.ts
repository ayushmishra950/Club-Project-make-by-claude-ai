import type { Request, Response } from "express";
import crypto from "crypto";
import User from "../../models/user.model.js";
import { PasswordReset } from "../../models/resetPassword.model.js";
import { sendPasswordResetSMS } from "../../utils/twilio.service.js";
import { sendPasswordResetEmail } from "../../utils/nodeMailer.js";
import { hashToken } from "../../utils/generateToken.js";
import { badRequest } from "../../utils/appError.js";
import logger from "../../utils/logger.js";
import env from "../../config/env.js";

/**
 * Password reset.
 *
 * Two rules govern this file, and both were broken before:
 *
 * 1. The reset link leaves the server only by email or SMS. It is never in an
 *    API response, a log line or an error message. Returning it once made
 *    every account on the platform takeable by anybody who knew an address.
 *
 * 2. The response never reveals whether an account exists. Same message, same
 *    status code, whether or not the identifier matched, so the endpoint
 *    cannot be used to enumerate the membership list.
 */

/** The one reply this endpoint ever gives, matched or not. */
const NEUTRAL_REPLY = {
  success: true,
  message: "If that email or mobile number belongs to an account, we have sent a reset link to it."
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { identifier, platform } = req.body as { identifier?: string; platform?: string };

  if (!identifier || !identifier.trim()) {
    throw badRequest("Enter the email address or mobile number on your account.");
  }

  const trimmed = identifier.trim();
  const user = await User.findOne({
    $or: [{ email: trimmed.toLowerCase() }, { mobile: trimmed }],
    isDeleted: false
  });

  // No account: answer exactly as if there were one, and do no further work.
  if (!user) {
    logger.info({ identifierPresent: true }, "Password reset requested for an unknown identifier");
    res.status(200).json(NEUTRAL_REPLY);
    return;
  }

  // One live reset per account. Requesting a new link invalidates the previous one.
  await PasswordReset.deleteMany({ userId: user._id });

  const resetToken = crypto.randomBytes(32).toString("hex");
  await PasswordReset.create({ userId: user._id, tokenHash: hashToken(resetToken) });

  /* A real path on the web, not a `/#/` fragment. The site routes on the URL,
     so a hash link opens the public landing page and the reset form never sees
     its token. The same mismatch broke the Google sign-in redirect. */
  const baseUrl = platform === "mobile" ? "myapp://newPassword" : `${env.RESET_URL ?? ""}/new-password`;
  const resetLink = `${baseUrl}?token=${resetToken}`;

  try {
    const sendBySms = user.mobile === trimmed && Boolean(user.mobile);

    if (sendBySms) {
      await sendPasswordResetSMS(user.mobile!, resetLink);
    } else if (user.email) {
      await sendPasswordResetEmail(user.email, resetLink);
    } else {
      // Nothing to send to. Still answer neutrally rather than explaining why.
      logger.warn({ userId: user._id.toString() }, "Password reset requested for an account with no contact method");
      res.status(200).json(NEUTRAL_REPLY);
      return;
    }

    logger.info({ userId: user._id.toString(), channel: sendBySms ? "sms" : "email" }, "Password reset link sent");
  } catch (error) {
    // Delivery failed: drop the token so a half-finished reset cannot be redeemed.
    await PasswordReset.deleteMany({ userId: user._id });
    logger.error({ userId: user._id.toString(), err: error }, "Failed to deliver password reset link");
  }

  res.status(200).json(NEUTRAL_REPLY);
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };

  if (!token || !newPassword) {
    throw badRequest("The reset link and a new password are both required.");
  }

  if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw badRequest("Your new password must be at least 8 characters and contain a letter and a number.");
  }

  const entry = await PasswordReset.findOne({ tokenHash: hashToken(token) });

  if (!entry) {
    throw badRequest("This reset link is not valid or has expired. Please request a new one.");
  }

  const user = await User.findById(entry.userId).select("+password +refreshTokens");

  if (!user) {
    await PasswordReset.deleteOne({ _id: entry._id });
    throw badRequest("This reset link is not valid or has expired. Please request a new one.");
  }

  // Assign and save so the schema's pre-save hook does the hashing. Using
  // findByIdAndUpdate here would skip that hook and store the password as plain text.
  user.password = newPassword;

  // A password reset ends every existing session. If the reset was triggered
  // because the account was compromised, the attacker's tokens die here.
  user.refreshTokens = [];
  await user.save();

  await PasswordReset.deleteOne({ _id: entry._id });

  logger.info({ userId: user._id.toString() }, "Password reset completed");

  res.status(200).json({
    success: true,
    message: "Your password has been changed. You can sign in with it now."
  });
};
