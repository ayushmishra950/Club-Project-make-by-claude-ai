import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
    suggestionList: [],
    unreadCount: 0
};


const suggestionSlice = createSlice({
    name: "Suggestion",
    initialState,
    reducers: {
        setSuggestionList: (state, action: PayloadAction<any[]>) => {
            state.suggestionList = action.payload;
            state.unreadCount = 0; // ✅ Reset count when fetching fresh list
        },

        setNewSuggestion: (state, action) => {
            state.suggestionList.unshift(action.payload);
        },

        setUpdateSuggestion: (state, action) => {
            state.suggestionList = state.suggestionList.map((item) => item._id.toString() === action.payload._id.toString() ? action.payload : item);
        },

        incrementUnreadCount: (state) => {
            state.unreadCount += 1;
        },

        clearUnreadCount: (state) => {
            state.unreadCount = 0;
        }
    }
});

export const { setSuggestionList, setNewSuggestion, setUpdateSuggestion, clearUnreadCount, incrementUnreadCount } = suggestionSlice.actions;

export default suggestionSlice.reducer;

