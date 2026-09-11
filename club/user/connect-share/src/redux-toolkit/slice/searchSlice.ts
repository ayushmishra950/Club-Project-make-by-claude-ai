import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
  searchQuery: ""
};


const searchSlice  = createSlice({
    name:"Search",
    initialState,
    reducers:{
        setSearchQuery : (state, action) => {
          state.searchQuery = action.payload;
        }
    }
});

export const {setSearchQuery} = searchSlice.actions;

export default searchSlice.reducer;

