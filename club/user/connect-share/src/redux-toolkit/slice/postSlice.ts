import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  postList: []
};


const postSlice = createSlice({
  name: "Posts",
  initialState,
  reducers: {
    setPostList: (state, action) => {
      state.postList = action.payload;
    },

    /** Appends the next page of the feed, skipping anything already held. */
    appendPostList: (state, action) => {
      const existing = new Set(state.postList.map((post) => post?._id));
      for (const post of action.payload ?? []) {
        if (!existing.has(post?._id)) state.postList.push(post);
      }
    },

    setPostLikeAnUnLike: (state, action) => {
      const { postId, userId } = action.payload;
      const item = state?.postList?.find((p) => p?._id === postId);
      if (item) {
        item.likes = item?.likes?.filter((l) => l !== userId);
      }
      else {
        item.likes.push(userId);
      }
    },

    setPostComment: (state, action) => {
      const { postId, text, userId, fullName } = action.payload;
      const post = state.postList.find(p => p._id === postId);
      if (!post) return;

      const newComment = {
        _id: Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
        user: {
          user: userId,
          fullName: fullName
        },
      };

      if (!post.comments) post.comments = [];
      post.comments.push(newComment);
    },

    setPostLikeAnUnLikeComment: (state, action) => {
      const { postId, commentId, userId } = action.payload;
      const post = state.postList.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c._id === commentId);
      if (!comment) return;
      if (comment.likes.includes(userId)) {
        comment.likes = comment.likes.filter(l => l !== userId);
      } else {
        comment.likes.push(userId);
      }

    },

    setPostReplyComment: (state, action) => {
      const { postId, commentId, text, userId, fullName } = action.payload;
      const post = state.postList.find(p => p._id === postId);
      if (!post) return;
      const comment = post.comments.find(c => c._id === commentId);
      if (!comment) return;
      const newReply = {
        _id: Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
        user: {
          user: userId,
          fullName: fullName
        },
      };
      if (!comment.replies) comment.replies = [];
      comment.replies.push(newReply);
    },


    setDeletePostFromList: (state, action: PayloadAction<{ postId: string; userId: string }>) => {
      const { postId, userId } = action.payload;

      const postIndex = state.postList.findIndex(
        (p) => p._id === postId && p.createdBy?._id === userId
      );

      if (postIndex !== -1) {
        state.postList.splice(postIndex, 1);
      }
    },

    setRemoveUserPosts: (state, action) => {
      const userId = action.payload?._id;
      if (!userId) return;
      state.postList = state.postList.filter((post) => post?.createdBy?._id !== userId);
    },

    setNewPost: (state, action) => {
      const newPost = action.payload;

      const exists = state.postList.some((post) => post?._id === newPost?._id);

      if (!exists) {
        state.postList.unshift(newPost);
      }
    },
    addOrUpdatePost: (state, action) => {
      const newPost = action.payload;

      const index = state.postList.findIndex(
        (post) => post._id === newPost._id
      );

      if (index !== -1) {
        // ✅ UPDATE existing post
        state.postList[index] = {
          ...state.postList[index],
          ...newPost,
        };
      } else {
        // ✅ ADD new post
        state.postList.unshift(newPost); // top pe add (feed style)
      }
    }


  }

});

export const { setPostList, appendPostList, setNewPost,addOrUpdatePost, setRemoveUserPosts, setPostLikeAnUnLike, setPostComment, setDeletePostFromList, setPostLikeAnUnLikeComment, setPostReplyComment } = postSlice.actions;

export default postSlice.reducer;

