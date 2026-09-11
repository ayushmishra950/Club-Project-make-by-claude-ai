import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
    dashboardStats: null,
    graphStats: null
};


const dashboardSlice = createSlice({
    name: "Dashboard",
    initialState,
    reducers: {
        setDashboardStats: (state, action: PayloadAction<any>) => {
            state.dashboardStats = action.payload;
        },
        setGraphStats: (state, action: PayloadAction<any>) => {
            state.graphStats = action.payload;
        }
    }
});

export const { setDashboardStats, setGraphStats } = dashboardSlice.actions;

export default dashboardSlice.reducer;

