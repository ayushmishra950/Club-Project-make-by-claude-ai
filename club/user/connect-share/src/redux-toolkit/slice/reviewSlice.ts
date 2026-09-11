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
}
  }
});

export const { setReviewList,setNewReview, setRemoveReview } = reviewSlice.actions;

export default reviewSlice.reducer;

