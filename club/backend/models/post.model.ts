import mongoose, { Schema, Document } from "mongoose";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  likes: mongoose.Types.ObjectId[]; // users who liked the comment
  replies: IComment[]; // nested replies
}

export interface IPost extends Document {
  title: string;
  description: string;
  images: string[]; // multiple images support
  createdBy: mongoose.Types.ObjectId;
  create: string;
  type: string;

  likes: mongoose.Types.ObjectId[]; // users who liked
  comments: IComment[];

  createdAt: Date;
  updatedAt: Date;
  important: boolean;
  notes: string;
  isPinned: boolean;
  /** Members who chose not to see this post. App Store guideline 1.2. */
  hiddenBy: mongoose.Types.ObjectId[];
}

const commentSchema = new Schema<IComment>({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  replies: [], // ✅ recursive schema
});

commentSchema.add({
  replies: [commentSchema],
});

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      default: ""
    },

    images: [
      {
        type: String,
      },
    ],


    type: {
      type: String,
      required: true,
    },

    createdBy: {
      type: mongoose.Types.ObjectId,
      required: true,
      refPath: "create",
    },
    create: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    important: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false
    },

    likes: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

postSchema.add({
  /* Content filtering. Apple requires a way for a member to remove an
     individual post from their own feed immediately, without waiting for a
     moderator. This is that list; the feed query excludes it. */
  hiddenBy: [{ type: mongoose.Types.ObjectId, ref: "User" }]
});

/* Feed queries filter on this, so it is part of the feed index. */
postSchema.index({ hiddenBy: 1 });

/* The feed: pinned posts first, then newest. Matches the sort exactly so
   MongoDB never has to sort in memory (and never hits the 32 MB sort limit). */
postSchema.index({ isPinned: -1, createdAt: -1 });

/* A single member's posts, shown on their profile. */
postSchema.index({ createdBy: 1, createdAt: -1 });

/* Admin post management, split by author type and visibility. */
postSchema.index({ create: 1, type: 1, createdAt: -1 });

const Post = mongoose.model<IPost>("Post", postSchema);

export default Post;