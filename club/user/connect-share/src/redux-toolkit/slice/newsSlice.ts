import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  newsList: []
};


const newsSlice = createSlice({
  name: "News & Updates",
  initialState,
  reducers: {
    setNewsList: (state, action) => {
      state.newsList = action.payload;
    },
    setNewNews: (state, action) => {
      const newItem = action.payload;

      const index = state?.newsList?.findIndex(
        (item) => item._id === newItem._id
      );

      if (index !== -1) {
        state.newsList[index] = newItem;
      } else {
        state.newsList.unshift(newItem);
      }
    },

   setRemoveNews: (state, action) => {
  const id = action.payload;

  state.newsList = state.newsList.filter(
    (item) => item._id !== id
  );
}
  }
});

export const { setNewsList,setNewNews, setRemoveNews } = newsSlice.actions;

export default newsSlice.reducer;

