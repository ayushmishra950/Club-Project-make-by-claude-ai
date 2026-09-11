import express from "express";
import { getReviews, getGlobalReviews, getReviewById, updateReview, deleteReview, reviewStatusUpdate } from "../../controllers/admin/review.controller.js";

const router = express.Router();

router.get("/get", getReviews);
router.get("/getbyid/:id", getReviewById);
router.put("/update", updateReview);
router.delete("/delete/:id", deleteReview);
router.patch("/status/update", reviewStatusUpdate);
router.get("/get-global-reviews", getGlobalReviews);


export default router;