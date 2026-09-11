import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
  title: string;
  description: string;
  images: string[];
  imagesType: string;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;

  managedByAdmin: boolean;
}

const GroupSchema = new Schema<IGroup>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],

    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User"},
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    managedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.model<IGroup>("Group", GroupSchema);

export default Group;