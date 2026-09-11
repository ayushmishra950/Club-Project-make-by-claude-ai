import { Request, Response } from "express";
import ReviewModel from "../../models/review.model.js";
import { getIO } from "../../utils/socketHelper.js";


// ✅ GET ALL REVIEWS
export const getReviews = async (_req: Request, res: Response) => {
  try {
    const reviews = await ReviewModel.find().sort({ createdAt: -1 }).populate("userId", "fullName profileImage");

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


   

export const getGlobalReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await ReviewModel.find({ status: "approved" }).populate("userId", "fullName profileImage");
    return res.status(200).json({ reviews });
  } catch (err: any) {
    return res.status(500).json({
      message: err?.message || "Internal server error",
    });
  }
};

// ✅ GET SINGLE REVIEW
export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const review = await ReviewModel.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ UPDATE REVIEW
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id, ...obj } = req.body;
    const io = getIO();

    const updatedReview = await ReviewModel.findByIdAndUpdate(
      id,
      obj,
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    };

    io.emit("addReview", updatedReview);

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ DELETE REVIEW
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const io = getIO();

    const deletedReview = await ReviewModel.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    };

    io.emit("deleteReview", id);
    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const reviewStatusUpdate = async (req: Request, res: Response) => {
  try {
    const io = getIO();
    const { reviewId, status, adminReply } = req.body;

    /* A reply used to be mandatory, so an admin could not approve a review
       without writing one, and the error named a field ("message") that this
       endpoint does not take. Only the id and the new status are required. */
    if (!reviewId || !status) {
      return res.status(400).json({ message: "reviewId and status are required." });
    }

    const update: Record<string, unknown> = { status };
    if (typeof adminReply === "string" && adminReply.trim()) update.adminReply = adminReply.trim();

    const updateReview = await ReviewModel.findByIdAndUpdate(reviewId, update, { new: true });
    if (!updateReview) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    io.emit("updateReview", updateReview);
    return res.status(200).json({ success: true, message: "Review status updated successfully", data: updateReview });

  }
  catch (err: any) {
    res.status(500).json({ message: err.message || "Something went wrong" });
  }
}