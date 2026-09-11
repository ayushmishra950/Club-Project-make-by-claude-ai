import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Notification {
    notificationList: any[];
    unreadCount: number;
}
const initialState: Notification = {
    notificationList: [],
    unreadCount: 0,
};


const notificationSlice = createSlice({
    name: "Notification",
    initialState,
    reducers: {
        setNotificationList: (state, action: PayloadAction<any[]>) => {
            state.notificationList = action.payload;
            state.unreadCount = action.payload.filter(n => !n.isRead).length;
        },

        setNewNotification: (state, action: PayloadAction<any>) => {
            const existNotification = state.notificationList.find((n) => n?._id === action.payload?._id);
            if (!existNotification) {
                state.notificationList.unshift(action.payload);

                if (!action.payload.isRead) {
                    state.unreadCount += 1;
                }
            }
        },

        markAllAsRead: (state) => {
      state.notificationList.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },

    mergeNotificationsByReceiver: (state, action) => {
  const incoming = action.payload; // backend array

  incoming.forEach((newNotif: any) => {
    const index = state.notificationList.findIndex(
      (oldNotif: any) =>
        String(oldNotif.receiver?._id || oldNotif.receiver) ===
        String(newNotif.receiver?._id || newNotif.receiver)
    );

    // agar match mila → replace/update
    if (index !== -1) {
      state.notificationList[index] = newNotif;
    } 
    // warna new add
    else {
      state.notificationList.unshift(newNotif);
    }
  });
},
    }
});

export const { setNotificationList,mergeNotificationsByReceiver, markAllAsRead, setNewNotification } = notificationSlice.actions;

export default notificationSlice.reducer;

