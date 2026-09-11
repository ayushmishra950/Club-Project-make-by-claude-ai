import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Group from "../models/group.model.js";
import Post from "../models/post.model.js";
import { badRequest, forbidden, notFound } from "../utils/appError.js";

/**
 * Ownership checks for member-scoped routes.
 *
 * The admin routers can edit anything by definition. The member routers reuse
 * the same controllers, so the "is this yours?" question has to be answered
 * before the controller runs. Staff bypass every check here.
 */

const readId = (req: Request, ...keys: string[]) => {
  for (const key of keys) {
    const fromParams = req.params?.[key];
    if (fromParams) return String(fromParams);

    const body = req.body as Record<string, unknown> | undefined;
    const fromBody = body?.[key];
    if (typeof fromBody === "string" && fromBody) return fromBody;
  }
  return "";
};

/** The member who created the group, or any admin. */
export const requireGroupOwner = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (req.actor?.type === "admin") return next();

    const groupId = readId(req, "id", "groupId");
    if (!mongoose.Types.ObjectId.isValid(groupId)) throw badRequest("That is not a valid group id.");

    const group = await Group.findById(groupId).select("createdBy").lean();
    if (!group) throw notFound("That group could not be found.");

    if (group.createdBy?.toString() !== req.actor?.id) {
      throw forbidden("Only the member who created this group can change it.");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/** The member who wrote the post, or any admin. */
export const requirePostAuthor = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (req.actor?.type === "admin") return next();

    const postId = readId(req, "id", "postId");
    if (!mongoose.Types.ObjectId.isValid(postId)) throw badRequest("That is not a valid post id.");

    const post = await Post.findById(postId).select("createdBy").lean();
    if (!post) throw notFound("That post could not be found.");

    if (post.createdBy?.toString() !== req.actor?.id) {
      throw forbidden("You can only change your own posts.");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Members may not pin their own posts, and may not publish as the club.
 * Strips those fields before the shared controller sees them.
 */
export const stripPrivilegedPostFields = (req: Request, _res: Response, next: NextFunction) => {
  if (req.actor?.type === "admin") return next();

  const body = req.body as Record<string, unknown>;
  if (body) {
    delete body.isPinned;
    delete body.create;
  }
  next();
};
