import { createSlice, PayloadAction } from "@reduxjs/toolkit";


const initialState = {
    userList: [],
    userCount: 0,
    adminData: null,
    businessList: []

};


const userSlice = createSlice({
    name: "User",
    initialState,
    reducers: {
        setUserList: (state, action) => {
            state.userList = action.payload;
        },

        setUserCount: (state, action) => {
            state.userCount = action.payload;
        },

        setAdminData: (state, action) => {
            state.adminData = action.payload;
        },

        setBusinessList: (state, action) => {
            state.businessList = action.payload;
        },

        setActiveAndInactiveUser: (state, action) => {
            const { id, status } = action.payload;
            const user = state.userList.find((user) => user._id === id);
            if (user) {
                user.blocked = status;
            }
        },

        setAddNewUser: (state, action) => {
            state.userList.unshift(...action.payload);
        },
        setUpdateUser: (state, action) => {
            state.userList = state.userList.map(user => user._id === action.payload._id ? action.payload : user);
        },
    }
});

export const { setUserList, setUserCount, setActiveAndInactiveUser, setAdminData, setBusinessList, setAddNewUser, setUpdateUser } = userSlice.actions;

export default userSlice.reducer;