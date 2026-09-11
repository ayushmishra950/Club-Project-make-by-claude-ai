import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
  announcementList : []
};


const announcementSlice = createSlice({
    name:"Announcement",
    initialState,
    reducers:{
        setAnnouncementList : (state, action:PayloadAction<any[]>) => {
          state.announcementList = action.payload;
        }
    }
});

export const {setAnnouncementList} = announcementSlice.actions;

export default announcementSlice.reducer;

