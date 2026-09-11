import {createSlice} from "@reduxjs/toolkit";

const initialState = {
    donationList : [],
    totalPages:0,
    totalAmount:0,
    topDonors:[]
};


const donationSlice = createSlice({
    name:"Donation",
    initialState,
    reducers:{
        setDonationList : (state, action) => {
         state.donationList = action.payload;
        },

        setTotalPages : (state, action) => {
         state.totalPages = action.payload;
        },

        setTotalAmount : (state, action) => {
         state.totalAmount = action.payload;
        },

        setTopDonorList : (state, action) => {
         state.topDonors = action.payload;
        },

    }
});


export const {setDonationList, setTotalPages, setTotalAmount, setTopDonorList} = donationSlice?.actions;

export default donationSlice.reducer;