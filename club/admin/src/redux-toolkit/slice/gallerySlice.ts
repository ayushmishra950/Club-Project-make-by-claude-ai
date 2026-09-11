import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// import {Event} from "@/types/index";

// interface eventType {
//     eventList : Event[];
// }

const initialState = {
  galleryList: []
};


const gallerySlice = createSlice({
  name: "Gallery",
  initialState,
  reducers: {
    setGalleryList: (state, action) => {
      state.galleryList = action.payload;
    },
    setNewGallery: (state, action) => {
      const newItem = action.payload;

      const index = state.galleryList.findIndex(
        (item) => item._id === newItem._id
      );

      if (index !== -1) {
        state.galleryList[index] = newItem;
      } else {
        state.galleryList.unshift(newItem);
      }
    },

   setRemoveGallery: (state, action) => {
  const id = action.payload;

  state.galleryList = state.galleryList.filter(
    (item) => item._id !== id
  );
}
  }
});

export const { setGalleryList,setRemoveGallery, setNewGallery } = gallerySlice.actions;

export default gallerySlice.reducer;

