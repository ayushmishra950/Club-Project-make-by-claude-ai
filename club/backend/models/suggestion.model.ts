import mongoose, { Schema, Document } from "mongoose";

export interface ISuggestionReply {
  userId: string;
  message: string;
  createdAt: Date;
}

export interface ISuggestion extends Document {
  suggestion: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  adminReply?: string;
  adminReplies?: ISuggestionReply[];
  userUnreadCount: number;
  adminUnreadCount: number;
}

const suggestionSchema: Schema<ISuggestion> = new Schema(
  {
    suggestion: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },

    adminReply: {
      type: String,
      default: null,
    },

    adminReplies: {
      type: [
        {
          userId: {
            type: String,
            required: true,
          },
          message: {
            type: String,
            required: true,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },

    userUnreadCount: {
      type: Number,
      default: 0,
    },

    adminUnreadCount: {
      type: Number,
      default: 0,
    },

  },
  {
    timestamps: true,
  }
);

export const Suggestion = mongoose.model<ISuggestion>(
  "Suggestion",
  suggestionSchema
);