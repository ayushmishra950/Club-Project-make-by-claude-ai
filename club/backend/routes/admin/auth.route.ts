import express from "express";
import { z } from "zod";
import {
  adminLogin,
  adminLogout,
  createAdmin,
  deleteAdmin,
  getAdminById,
  getAdmins,
  getCurrentAdmin,
  updateAdmin
} from "../../controllers/admin/auth.controller.js";
import { requireAdmin, requireAdminRole, requireAuth } from "../../middlewares/auth.js";
import { validate, objectId, email, password } from "../../middlewares/validate.js";
import asyncHandler from "../../utils/asyncHandler.js";

/**
 * This router is mounted without a blanket auth guard because sign-in has to
 * be reachable. Every other endpoint in it therefore states its own guard.
 */

const router = express.Router();

/* ---------------- open ---------------- */

router.post(
  "/login",
  validate({
    body: z.object({
      email,
      password: z.string().min(1, "Enter your password.")
    })
  }),
  asyncHandler(adminLogin)
);

/* ---------------- signed in ---------------- */

router.use(requireAuth, requireAdmin);

router.post("/logout", asyncHandler(adminLogout));
router.get("/me", asyncHandler(getCurrentAdmin));

router.get("/get", asyncHandler(getAdmins));
// The dashboard used POST for this listing; kept so the existing client works.
router.post("/get", asyncHandler(getAdmins));

router.get("/getbyid/:id", validate({ params: z.object({ id: objectId }) }), asyncHandler(getAdminById));

router.put(
  "/update/:id",
  validate({
    params: z.object({ id: objectId }),
    body: z.object({
      name: z.string().trim().min(2).max(80).optional(),
      email: email.optional(),
      mobile: z.string().trim().max(20).optional(),
      clubName: z.string().trim().max(120).optional(),
      foundedYear: z.string().trim().max(10).optional(),
      profileImage: z.string().trim().url().optional().or(z.literal("")),
      role: z.enum(["super_admin", "admin"]).optional(),
      isActive: z.boolean().optional(),
      currentPassword: z.string().optional(),
      password: password.optional()
    })
  }),
  asyncHandler(updateAdmin)
);

/* ---------------- super admin only ---------------- */

router.post(
  "/register",
  requireAdminRole("super_admin"),
  validate({
    body: z.object({
      name: z.string().trim().min(2, "Enter the admin's name.").max(80),
      email,
      password,
      mobile: z.string().trim().max(20).optional(),
      role: z.enum(["super_admin", "admin"]).optional()
    })
  }),
  asyncHandler(createAdmin)
);

router.delete("/delete/:id", requireAdminRole("super_admin"), validate({ params: z.object({ id: objectId }) }), asyncHandler(deleteAdmin));
// Legacy shape used by the dashboard: id in the body.
router.post("/delete", requireAdminRole("super_admin"), validate({ body: z.object({ id: objectId }) }), asyncHandler(deleteAdmin));

export default router;
