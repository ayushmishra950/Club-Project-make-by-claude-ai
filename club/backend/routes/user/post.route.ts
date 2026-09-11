import express from "express";
import { z } from "zod";
import {
  toggleLikePost,
  addPostNotes,
  deletePost,
  getAllPosts,
  sharePost,
  hidePost,
  unhidePost,
  addComment,
  likeUnlikeComment,
  replyToComment
} from "../../controllers/user/post.controller.js";
import { createPost, updatePost } from "../../controllers/admin/post.controller.js";
import upload from "../../middlewares/upload.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { requirePostAuthor, stripPrivilegedPostFields } from "../../middlewares/ownership.js";
import { uploadLimiter } from "../../middlewares/rateLimit.js";
import { validate, objectId, pagination } from "../../middlewares/validate.js";

const router = express.Router();

router.get(
  "/get/:userId",
  validate({ params: z.object({ userId: objectId }), query: pagination }),
  asyncHandler(getAllPosts)
);

/**
 * Creating a post with images.
 *
 * The mobile app posted to `/api/admin/post/add` for this, which is why that
 * endpoint could not be locked to staff. The same controller runs here, with
 * `bindActor` forcing the author to the caller and `stripPrivilegedPostFields`
 * removing `isPinned` so a member cannot pin their own post to the top of
 * everyone's feed.
 */
router.post(
  "/add",
  uploadLimiter,
  upload.fields([{ name: "images", maxCount: 3 }]),
  stripPrivilegedPostFields,
  asyncHandler(createPost)
);

router.put(
  "/update",
  uploadLimiter,
  upload.fields([{ name: "images", maxCount: 3 }]),
  stripPrivilegedPostFields,
  requirePostAuthor,
  asyncHandler(updatePost)
);

router.post("/like/toggle", asyncHandler(toggleLikePost));
router.post("/notes/add", asyncHandler(addPostNotes));
router.post("/comment/add", asyncHandler(addComment));
router.post("/comment/like-toggle", asyncHandler(likeUnlikeComment));
router.post("/comment/reply", asyncHandler(replyToComment));
router.post("/share", asyncHandler(sharePost));

/* Content filtering, App Store guideline 1.2: remove one post from my own
   feed immediately. Personal, not moderation. */
router.post(
  "/hide",
  validate({ body: z.object({ userId: objectId.optional(), postId: objectId }) }),
  asyncHandler(hidePost)
);
router.post(
  "/unhide",
  validate({ body: z.object({ userId: objectId.optional(), postId: objectId }) }),
  asyncHandler(unhidePost)
);
router.put("/delete", asyncHandler(deletePost));

export default router;
