import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
  postList : []
};


const postSlice = createSlice({
    name:"Posts",
    initialState,
    reducers:{
        setPostList : (state, action) => {
          state.postList = action.payload;
        },

        setDeletePostFromList: (state, action: PayloadAction<{ postId: string; userId: string }>) => {
      const { postId, userId } = action.payload;

      const postIndex = state.postList.findIndex(
        (p) => p._id === postId && p.createdBy?._id === userId
      );

      if (postIndex !== -1) {
        state.postList.splice(postIndex, 1);
      }
    }
    }
});

export const {setPostList, setDeletePostFromList} = postSlice.actions;

export default postSlice.reducer;

