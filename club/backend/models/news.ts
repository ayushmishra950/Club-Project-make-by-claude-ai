import mongoose, { Schema, Document } from "mongoose";

export interface INews extends Document {
  title: string;
  description: string;
  category: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NewsSchema: Schema<INews> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy:{
        type:mongoose.Types.ObjectId,
        ref:"Admin",
    }
  },
  {
    versionKey: false,
  }
);

const NewsModel = mongoose.model<INews>("News", NewsSchema);

export default NewsModel;