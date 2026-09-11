import type { Request, Response } from "express";
import Post from "../../models/post.model.js";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";
import Admin from "../../models/admin.model.js";
import User from "../../models/user.model.js";
import { getIO } from "../../utils/socketHelper.js";

// ✅ Create Post with multiple images
export const createPost = async (req: any, res: any) => {
  try {
    const { title, description, userId, type, isPinned } = req.body;

    if (!title || !description || !userId || !type) {
      return res.status(400).json({ message: "Title, description, type are required." });
    }

    let user = await Admin.findById(userId);
    if (!user) {
      user = await User.findById(userId);
    }

    const files = req.files?.images as any[]; // frontend se multiple files array

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "At least one image is required." });
    }

    // Upload all images to Cloudinary
    const imageUrls = [];
    for (const file of files) {
      const url = await uploadToCloudinary(file.buffer, file.mimetype, "post");
      imageUrls.push(url);
    }

    const post = await Post.create({
      title,
      description,
      images: imageUrls, // store array of image URLs
      type,
      createdBy: userId,
      create: (user?.role === "admin" || user?.role === "super_admin") ? "Admin" : "User",
      isPinned: isPinned === "true" || isPinned === true ? true : false,
    });

    await post.populate("createdBy", "fullName profileImage email occupation");

     const io = getIO();
    io.emit("postRefresh", post);
    
    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });

   
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

  
// ✅ Get All Posts
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .populate("createdBy", "name email fullName profileImage occupation role")
      .populate("comments.user", "fullName name profileImage")
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ Get Single Post
export const getSinglePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("comments.user", "name");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ✅ Update Post with optional multiple images
export const updatePost = async (req: any, res: any) => {
  try {
    const { title, description, type, postId, userId, isPinned } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Update fields
    post.title = title || post.title;
    post.description = description || post.description;
    post.type = type || post.type;
    if (isPinned !== undefined) {
      post.isPinned = isPinned === "true" || isPinned === true ? true : false;
    }

    // Update images if new files provided
    const files = req.files?.images as any[];
    if (files && files.length > 0) {
      const imageUrls = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file.buffer, file.mimetype, "post");
        imageUrls.push(url);
      }
      post.images = imageUrls; // overwrite old images with new ones
    }

    await post.save();

    await post.populate("createdBy", "fullName profileImage email occupation");

    res.status(200).json({ success: true, message: "Post updated successfully", post});

    const io = getIO();
    io.emit("postRefresh");
  } catch (err: any) {
    res.status(500).json({success: false, message: err.message});
  }
};

// ✅ Delete Post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });

    const io = getIO();
    io.emit("postRefresh");
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ Like / Unlike Post (Toggle)
export const toggleLikePost = async (req: Request, res: Response) => {
  const { userId, postId } = req.body;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

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
    const { text, userId } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = {
      user: userId,
      text,
      createdAt: new Date(),
    };

    post.comments.push(comment as any);

    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment added",
      comments: post.comments,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ Delete Comment
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { postId, commentId, userId } = req.params;
    if (!userId) return res.status(400).json({ message: "post, comment or user is required." })
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.find(
      (c: any) => c._id.toString() === commentId
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // only comment owner delete kare
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    post.comments = post.comments.filter(
      (c: any) => c._id.toString() !== commentId
    );

    await post.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted",
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};








export const togglePinnedPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    if (!postId) return res.status(400).json({ message: "PostId not Found." });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post Not Found." });

    post.isPinned = !post?.isPinned;
    await post.save();

    res.status(200).json({ message: `This Post ${post?.isPinned ? "Pinned" : "Unpinned"} successfully.` })

    const io = getIO();
    io.emit("postRefresh");
  }
  catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Unknown error" });
    }
  }
}