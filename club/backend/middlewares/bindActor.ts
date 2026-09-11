import type { NextFunction, Request, Response } from "express";

/**
 * Forces the "who is doing this" fields on a request to the authenticated
 * caller.
 *
 * Almost every handler in this codebase was written to read the acting member
 * from `req.body.userId`, `req.params.userId` or `req.query.userId`. That is
 * fine as a convention and fatal as a source of truth: a member could post
 * somebody else's id and act as them.
 *
 * Rather than rewrite a hundred handlers and risk changing their logic, this
 * middleware overwrites those fields with `req.actor.id` before the handler
 * runs. The handlers keep working exactly as written, and the value they read
 * is now the verified caller.
 *
 * Two deliberate limits:
 *
 *   - Only *identity* fields are rewritten. Target fields (`toId`,
 *     `blockedId`, `otherUserId`, `reportedUser`) are untouched, because those
 *     legitimately name somebody else.
 *   - Admins are left alone. Staff endpoints act on behalf of other accounts
 *     by design, and admin access is already gated by `requireAdmin`.
 */

/** Field names that mean "the member performing this action". */
const IDENTITY_FIELDS = ["userId", "fromId", "reportedBy", "blockerId", "senderId"] as const;

interface Options {
  /**
   * Path suffixes on this router where an identity field legitimately names
   * another member, e.g. removing somebody else from a group.
   */
  except?: string[];
  /** Override the default field list. */
  fields?: readonly string[];
}

export const bindActor =
  ({ except = [], fields = IDENTITY_FIELDS }: Options = {}) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const actor = req.actor;

    // Unauthenticated requests never reach a router that uses this, and staff
    // are intentionally allowed to name a different account.
    if (!actor || actor.type !== "user") return next();

    if (except.some((path) => req.path === path || req.path.startsWith(`${path}/`))) return next();

    for (const field of fields) {
      if (req.body && typeof req.body === "object" && field in req.body) {
        (req.body as Record<string, unknown>)[field] = actor.id;
      }
      if (field in req.params) {
        (req.params as Record<string, string>)[field] = actor.id;
      }
      if (req.query && field in req.query) {
        (req.query as Record<string, unknown>)[field] = actor.id;
      }
    }

    next();
  };

export default bindActor;
