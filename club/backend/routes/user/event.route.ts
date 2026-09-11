import express from "express";
import { z } from "zod";
import {
  addAndRemoveCandidateFromEvent,
  getAllEvent,
  getLatestEvent,
  getSingleEvent
} from "../../controllers/admin/event.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { validate, objectId } from "../../middlewares/validate.js";

/**
 * Events, as a member sees them.
 *
 * The mobile app read events through `/api/admin/event/...`, which is why
 * those endpoints could not be protected without breaking it. Members now have
 * their own read-only view plus the one write they need: marking interest.
 * Creating, editing and deleting an event stays on the admin router.
 *
 * `bindActor` has already replaced any `userId` in the body with the verified
 * caller, so a member cannot register somebody else's interest.
 */

const router = express.Router();

router.get("/get", asyncHandler(getAllEvent));
router.get("/latest", asyncHandler(getLatestEvent));
router.get("/getbyid/:id", validate({ params: z.object({ id: objectId }) }), asyncHandler(getSingleEvent));

router.post(
  "/candidate/interested",
  validate({ body: z.object({ eventId: objectId, userId: objectId.optional() }) }),
  asyncHandler(addAndRemoveCandidateFromEvent)
);

export default router;
