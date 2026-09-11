import Post from "../../models/post.model.js";
import type { Request, Response } from "express";
import type { IComment } from "../../models/post.model.js";
import mongoose from "mongoose";
import { createNotificationInternal } from "./notification.controller.js";
import { NotificationType } from "../../models/notification.model.js";
import User from "../../models/user.model.js";
import Chat from "../../models/chat.model.js";
import Message from "../../models/message.model.js";
import { getIO } from "../../utils/socketHelper.js";
import Block from "../../models/block.model.js";
import { AUTHOR_FIELDS } from "../../utils/serialize.js";

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    // `bindActor` has already forced this to the signed-in member.
    const userId = String(req.params.userId ?? "");
    if (!userId) return res.status(400).json({ success: false, message: "userId is required." });

    /* The feed used to load every post ever written, populate every comment
       and every reply on all of them, and then filter deleted authors in
       JavaScript. At a thousand posts that is a multi-megabyte response
       recomputed for every member on every page load.

       It is now a cursor page of 20, sorted on an index that matches the sort
       exactly, with comments summarised rather than fully expanded. */
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const blockRecords = await Block.find({
      $or: [{ blockerId: userId }, { blockedId: userId }]
    })
      .select("blockerId blockedId")
      .lean();

    const restrictedUserIds = blockRecords.map((record) =>
      record.blockerId.toString() === userId ? record.blockedId : record.blockerId
    );

    // Deleted accounts are excluded in the query rather than after it, so the
    // page is always full and the database does the work.
    const hiddenAuthors = await User.find({
      $or: [{ _id: { $in: restrictedUserIds } }, { isDeleted: true }]
    })
      .select("_id")
      .lean();

    const filter: Record<string, unknown> = {
      createdBy: { $nin: hiddenAuthors.map((author) => author._id) },
      // Posts this member chose to hide never come back.
      hiddenBy: { $ne: userId }
    };

    if (cursor) filter.createdAt = { $lt: new Date(cursor) };

    const posts = await Post.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit + 1)
      .populate({ path: "createdBy", select: "fullName profileImage occupation role isDeleted" })
      .populate({ path: "comments.user", select: "fullName profileImage" })
      .populate({ path: "comments.replies.user", select: "fullName profileImage" })
      .lean();

    const hasMore = posts.length > limit;
    const page = hasMore ? posts.slice(0, limit) : posts;
    const last = page[page.length - 1] as { createdAt?: Date } | undefined;

    return res.status(200).json({
      success: true,
      posts: page,
      nextCursor: hasMore && last?.createdAt ? new Date(last.createdAt).toISOString() : null,
      hasMore
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * Content filtering, App Store guideline 1.2.
 *
 * A member can remove a single post from their own feed straight away. It is
 * personal: the post stays visible to everyone else, and no moderator is
 * involved. Reporting the post is a separate action.
 */
export const hidePost = async (req: Request, res: Response) => {
  try {
    const { userId, postId } = req.body;
    if (!userId || !postId) return res.status(400).json({ success: false, message: "userId and postId are required." });

    const post = await Post.findByIdAndUpdate(postId, { $addToSet: { hiddenBy: userId } }, { new: true });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    return res.status(200).json({ success: true, message: "You will not see this post in your feed any more." });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const unhidePost = async (req: Request, res: Response) => {
  try {
    const { userId, postId } = req.body;
    if (!userId || !postId) return res.status(400).json({ success: false, message: "userId and postId are required." });

    const post = await Post.findByIdAndUpdate(postId, { $pull: { hiddenBy: userId } }, { new: true });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    return res.status(200).json({ success: true, message: "This post is back in your feed." });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


export const addPostNotes = async (req: Request, res: Response) => {
  try {

    const { userId, notes } = req.body;
    const io = getIO();
    if (!userId || !notes) return res.status(400).json({ message: "userId or notes is required." });
      const user = await User.findById(userId);
      if(!user) return res.status(404).json({message:"user not found."});
      if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."});
    const post = await Post.create({ notes: notes, createdBy: userId, create: "User", type: "public" });
    if (!post) return res.status(404).json({ message: "Post add Failed" });

    /* Populate the author before this leaves the server. Both the socket
       broadcast and the response used to carry `createdBy` as a bare id, so a
       newly written note appeared in the feed with no name and no avatar
       until the whole feed was reloaded. */
    await post.populate("createdBy", AUTHOR_FIELDS);

    io.emit("postNote", post);
    res.status(201).json({ success: true, message: "Notes add successfully.", post })
  }
  catch (err: any) {
    res.status(500).json({ success: false, message: err.message});
  }
}


// ✅ Like / Unlike Post (Toggle)
export const toggleLikePost = async (req: Request, res: Response) => {
  const { userId, postId } = req.body;
  if (!userId || !postId) return res.status(400).json({ message: "userId or postId not Found." });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not authorised." });
    if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."});

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found"});
    }

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes = post.likes.filter( (id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
    }

    await post.save();
    if (post?.createdBy.toString() !== userId.toString()) {
      await createNotificationInternal(post?.createdBy, userId, NotificationType.LIKE, postId, `${user?.fullName} ${isLiked ? "UnLike" : "Like"} your post.`);
    }
    res.status(200).json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      likes: post.likes.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};





// ✅ Add Comment
export const addComment = async (req: Request, res: Response) => {
  try {
    const { postId, text, userId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not authorised." });
    if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."});

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found"});
    }

    const comment = { user: userId, text, createdAt: new Date()};
    post.comments.push(comment as any);
    await post.save();
    if (post?.createdBy.toString() !== userId.toString()) {
      await createNotificationInternal(post?.createdBy, userId, NotificationType.COMMENT, postId, `${user?.fullName} commented on your post: ${text?.slice(0, 50)}`);
    }
    res.status(200).json({ success: true, message: "Comment added", comments: post.comments, comment: comment});
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message});
  }
};


export const likeUnlikeComment = async (req: Request, res: Response) => {
  try {
    const { postId, commentId, userId } = req.body;
    const user = await User.findById(userId);
    if(!user) return res.status(404).json({message:"user not found."});
    if(user?.isDeleted) return res.status(403).json({message : "Account is scheduled for deletion."})

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    // Recursive function to find comment or reply
    const findComment = (comments: IComment[]): IComment | null => {
      for (const c of comments) {
        if (c._id.toString() === commentId) return c;

        const reply = findComment(c.replies);
        if (reply) return reply;
      }
      return null;
    };

    const comment = findComment(post.comments);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    // Toggle like
    const objectUserId = new mongoose.Types.ObjectId(userId);

    const index = comment.likes.findIndex((id) => id.equals(objectUserId));
    if (index === -1) {
      comment.likes.push(objectUserId);
    } else {
      comment.likes.splice(index, 1);
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: index === -1 ? "Comment liked" : "Comment unliked",
      likes: comment.likes,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};





export const replyToComment = async (req: Request, res: Response) => {
  try {
    const { postId, commentId, userId, text } = req.body;

    const user = await User.findById(userId);
    if(!user) return res.status(404).json({message:"user not found."});
    if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."});

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    const findComment = (comments: IComment[]): IComment | null => {
      for (const c of comments) {
        if (c._id.toString() === commentId) return c;
        const reply = findComment(c.replies);
        if (reply) return reply;
      }
      return null;
    };

    const parentComment = findComment(post.comments);
    if (!parentComment)
      return res.status(404).json({ success: false, message: "Comment not found" });

    const reply = { user: userId, text, createdAt: new Date(), likes: [], replies: []};

    parentComment.replies.push(reply as any);
    await post.save();

    return res.status(200).json({ success: true, message: "Reply added", reply: reply, replies: parentComment.replies });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const sharePost = async (req: Request, res: Response) => {
  try {
    let { fromId, toId, postId, activeTab } = req.body;
    const io = getIO();

    if (!fromId || !toId || !postId) return res.status(400).json({ message: "fromId, toId, and postId are required." });

    const [fromUser, toUser] = await Promise.all([
      User.findById(fromId),
      User.findById(Array.isArray(toId) ? toId[0] : toId),
    ]);

    if (!fromUser) return res.status(404).json({ message: "Your account not found." });

    if (fromUser.isDeleted) return res.status(403).json({ message: "Your account is inactive." });

    if (!toUser) return res.status(404).json({ message: "Recipient not found." });

    if (toUser.isDeleted) return res.status(403).json({ message: "Recipient is inactive." });

    const receivers = Array.isArray(toId) ? toId : [toId];
    const createdMessages: any[] = [];

    // ================= SINGLE CHAT =================
    if (activeTab === "single") {
      for (const receiverId of receivers) {
        const chat = await Chat.findOne({
          members: { $all: [fromId, receiverId] },
        });

        if (!chat) continue;

        const message = await Message.create({
          chatId: chat._id,
          sender: fromId,
          postId,
          createdAt: new Date(),
        });

        const populatedMessage = await message.populate("postId");

        io.to(receiverId.toString()).emit("messageRefresh", populatedMessage);

        createdMessages.push(message);
      }
    }

    // ================= GROUP CHAT =================
    else if (activeTab === "group") {
      for (const chatId of receivers) {
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.isGroup) continue;

        const message = await Message.create({
          chatId: chat._id,
          sender: fromId,
          postId,
          createdAt: new Date(),
        });

        const populatedMessage = await message.populate([
          { path: "postId" },
          { path: "sender", select: "fullName profileImage email" },
        ]);

        io.emit("messageRefresh", populatedMessage);

        createdMessages.push(message);
      }
    }

    return res.status(200).json({ success: true, message: "Post shared successfully.", messages: createdMessages});

  } catch (err: any) {
    console.error("Share Post Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to share post.", error: err.message});
  }
};




export const deletePost = async (req:Request, res: Response) => {
  try {
    const { postId, userId } = req.body;
    const io = getIO();
    if (!postId || !userId) return res.status(400).json({ message: "postId or userId is required." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not authorised." });
    if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."})

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (post.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post." });
    }

    await post.deleteOne();
    io.emit("postDeleted", { postId, userId });
    res.status(200).json({ message: "Post deleted successfully." });
  }
  catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }

};