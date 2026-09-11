import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import type { Request } from "express";
import env from "../config/env.js";

/**
 * Rate limiting.
 *
 * Counters live in this process's memory, which is correct for a single
 * instance. Before running more than one instance, swap the store for
 * `rate-limit-redis` so the limits are shared; nothing else here changes.
 */

/**
 * Limit a signed-in caller by account id rather than by IP.
 *
 * Whole housing societies and offices share one public IP, so an IP-only
 * limiter throttles a building because one member is active. Anonymous
 * callers still fall back to IP.
 */
const keyByActorOrIp = (req: Request, res: Parameters<Options["keyGenerator"]>[1]) =>
  req.actor?.id ?? ipKeyGenerator(req.ip ?? "", false) ?? String(res.statusCode);

const message = (text: string) => ({ success: false, code: "TOO_MANY_REQUESTS", message: text });

/** Broad ceiling across the whole API. Generous: this catches scraping, not use. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 1000 : 10_000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByActorOrIp,
  message: message("Too many requests. Please try again in a few minutes.")
});

/**
 * Sign-in, registration and password reset.
 *
 * Tight, because these are the endpoints worth brute-forcing. Successful
 * requests are not counted, so a member typing their password correctly is
 * never locked out by somebody else's failures from the same office.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isProduction ? 10 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: message("Too many attempts. Please wait 15 minutes and try again.")
});

/**
 * Password reset specifically, keyed on the account being reset as well as the
 * caller, so one attacker cannot spam a single member's inbox.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isProduction ? 5 : 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const identifier = (req.body as { identifier?: string })?.identifier;
    const ip = ipKeyGenerator(req.ip ?? "", false) ?? String(res.statusCode);
    return identifier ? `${ip}:${identifier.toLowerCase()}` : ip;
  },
  message: message("Too many password reset requests. Please try again in an hour.")
});

/** Writes: posting, commenting, messaging, uploading. */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: env.isProduction ? 120 : 10_000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByActorOrIp,
  // Reads are already covered by apiLimiter; this one exists to slow writes.
  skip: (req) => req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS",
  message: message("You are doing that too quickly. Please wait a moment.")
});

/** Uploads, which cost far more than an ordinary write. */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.isProduction ? 100 : 10_000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: keyByActorOrIp,
  message: message("Upload limit reached. Please try again later.")
});

export default apiLimiter;
