import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  reviewsList: []
};


const reviewSlice = createSlice({
  name: "Reviews",
  initialState,
  reducers: {
    setReviewList: (state, action) => {
      state.reviewsList = action.payload;
    },
    setNewReview: (state, action) => {
      const newItem = action.payload;

      const index = state?.reviewsList?.findIndex(
        (item) => item._id === newItem._id
      );

      if (index !== -1) {
        state.reviewsList[index] = newItem;
      } else {
        state.reviewsList.unshift(newItem);
      }
    },

    setRemoveReview: (state, action) => {
      const id = action.payload;

      state.reviewsList = state.reviewsList.filter(
        (item) => item._id !== id
      );
    },

    setReviewStatus: (state, action) => {
      const { reviewId, status, adminReply } = action.payload;

      state.reviewsList = state.reviewsList.map((item) => item._id === reviewId ? { ...item, status, adminReply: adminReply } : item
      );
    }
  }
});

export const { setReviewList, setNewReview, setRemoveReview, setReviewStatus } = reviewSlice.actions;

export default reviewSlice.reducer;

