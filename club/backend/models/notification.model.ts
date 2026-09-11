import mongoose, { Schema, Document } from "mongoose";

export enum NotificationType {
  LIKE = "like",
  COMMENT = "comment",
  FRIEND_REQUEST = "friend_request",
  FRIEND_ACCEPT = "friend_accept",
  FRIEND_CANCEL = "friend_cancel",
  ANNOUNCEMENT = "announcement",
  FOLLOW = "follow",
  MESSAGE = "message",
  POST = "post",
  EVENT = "event",
  SUGGESTION = "suggestion",
  NEW_USER = "new_user",
}

export interface INotification extends Document {
  sender: mongoose.Types.ObjectId;   
  receiver: mongoose.Types.ObjectId; 
  type: NotificationType;            
  post?: mongoose.Types.ObjectId;   
  message?: string;                  
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  date:string;
  status?: 'pending' | 'cancelled' | 'accepted' | "";
}

const notificationSchema = new Schema<INotification>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post"
    },
    message: {
      type: String
    },
    isRead: {
      type: Boolean,
      default: false
    },
    date:{
        type:String,
        required:true
    },
    status:{
      type:String, 
       default: "pending"
    }
  },
  {
    timestamps: true
  }
);

/* A member's notification list, unread first. */
notificationSchema.index({ receiver: 1, createdAt: -1 });
notificationSchema.index({ receiver: 1, isRead: 1 });

/* Broadcast types (announcements, suggestions) are queried by type alone. */
notificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema
);