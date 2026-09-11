import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import { forbidden, unauthorized } from "../utils/appError.js";
import type { AuthActor } from "../type/index.js";

/**
 * Authentication and authorisation.
 *
 * Every protected route runs `requireAuth` first. It resolves the caller from
 * the bearer token and puts them on `req.actor`. Handlers read the caller from
 * there and never from `req.body.userId`, `req.params.userId` or a query
 * string, because anything the client sends can be changed by the client.
 */

const readToken = (req: Request): string | null => {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    if (token) return token;
  }

  // Mobile clients that cannot set headers on every transport fall back to a cookie.
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.accessToken;
  return cookieToken || null;
};

const describeJwtError = (error: unknown) => {
  if (error instanceof jwt.TokenExpiredError) return unauthorized("Your session has expired. Please sign in again.");
  if (error instanceof jwt.JsonWebTokenError) return unauthorized("Your session is not valid. Please sign in again.");
  return unauthorized();
};

/**
 * Resolves the caller and rejects anyone whose account is no longer usable.
 *
 * The account is loaded on every request rather than trusted from the token,
 * so blocking, deleting or unverifying a member takes effect immediately
 * instead of when their 15 minute access token happens to expire.
 */
const resolveActor = async (req: Request): Promise<AuthActor> => {
  const token = readToken(req);
  if (!token) throw unauthorized("You need to sign in to do that.");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    throw describeJwtError(error);
  }

  if (payload.type === "admin") {
    const admin = await Admin.findById(payload.sub);
    if (!admin) throw unauthorized("This account no longer exists.");
    if (!admin.isActive) throw forbidden("This admin account has been deactivated.");

    req.currentAdmin = admin;
    return { id: admin._id.toString(), type: "admin", role: admin.role };
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    // A token that was issued before the admin/user split carried no `type`.
    // Fall back to the admin collection once so those sessions keep working.
    const admin = await Admin.findById(payload.sub);
    if (admin) {
      if (!admin.isActive) throw forbidden("This admin account has been deactivated.");
      req.currentAdmin = admin;
      return { id: admin._id.toString(), type: "admin", role: admin.role };
    }
    throw unauthorized("This account no longer exists.");
  }

  if (user.blocked) throw forbidden("Your account has been blocked. Please contact the club administration.");
  if (user.isDeleted || user.deleteStatus === "approved") throw forbidden("This account has been deleted.");

  req.currentUser = user;
  return { id: user._id.toString(), type: "user", role: user.role };
};

/** Rejects the request unless a valid access token is present. */
export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  // A CORS preflight carries no credentials by design and must never be
  // answered with an auth error; the browser reads that as the request itself
  // failing.
  if (req.method === "OPTIONS") return next();

  try {
    req.actor = await resolveActor(req);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves the caller when a token is present and carries on when it is not.
 * For endpoints that are public but render differently for a signed-in member.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (readToken(req)) req.actor = await resolveActor(req);
  } catch {
    // A bad token on an optional route is treated as no token at all.
  }
  next();
};

/** Members only. Staff accounts are rejected so member-scoped data stays member-scoped. */
export const requireUser = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.actor) return next(unauthorized());
  if (req.actor.type !== "user") return next(forbidden("This endpoint is for member accounts."));
  next();
};

/** Staff only. */
export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.actor) return next(unauthorized());
  if (req.actor.type !== "admin") return next(forbidden("Administrator access is required."));
  next();
};

/** Staff with one of the listed roles, e.g. `requireAdminRole("super_admin")`. */
export const requireAdminRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.actor) return next(unauthorized());
    if (req.actor.type !== "admin") return next(forbidden("Administrator access is required."));
    if (!roles.includes(req.actor.role)) {
      return next(forbidden(`This action needs one of these roles: ${roles.join(", ")}.`));
    }
    next();
  };

/**
 * Members holding a committee role, plus any admin.
 * e.g. `requireCommitteeRole("treasurer")` for finance actions.
 */
export const requireCommitteeRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.actor) return next(unauthorized());
    if (req.actor.type === "admin") return next();
    if (!roles.includes(req.actor.role)) {
      return next(forbidden("Only committee members can do that."));
    }
    next();
  };

/**
 * Guards a route that acts on a specific account.
 *
 * Passes when the caller is that account or is staff, so `/users/:id/...`
 * routes cannot be pointed at somebody else's id.
 */
export const requireSelfOrAdmin =
  (paramName = "userId") =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.actor) return next(unauthorized());
    if (req.actor.type === "admin") return next();

    const target = req.params[paramName] || (req.body as Record<string, string>)?.[paramName];
    if (!target || target !== req.actor.id) {
      return next(forbidden("You can only do that on your own account."));
    }
    next();
  };

/** Convenience accessor for handlers. Throws rather than returning undefined. */
export const actorId = (req: Request): string => {
  if (!req.actor) throw unauthorized();
  return req.actor.id;
};

export const isAdmin = (req: Request) => req.actor?.type === "admin";

export default requireAuth;
