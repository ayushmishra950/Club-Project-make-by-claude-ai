import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny, z } from "zod";
import mongoose from "mongoose";

/**
 * Request validation.
 *
 * Parsed values replace the raw ones, so handlers downstream receive coerced,
 * trimmed, known-shaped data. Unknown keys are stripped by default, which is
 * what stops a client from smuggling `role` or `isVerified` into a profile
 * update.
 */

interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate =
  (schemas: Schemas) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) {
        // Express 5 exposes req.query as a getter, so assign onto the object.
        const parsed = schemas.query.parse(req.query) as Record<string, unknown>;
        Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      next();
    } catch (error) {
      next(error instanceof ZodError ? error : error);
    }
  };

/* ------------------------------------------------------------------ *
 * Shared field schemas
 * ------------------------------------------------------------------ */

export const objectId = z
  .string()
  .trim()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), "That is not a valid id.");

export const email = z.string().trim().toLowerCase().email("Enter a valid email address.");

/** Indian mobile numbers, with or without the country code. */
export const mobile = z
  .string()
  .trim()
  .regex(/^(\+?91[-\s]?)?[6-9]\d{9}$/, "Enter a valid 10 digit mobile number.");

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be under 128 characters.")
  .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), "Password must contain both a letter and a number.");

/** Cursor pagination. `cursor` is the createdAt of the last item the client saw. */
export const pagination = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().datetime().optional()
});

/** Offset pagination, for admin tables that show page numbers. */
export const paged = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20)
});

/**
 * Escapes regular expression metacharacters so a search term cannot become a
 * pattern. Without this, a crafted query can pin the event loop.
 */
export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default validate;
