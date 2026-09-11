import { createSlice, PayloadAction } from "@reduxjs/toolkit";


const initialState = {
  groupList: [],
  messageList: []
};


const groupSlice = createSlice({
  name: "Group",
  initialState,
  reducers: {
    setGroupList: (state, action) => {
      const sortedList = [...action.payload].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
      state.groupList = sortedList;
    },

    setAddAnRemoveUserGroup: (state, action) => {
      const { groupId, userId } = action.payload;

      const group = state.groupList.find(g => g._id === groupId);
      if (!group) return;

      const isMember = group.members.some(member => member._id === userId);

      if (isMember) {
        group.members = group.members.filter(member => member._id !== userId);
      } else {
        group.members.push({ _id: userId });
      }
    },

    setNewUnReadMessage: (state, action) => {
      const { groupId, newMessage, updatedAt } = action.payload;

      const group = state.groupList?.find(
        (g) => g._id?.toString() === groupId?.toString()
      );

      if (!group) return;

      if (!Array.isArray(group.unreadMessages)) {
        group.unreadMessages = [];
      }

      const isAlreadyExists = group.unreadMessages.some(
        (msg) => msg?._id === newMessage?._id
      );

      if (!isAlreadyExists && newMessage?.sender !== null) {
        group.unreadMessages.push({ ...newMessage, updatedAt });
      }

      // 🔥 ADD THIS (IMPORTANT)
      group.updatedAt = updatedAt || new Date().toISOString();

      // 🔥 REORDER LIST IN-PLACE (IMMER WAY)
      state.groupList.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    },
    setMessageList: (state, action) => {
      const { groupId, messages } = action.payload;

      const group = state.groupList?.find(
        (g) => g._id?.toString() === groupId?.toString()
      );
      if (!group) return;

      state.messageList = messages;
    },

    setCleanMessage: (state) => {
      state.messageList = [];
    },

    setNewGroup: (state, action: PayloadAction<any>) => {
      state.groupList.unshift(action.payload);
    },

    setUpdateGroup: (state, action: PayloadAction<any>) => {
      const group = state.groupList.find(
        g => g._id === action.payload._id
      );

      if (group) {
        // ✅ update members array
        if (action.payload.members) {
          group.members = action.payload.members;
        }
      }
    },
    setDeleteGroup: (state, action: PayloadAction<string>) => {
      state.groupList = state.groupList.filter( (group) => group._id !== action.payload);
    },
    setUpdateGroupDetail: (state, action: PayloadAction<any>) => {
      const index = state.groupList.findIndex(g => g._id === action.payload?._id);

      if (index !== -1) {
        state.groupList[index] = action.payload;
      }
    },

   
  }
});

export const { setGroupList, setAddAnRemoveUserGroup, setUpdateGroupDetail, setDeleteGroup, setUpdateGroup, setNewUnReadMessage, setMessageList, setCleanMessage, setNewGroup } = groupSlice.actions;

export default groupSlice.reducer;

