import express from "express";
import { z } from "zod";
import passport from "passport";
import type { AuthenticateOptionsGoogle } from "passport-google-oauth20";

import {
  addPushNotifications,
  cancelDeleteRequest,
  convertPremiumUser,
  deleteUser,
  getAllUsers,
  getCurrentUser,
  getSingleUser,
  getSingleUserDetail,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  requestDeleteAccount,
  updateUser
} from "../../controllers/user/auth.controller.js";
import {
  appleMobileLogin,
  googleMobileLogin,
  googleWebCallback
} from "../../controllers/user/socialAuth.controller.js";

import upload from "../../middlewares/upload.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { requireAdmin, requireAuth, requireSelfOrAdmin } from "../../middlewares/auth.js";
import { authLimiter, uploadLimiter } from "../../middlewares/rateLimit.js";
import { validate, objectId, email, mobile, password, pagination } from "../../middlewares/validate.js";
import env from "../../config/env.js";

/**
 * Mounted without a blanket guard, because registration, sign-in, token
 * refresh and the social callbacks all have to be reachable without a token.
 * Everything below the `router.use(requireAuth)` line is protected.
 */

const router = express.Router();

/* ================================================================
   OPEN
================================================================ */

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(80),
    // Email is the account's identity and is always required.
    // Mobile is optional, but kept and shown in the member directory.
    email,
    mobile: mobile.optional().or(z.literal("").transform(() => undefined)),
    password,
    confirmPassword: z.string(),
    dob: z.coerce.date().optional(),
    gender: z.string().trim().max(20).optional(),
    maritalStatus: z.string().trim().max(30).optional(),
    occupation: z.string().trim().max(80).optional(),
    address: z.string().trim().max(200).optional(),
    city: z.string().trim().max(60).optional(),
    state: z.string().trim().max(60).optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"]
  });

router.post("/register", authLimiter, validate({ body: registerSchema }), asyncHandler(registerUser));

router.post(
  "/login",
  authLimiter,
  validate({
    body: z.object({
      identifier: z.string().trim().min(3, "Enter your email address or mobile number."),
      password: z.string().min(1, "Enter your password."),
      platform: z.enum(["web", "mobile"]).optional()
    })
  }),
  asyncHandler(loginUser)
);

router.post("/refresh", asyncHandler(refreshAccessToken));
router.post("/logout", asyncHandler(logoutUser));

/* ---- social ---- */

router.post(
  "/google-mobile",
  authLimiter,
  validate({ body: z.object({ idToken: z.string().min(20) }) }),
  asyncHandler(googleMobileLogin)
);

router.post(
  "/apple-mobile",
  authLimiter,
  validate({
    body: z.object({
      identityToken: z.string().min(20),
      firstName: z.string().trim().max(60).optional(),
      lastName: z.string().trim().max(60).optional()
    })
  }),
  asyncHandler(appleMobileLogin)
);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: env.OAUTH_STATE_SECRET
  } as AuthenticateOptionsGoogle)
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (error: unknown, user: unknown) => {
      const frontend = env.FRONTEND_USER_PRODUCTION_URL || env.FRONTEND_USER_LOCAL_URL || "";
      // A real path, not a `/#/` fragment: the member site routes on the URL.
      if (error || !user) return res.redirect(`${frontend}/login?error=auth_failed`);
      req.user = user as Express.User;
      return next();
    })(req, res, next);
  },
  asyncHandler(googleWebCallback)
);

/* ================================================================
   SIGNED IN
================================================================ */

router.use(requireAuth);

router.get("/me", asyncHandler(getCurrentUser));

router.get(
  "/get/:userId",
  validate({ params: z.object({ userId: objectId }), query: pagination.extend({ search: z.string().trim().max(60).optional() }) }),
  asyncHandler(getAllUsers)
);

router.get("/getbyid/:id", validate({ params: z.object({ id: objectId }) }), asyncHandler(getSingleUser));
router.get("/get-by-id/:id", validate({ params: z.object({ id: objectId }) }), asyncHandler(getSingleUserDetail));

router.put("/update", uploadLimiter, upload.any(), asyncHandler(updateUser));

router.put(
  "/convert-premium",
  uploadLimiter,
  upload.fields([{ name: "paymentImage", maxCount: 1 }]),
  asyncHandler(convertPremiumUser)
);

router.patch(
  "/notification/pushToken",
  validate({ body: z.object({ userId: objectId.optional(), pushToken: z.string().trim().min(10).max(300) }) }),
  asyncHandler(addPushNotifications)
);

router.delete(
  "/delete/user/:userId",
  validate({ params: z.object({ userId: objectId }), body: z.object({ reason: z.string().trim().max(500).optional() }) }),
  requireSelfOrAdmin("userId"),
  asyncHandler(requestDeleteAccount)
);

router.patch(
  "/recover/account/:userId",
  validate({ params: z.object({ userId: objectId }) }),
  requireSelfOrAdmin("userId"),
  asyncHandler(cancelDeleteRequest)
);

/* ---- admin only ---- */

// Previously `DELETE /delete` with the handler reading `req.params.id`, which
// is undefined on that path, so the endpoint could never delete anything.
router.delete("/delete/:id", requireAdmin, validate({ params: z.object({ id: objectId }) }), asyncHandler(deleteUser));

export default router;
