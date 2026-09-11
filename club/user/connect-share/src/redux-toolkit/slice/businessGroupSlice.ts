import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  groupList: []
};


const groupSlice = createSlice({
  name: "Group",
  initialState,
  reducers: {
    setGroupList: (state, action: PayloadAction<any[]>) => {
      state.groupList = action.payload;
    },

    setGroupJoinAnUnJoin: (state, action: PayloadAction<any>) => {
      const { groupId, userId, fullName, email, profileImage } = action.payload;
      const groupIndex = state.groupList.findIndex(group => group._id === groupId);
      if (groupIndex !== -1) {
        const memberIndex = state.groupList[groupIndex].members.findIndex(member => member._id === userId);
        if (memberIndex !== -1) {
          state.groupList[groupIndex].members.splice(memberIndex, 1);
        }
        else {
          state.groupList[groupIndex].members.push({ _id: userId, fullName, email, profileImage });
        }
      }
    },
    setNewGroup: (state, action: PayloadAction<any>) => {
      const newGroup = action.payload;

      const index = state.groupList.findIndex(
        (group: any) => group._id === newGroup._id
      );

      if (index !== -1) {
        state.groupList[index] = newGroup;
      }
      else {
        state.groupList.unshift(newGroup);
      }
    },

    setDeleteGroup: (state, action: PayloadAction<string>) => {
      const groupId = action.payload;

      const groupIndex = state.groupList.findIndex(
        (group: any) =>
          group._id === groupId
      );

      if (groupIndex !== -1) {
        state.groupList.splice(groupIndex, 1);
      }
    },
    setUpdateGroup: (state, action: PayloadAction<any>) => {
      console.log(action.payload)
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

    setUpdateGroupDetail: (state, action: PayloadAction<any>) => {
      const updatedGroup = action.payload;

      const groupIndex = state.groupList.findIndex(
        (group: any) =>
          group._id === updatedGroup._id
      );

      if (groupIndex !== -1) {
        state.groupList[groupIndex] = updatedGroup;
      }
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

    setDeleteUser: (state, action) => {
      const userId = action.payload?._id;

      state.groupList = state.groupList.map((group) => {
        let updatedMembers = group.members;

        // 🔹 members check + update
        if (Array.isArray(group.members)) {
          updatedMembers = group.members.map((member) =>
            member?._id === userId
              ? {
                ...member,
                isDeleted: true,
                deleteStatus: "approved",
              }
              : member
          );
        }

        return group?.createdBy?._id === userId
          ? {
            ...group,
            managedByAdmin: true,
            createdBy: {
              ...group.createdBy,
              isDeleted: true,
              deleteStatus: "approved",
            },
            members: updatedMembers,
          }
          : {
            ...group,
            members: updatedMembers,
          };
      });
    },

    setRecoverUser: (state, action) => {
      const userId = action.payload?._id;

      state.groupList = state.groupList.map((group) => {
        let updatedMembers = group.members;

        // 🔹 members check + update
        if (Array.isArray(group.members)) {
          updatedMembers = group.members.map((member) =>
            member?._id === userId ? { ...member, isDeleted: false, deleteStatus: "active", } : member
          );
        }

        return group?.createdBy?._id === userId
          ? { ...group, managedByAdmin: false, createdBy: { ...group.createdBy, isDeleted: false, deleteStatus: "active" }, members: updatedMembers}
          : { ...group, members: updatedMembers };
      });
    }
  }
});

export const { setGroupList, setDeleteUser, setRecoverUser, setGroupJoinAnUnJoin, setUpdateGroup, setAddAnRemoveUserGroup, setNewGroup, setDeleteGroup, setUpdateGroupDetail } = groupSlice.actions;

export default groupSlice.reducer;

