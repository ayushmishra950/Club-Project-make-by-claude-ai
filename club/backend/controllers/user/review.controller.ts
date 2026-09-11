import Review from "../../models/review.model.js";
import User from "../../models/user.model.js";
import { Request, Response } from "express";
import { getIO } from "../../utils/socketHelper.js";
import mongoose from "mongoose";


export const addReview = async (req: Request, res: Response) => {
    try {
        const { userId, message, rating } = req.body;
        const io = getIO();
        const user = await User.findById(userId);
        if (!user)  return res.status(404).json({ message: "User not found" });
        if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."})
        const review = new Review({ userId, message, rating, status: "pending" });
        await review.save();
 
        await review.populate("userId", "fullName profileImage");
        io.emit("newReview", review);
        res.status(201).json({ message: "Review added successfully", review });
    } catch (error: any) {
        res.status(500).json({ message: error?.message || "Internal server error" });
    }
};


export const getGlobalReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await Review.find({ status: "approved" }).populate({
            path:"userId", match:{isDeleted: false}, select:"fullName profileImage"
        });

        const filteredReviews = reviews.filter((r) => r.userId !== null);

        return res.status(200).json({ reviews: filteredReviews });
    } catch (err: any) {
        return res.status(500).json({ message: err?.message || "Internal server error" });
    }
};



export const getAllReviews = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        if (!userId) return res.status(400).json({ message: "User Id is required." });

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not authorized." });
        if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."});

        const reviews = await Review.find({ userId: userId })

        return res.status(200).json({ reviews });

    } catch (err: any) {
        return res.status(500).json({
            message: err?.message || "Internal server error",
        });
    }
};



