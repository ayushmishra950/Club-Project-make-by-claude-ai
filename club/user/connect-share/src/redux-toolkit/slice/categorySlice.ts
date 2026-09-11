import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
  categoryList : []
};


const categorySlice = createSlice({
    name:"Category",
    initialState,
    reducers:{
        setCategoryList : (state, action:PayloadAction<any[]>) => {
          state.categoryList = action.payload;
        }
    }
});

export const {setCategoryList} = categorySlice.actions;

export default categorySlice.reducer;

