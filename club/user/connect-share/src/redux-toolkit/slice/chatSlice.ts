import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  userChatList: [],
  messageList: []
};


const chatSlice = createSlice({
  name: "Chat",
  initialState,
  reducers: {
    setUserChatList: (state, action) => {
      state.userChatList = action.payload;
    },
    setMessageRefresh: (state, action: PayloadAction<{ newMessage, updatedAt }>) => {
      const { newMessage, updatedAt } = action.payload;

      if (!newMessage || !newMessage.chatId) return;

      state.userChatList = state.userChatList.map((chat) => {

        if (!chat || !chat.chatId) return chat;

        if (chat.chatId?.toString() === newMessage.chatId?.toString()) {

          const deliveredMessages = Array.isArray(chat.deliveredMessages)
            ? chat.deliveredMessages
            : [];

          const updatedDelivered = deliveredMessages
            .filter((dm) => dm._id?.toString() !== newMessage._id?.toString())
            .concat(newMessage.status !== "seen" ? [newMessage] : []);

          return {
            ...chat,
            lastMessage: newMessage,
            deliveredMessages: updatedDelivered,
            updatedAt: updatedAt ?? new Date().toISOString(),
          };
        }

        return chat;
      });
      state.userChatList = [...state.userChatList].sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
      );
    },

    setUnreadCountRemove: (state, action) => {
      const { chat } = action.payload;

      state.userChatList = state.userChatList.map((c) => {
        if (c.chatId === chat?.chatId) { return { ...c, deliveredMessages: [] }; }
        return c;
      });
    },

    setMessageList: (state, action) => {
      state.messageList = action.payload
    },
    setNewMessageAdd: (state, action) => {
      state.messageList.push(action.payload);
    },


    setGroupInvited: (state, action) => {
      const { groupId, chatId, userId } = action.payload;
      const group = state.userChatList.find((chat) => chat.chatId?.toString() === chatId?.toString());
      if (group) {
        group.groupId = groupId;
      }
    },

    setRejectGroupInvite: (state, action) => {
      const { chatId, userId } = action.payload;

      // 🔍 find chat index
      const index = state.userChatList.findIndex(
        (chat) => chat.chatId?.toString() === chatId?.toString()
      );

      if (index !== -1) {
        const group = state.userChatList[index];

        // 1️⃣ remove from pendingMembers
        if (group.pendingMembers) {
          group.pendingMembers = group.pendingMembers.filter(
            (id: string) => id.toString() !== userId.toString()
          );
        }

        state.userChatList.splice(index, 1);
      }
    },

    setAcceptedInvite: (state, action) => {
      const { chatId, userId } = action.payload;

      const chat = state.userChatList.find((c) => c.chatId?.toString() === chatId?.toString());

      if (chat) {
        if (chat.pendingMembers) {
          chat.pendingMembers = chat.pendingMembers.filter((id: string) => id.toString() !== userId.toString());
        }

        if (!chat.members) {
          chat.members = [];
        }

        const exists = chat.members.some((id: string) => id.toString() === userId.toString());

        if (!exists) {
          chat.members.push(userId);
        }
      }
    },
    setExitUserFromGroup: (state, action) => {
      const { chatId } = action.payload;

      state.userChatList = state.userChatList.filter(
        (chat) => chat.chatId?.toString() !== chatId?.toString()
      );
    },

    setDeleteUserChat: (state, action) => {
      const userId = action.payload?._id;

      state.userChatList.forEach((chat) => {

        // 🔹 SINGLE CHAT
        if (!chat?.isGroup) {
          if (chat?.friend?._id === userId) {
            chat.friend.isDeleted = true;
            chat.friend.deleteStatus = "approved";
          }
        }

        // 🔹 GROUP CHAT
        if (chat?.isGroup) {
          chat.members?.forEach((member) => {
            if (member?._id === userId) {
              member.isDeleted = true;
              member.deleteStatus = "approved";
            }
          });
        }

      });
    },

    setRecoverUserChat: (state, action) => {
      const userId = action.payload?._id;

      state.userChatList.forEach((chat) => {

        // 🔹 SINGLE CHAT
        if (!chat?.isGroup) {
          if (chat?.friend?._id === userId) {
            chat.friend.isDeleted = false;
            chat.friend.deleteStatus = "active";
          }
        }

        // 🔹 GROUP CHAT
        if (chat?.isGroup) {
          chat.members?.forEach((member) => {
            if (member?._id === userId) {
              member.isDeleted = false;
              member.deleteStatus = "active";
            }
          });
        }

      });
    },
   setBlockUser: (state, action) => {
  const { chatId, toId, fromId, userId } = action.payload;
  const targetUserId = toId ?? userId;
  const blockerId = fromId;

  const chatData = state.userChatList.find(
    (chat) => chat.chatId?.toString() === chatId?.toString()
  );

  if (chatData) {
    if (!chatData.blockedMembers) {
      chatData.blockedMembers = [];
    }

    const isAlreadyBlocked = chatData.blockedMembers.some(
      (block) =>
        block.user?.toString() === targetUserId?.toString() &&
        block.blockedBy?.toString() === blockerId?.toString()
    );

    if (!isAlreadyBlocked) {
      chatData.blockedMembers.push({
        user: targetUserId,
        blockedBy: blockerId,
        blockedAt: new Date().toISOString(),
      });
    }
  }
},

setUnblockUser: (state, action) => {
  const { chatId, toId, fromId, userId } = action.payload;
  const targetUserId = toId ?? userId;
  const blockerId = fromId;

  const chatData = state.userChatList.find( (chat) => chat.chatId?.toString() === chatId?.toString());

  if (chatData && chatData.blockedMembers) {
    chatData.blockedMembers = chatData.blockedMembers.filter( (block) =>
        !( block.user?.toString() === targetUserId?.toString() && block.blockedBy?.toString() === blockerId?.toString())
    );
  }
},

  }
});

export const { setUserChatList,setBlockUser,setUnblockUser,setDeleteUserChat, setRecoverUserChat, setExitUserFromGroup, setAcceptedInvite, setMessageRefresh, setRejectGroupInvite, setGroupInvited, setUnreadCountRemove, setMessageList, setNewMessageAdd } = chatSlice.actions;

export default chatSlice.reducer;

