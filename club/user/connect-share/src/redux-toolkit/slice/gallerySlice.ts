import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
  galleryList : []
};


const gallerySlice = createSlice({
    name:"Gallery",
    initialState,
    reducers:{
        setGalleryList : (state, action) => {
          state.galleryList = action.payload;
        }
    }
});

export const {setGalleryList} = gallerySlice.actions;

export default gallerySlice.reducer;

