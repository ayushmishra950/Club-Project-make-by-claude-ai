import { Router } from "express";
import { z } from "zod";
import { addReview, getAllReviews, getGlobalReviews } from "../../controllers/user/review.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { validate, objectId } from "../../middlewares/validate.js";

const router = Router();

router.post(
  "/add",
  validate({
    body: z.object({
      userId: objectId.optional(),
      message: z.string().trim().min(3, "Write a few words.").max(1000),
      rating: z.coerce.number().int().min(1).max(5)
    })
  }),
  asyncHandler(addReview)
);

/* "/get/global" must be declared before "/get/:id".
   Express matches in order, so with the reverse order the literal path was
   swallowed by the parameter route, "global" was cast as an ObjectId and the
   reviews screen answered 500 every time. */
router.get("/get/global", asyncHandler(getGlobalReviews));

router.get("/get/:id", validate({ params: z.object({ id: objectId }) }), asyncHandler(getAllReviews));

export default router;
