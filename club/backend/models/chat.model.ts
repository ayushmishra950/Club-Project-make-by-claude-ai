import mongoose, { Schema, Document } from "mongoose";

interface IBlockedMember {
  user: mongoose.Types.ObjectId;
  blockedBy: mongoose.Types.ObjectId;
  blockedAt: Date;
}

export interface IChat extends Document {
  members: mongoose.Types.ObjectId[];
  pendingMembers: mongoose.Types.ObjectId[];
  isGroup: boolean;
  lastMessage?: mongoose.Types.ObjectId | null;
  groupId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  blockedMembers?: IBlockedMember[];
}

const ChatSchema = new Schema<IChat>(
  {
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    ],
    pendingMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isGroup: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
   blockedMembers: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
  },
],
  },
  { timestamps: true }
);

/* A member's chat list, most recently active first. */
ChatSchema.index({ members: 1, updatedAt: -1 });

/* Group chats are looked up by the group they belong to. */
ChatSchema.index({ groupId: 1 }, { sparse: true });

export default mongoose.model<IChat>("Chat", ChatSchema);