import express from "express";
import { z } from "zod";
import { getAllGroups, toggleMember, removeMemberFromGroup } from "../../controllers/user/group.controller.js";
import {
  addMember,
  createGroup,
  deleteGroup,
  getGroupById,
  removeMember,
  updateGroup
} from "../../controllers/admin/group.controller.js";
import upload from "../../middlewares/upload.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { requireGroupOwner } from "../../middlewares/ownership.js";
import { uploadLimiter } from "../../middlewares/rateLimit.js";
import { validate, objectId } from "../../middlewares/validate.js";

/**
 * Groups, as a member sees them.
 *
 * The mobile app created and managed groups through `/api/admin/group/...`,
 * so those endpoints could not be locked to staff without breaking it. The
 * same controllers are mounted here with two differences: `bindActor` forces
 * the creator to be the caller, and `requireGroupOwner` means a member can
 * only change a group they created.
 */

const router = express.Router();

router.get("/get", asyncHandler(getAllGroups));
router.get("/getbyid/:id", validate({ params: z.object({ id: objectId }) }), asyncHandler(getGroupById));

router.post("/toggle-member", asyncHandler(toggleMember));
router.post("/remove-member", asyncHandler(removeMemberFromGroup));

/* ---- creating and managing your own group ---- */

router.post(
  "/add",
  uploadLimiter,
  upload.fields([{ name: "media", maxCount: 4 }]),
  asyncHandler(createGroup)
);

router.put(
  "/update",
  uploadLimiter,
  upload.fields([{ name: "media", maxCount: 4 }]),
  requireGroupOwner,
  asyncHandler(updateGroup)
);

router.post("/addmember", requireGroupOwner, asyncHandler(addMember));

// The web app removes a member with PUT /removemember and a body; the mobile
// app uses POST /remove-member. Both are kept so neither client has to change.
router.put("/removemember", requireGroupOwner, asyncHandler(removeMember));

router.delete(
  "/delete/:id",
  validate({ params: z.object({ id: objectId }) }),
  requireGroupOwner,
  asyncHandler(deleteGroup)
);

export default router;
