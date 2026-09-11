import express from "express";
import { z } from "zod";
import { forgotPassword, resetPassword } from "../../controllers/user/resetPassword.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { validate, password } from "../../middlewares/validate.js";
import { passwordResetLimiter } from "../../middlewares/rateLimit.js";

const router = express.Router();

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate({
    body: z.object({
      identifier: z.string().trim().min(3, "Enter your email address or mobile number."),
      platform: z.enum(["web", "mobile"]).optional()
    })
  }),
  asyncHandler(forgotPassword)
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  validate({
    body: z.object({
      token: z.string().trim().min(32, "This reset link is not valid."),
      newPassword: password
    })
  }),
  asyncHandler(resetPassword)
);

export default router;
