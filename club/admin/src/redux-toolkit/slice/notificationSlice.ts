import {createSlice, PayloadAction} from "@reduxjs/toolkit";

const initialState = {
  notificationList : []
};


const notificationSlice = createSlice({
    name:"Notification",
    initialState,
    reducers:{
        setNotificationList : (state, action) => {
          state.notificationList = action.payload;
        },

        setNewNotifications:(state, action) => {
          state.notificationList.unshift(action.payload);
        }
    }
});


export const {setNotificationList, setNewNotifications} = notificationSlice.actions;

export default notificationSlice.reducer;
