import type { Request, Response } from "express";
import Admin, { ADMIN_ROLES } from "../../models/admin.model.js";
import {
  MAX_ACTIVE_SESSIONS,
  generateAccessToken,
  generateRefreshToken,
  hashToken
} from "../../utils/generateToken.js";
import { safeAdmin, safeAdmins } from "../../utils/serialize.js";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../../utils/appError.js";
import { refreshCookieOptions } from "../../utils/cookies.js";
import logger from "../../utils/logger.js";

/**
 * Admin accounts.
 *
 * Three things here used to be wrong and are worth keeping in mind when
 * editing this file:
 *
 *   - Creating an admin was a public endpoint that accepted `role` from the
 *     request body. It is now behind `requireAdminRole("super_admin")`.
 *   - Updating an admin passed `req.body` straight into `findByIdAndUpdate`,
 *     which allowed both privilege escalation and plain-text passwords.
 *     Updates now go through an explicit field list and `save()`.
 *   - Login returned the whole document, hash included. Every response now
 *     goes through `safeAdmin`.
 */

/** Only a super_admin reaches this, enforced by the route. */
export const createAdmin = async (req: Request, res: Response) => {
  const { name, email, password, role, mobile } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: string;
    mobile?: string;
  };

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) throw conflict("An admin with that email already exists.");

  // A super_admin may create another super_admin; nobody else can be created
  // with a role that is not in the enum.
  const assignedRole = role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]) ? role : "admin";

  const admin = await Admin.create({ name, email, password, role: assignedRole, mobile });

  logger.info(
    { createdBy: req.actor?.id, newAdmin: admin._id.toString(), role: assignedRole },
    "Admin account created"
  );

  res.status(201).json({
    success: true,
    message: "Admin created successfully",
    data: safeAdmin(admin)
  });
};

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password +refreshTokens");

  // Same message whether the email is unknown or the password is wrong, so the
  // endpoint cannot be used to discover which addresses are admin accounts.
  if (!admin || !(await admin.comparePassword(password))) {
    logger.warn({ email }, "Failed admin sign-in attempt");
    throw unauthorized("Those sign-in details are not correct.");
  }

  if (!admin.isActive) throw forbidden("This admin account has been deactivated.");

  const accessToken = generateAccessToken(admin._id.toString(), "admin");
  const refreshToken = generateRefreshToken(admin._id.toString(), "admin");

  // Keep the most recent N sessions so a stolen token from an old device
  // cannot be refreshed forever, and the array cannot grow without bound.
  admin.refreshTokens = [...(admin.refreshTokens ?? []), hashToken(refreshToken)].slice(-MAX_ACTIVE_SESSIONS);
  await admin.save();

  res.cookie("refreshToken", refreshToken, refreshCookieOptions());

  logger.info({ adminId: admin._id.toString() }, "Admin signed in");

  res.status(200).json({
    success: true,
    message: "Login successful",
    admin: safeAdmin(admin),
    data: safeAdmin(admin),
    accessToken
  });
};

export const adminLogout = async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string> | undefined)?.refreshToken;

  if (token && req.actor) {
    await Admin.findByIdAndUpdate(req.actor.id, { $pull: { refreshTokens: hashToken(token) } });
  }

  res.clearCookie("refreshToken", { ...refreshCookieOptions(), maxAge: undefined });
  res.status(200).json({ success: true, message: "Signed out." });
};

/** The signed-in admin's own record. Used by the dashboard on boot. */
export const getCurrentAdmin = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, data: safeAdmin(req.currentAdmin) });
};

export const getAdmins = async (_req: Request, res: Response) => {
  const admins = await Admin.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: safeAdmins(admins) });
};

export const getAdminById = async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) throw notFound("Admin not found");

  res.status(200).json({ success: true, data: safeAdmin(admin) });
};

/** Fields an admin update may touch. `role` and `isActive` are handled separately. */
const UPDATABLE = ["name", "email", "mobile", "clubName", "foundedYear", "profileImage"] as const;

export const updateAdmin = async (req: Request, res: Response) => {
  const target = String(req.params.id ?? "");

  // An ordinary admin edits only their own profile; a super_admin edits anyone.
  if (req.actor?.role !== "super_admin" && req.actor?.id !== target) {
    throw forbidden("You can only edit your own admin profile.");
  }

  const admin = await Admin.findById(target).select("+password");
  if (!admin) throw notFound("Admin not found");

  const body = req.body as Record<string, unknown>;

  for (const field of UPDATABLE) {
    if (body[field] !== undefined) (admin as Record<string, any>)[field] = body[field];
  }

  // Role and activation are super_admin-only, and never self-applied.
  if (req.actor?.role === "super_admin" && req.actor.id !== target) {
    if (typeof body.role === "string" && ADMIN_ROLES.includes(body.role as (typeof ADMIN_ROLES)[number])) {
      admin.role = body.role as (typeof ADMIN_ROLES)[number];
    }
    if (typeof body.isActive === "boolean") admin.isActive = body.isActive;
  }

  // A password change goes through `save()` so the pre-save hook hashes it,
  // and it ends every other session on the account.
  if (typeof body.password === "string" && body.password.trim()) {
    if (req.actor?.id !== target) throw forbidden("An admin must change their own password.");
    if (typeof body.currentPassword !== "string" || !(await admin.comparePassword(body.currentPassword))) {
      throw badRequest("Your current password is not correct.");
    }
    admin.password = body.password;
    admin.refreshTokens = [];
  }

  await admin.save();

  logger.info({ actor: req.actor?.id, target }, "Admin account updated");

  res.status(200).json({ success: true, message: "Admin updated", data: safeAdmin(admin) });
};

export const deleteAdmin = async (req: Request, res: Response) => {
  const target = String(req.params.id ?? (req.body as { id?: string })?.id ?? "");
  if (!target) throw badRequest("Which admin should be removed?");

  if (target === req.actor?.id) throw badRequest("You cannot delete your own admin account.");

  // Never leave the club without a super_admin.
  const admin = await Admin.findById(target);
  if (!admin) throw notFound("Admin not found");

  if (admin.role === "super_admin") {
    const remaining = await Admin.countDocuments({ role: "super_admin", _id: { $ne: target } });
    if (remaining === 0) throw badRequest("This is the last super admin. Promote another one first.");
  }

  await admin.deleteOne();

  logger.info({ actor: req.actor?.id, target }, "Admin account deleted");

  res.status(200).json({ success: true, message: "Admin deleted" });
};
