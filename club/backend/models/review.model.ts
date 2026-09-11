import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  message: string;
  status: string;
  adminReply: string;
  rating?: number;
  createdAt: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    rating:{
      type: Number,
      min: 0,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminReply: {
      type: String,
      default: "",
    },
  },
  {
    versionKey: false,
  }
);

const ReviewModel = mongoose.model<IReview>("Review", ReviewSchema);

export default ReviewModel;