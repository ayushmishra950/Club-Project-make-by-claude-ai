import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Group from "../models/group.model.js";
import Post from "../models/post.model.js";
import logger from "../utils/logger.js";
import { forbidden } from "../utils/appError.js";

/**
 * A temporary bridge for mobile app versions that are already installed.
 *
 * The published Expo app reads events and announcements, creates posts and
 * manages groups through `/api/admin/...`, because those endpoints used to be
 * open to anyone. They are staff-only now, and the app has been updated to use
 * `/api/user/...` instead — but the copy on somebody's phone today has not.
 *
 * Without this, the moment the new API deploys every installed app stops
 * showing events, stops creating posts and stops managing groups, and stays
 * broken until each person updates from the App Store. That can take weeks.
 *
 * So: a member reaching one of the exact paths the old app used is allowed
 * through, and nothing else. The list is per router, because "DELETE /delete/:id"
 * is a group the member owns on one router and a club event on another.
 *
 * Turn it off with LEGACY_APP_COMPAT=off once the update has rolled out.
 * Check the logs first: when "legacy mobile endpoint" stops appearing, nobody
 * is on the old build any more.
 */

type Ownership = "none" | "group" | "post";

interface Allowed {
  method: string;
  pattern: RegExp;
  /** What must be true about the caller before the controller runs. */
  ownership: Ownership;
}

/**
 * Exactly what the shipped app calls, per router.
 *
 * Deliberately absent: deleting or editing an event, and anything on the
 * routers not listed here. Those were only ever reachable from the dashboard.
 */
const ALLOWED: Record<string, Allowed[]> = {
  event: [
    { method: "GET", pattern: /^\/get$/, ownership: "none" },
    { method: "GET", pattern: /^\/latest$/, ownership: "none" },
    { method: "GET", pattern: /^\/getbyid\/[a-f0-9]{24}$/i, ownership: "none" },
    { method: "POST", pattern: /^\/candidate\/interested$/, ownership: "none" }
  ],

  announcement: [
    { method: "GET", pattern: /^\/get$/, ownership: "none" },
    { method: "GET", pattern: /^\/getbyid\/[a-f0-9]{24}$/i, ownership: "none" }
  ],

  group: [
    { method: "GET", pattern: /^\/get$/, ownership: "none" },
    { method: "GET", pattern: /^\/getbyid\/[a-f0-9]{24}$/i, ownership: "none" },
    { method: "POST", pattern: /^\/add$/, ownership: "none" },
    { method: "PUT", pattern: /^\/update$/, ownership: "group" },
    { method: "POST", pattern: /^\/addmember$/, ownership: "group" },
    { method: "PUT", pattern: /^\/removemember$/, ownership: "group" },
    { method: "DELETE", pattern: /^\/delete\/[a-f0-9]{24}$/i, ownership: "group" }
  ],

  post: [
    { method: "POST", pattern: /^\/add$/, ownership: "none" },
    { method: "PUT", pattern: /^\/update$/, ownership: "post" },
    { method: "DELETE", pattern: /^\/delete\/[a-f0-9]{24}$/i, ownership: "post" },
    { method: "PATCH", pattern: /^\/marked\/[a-f0-9]{24}$/i, ownership: "post" }
  ]
};

export const legacyAppCompatEnabled = (process.env.LEGACY_APP_COMPAT ?? "on").toLowerCase() !== "off";

/**
 * Finds the record being acted on.
 *
 * This middleware runs at the mount point, before the router has parsed any
 * `:id`, so `req.params` is empty here. The id is taken from the path or the
 * body instead.
 */
const targetId = (req: Request): string => {
  const fromPath = req.path.match(/\/([a-f0-9]{24})(?:\/|$)/i)?.[1];
  if (fromPath) return fromPath;

  const body = req.body as Record<string, unknown> | undefined;
  for (const key of ["id", "groupId", "postId"]) {
    const value = body?.[key];
    if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) return value;
  }
  return "";
};

const ownsRecord = async (kind: Ownership, id: string, actorId: string) => {
  if (kind === "none") return true;
  if (!mongoose.Types.ObjectId.isValid(id)) return false;

  if (kind === "group") {
    const group = await Group.findById(id).select("createdBy").lean();
    return group?.createdBy?.toString() === actorId;
  }

  const post = await Post.findById(id).select("createdBy").lean();
  return post?.createdBy?.toString() === actorId;
};

/**
 * Replaces `requireAdmin` on the four routers the old app touched.
 *
 * Staff pass as normal. A member passes only when the bridge is on, the
 * request matches one of the paths above, and they own the record when the
 * entry says so.
 */
export const allowLegacyMobileMember =
  (routerName: string) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    if (req.actor?.type === "admin") return next();

    const denied = forbidden("Administrator access is required.");

    if (!legacyAppCompatEnabled || !req.actor) return next(denied);

    const entry = ALLOWED[routerName]?.find(
      (candidate) => candidate.method === req.method && candidate.pattern.test(req.path)
    );

    if (!entry) return next(denied);

    try {
      const permitted = await ownsRecord(entry.ownership, targetId(req), req.actor.id);
      if (!permitted) {
        return next(forbidden("You can only change something you created."));
      }
    } catch (error) {
      return next(error);
    }

    logger.info(
      { router: routerName, method: req.method, path: req.path, actor: req.actor.id },
      "legacy mobile endpoint"
    );

    next();
  };

export const legacyCompatBanner = () => {
  if (!legacyAppCompatEnabled) return;
  logger.warn(
    { flag: "LEGACY_APP_COMPAT" },
    "Legacy mobile compatibility is ON: members may still reach the handful of /api/admin paths the shipped app uses. Set LEGACY_APP_COMPAT=off once the app update has rolled out."
  );
};

export default allowLegacyMobileMember;
