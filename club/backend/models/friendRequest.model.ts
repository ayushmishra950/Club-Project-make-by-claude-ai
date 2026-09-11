import mongoose, { Schema, Document } from "mongoose";

export interface IFriendRequest extends Document {
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId; 
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
   statusSeen:"sent" | "delivered" | "seen";
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    statusSeen: {
  type: String,
  enum: ['sent', 'delivered', 'seen'],
  default: 'sent'
}
  },
  { timestamps: true } 
);


FriendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

/* Incoming and outgoing request lists, and the accepted-friends lookup. */
FriendRequestSchema.index({ to: 1, status: 1, createdAt: -1 });
FriendRequestSchema.index({ from: 1, status: 1, createdAt: -1 });

const FriendRequest = mongoose.model<IFriendRequest>(
  "FriendRequest",
  FriendRequestSchema
);

export default FriendRequest;