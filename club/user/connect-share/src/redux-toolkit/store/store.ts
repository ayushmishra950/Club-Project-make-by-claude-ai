import { configureStore } from "@reduxjs/toolkit";
import eventReducer from "../slice/eventSlice";
import userReducer from "../slice/userSlice";
import donationReducer from "../slice/donationSlice";
import galleryReducer from "../slice/gallerySlice";
import categoryReducer from "../slice/categorySlice";
import postReducer from "../slice/postSlice";
import groupReducer from "../slice/businessGroupSlice";
import chatReducer from "../slice/chatSlice";
import searchReducer from "../slice/searchSlice";
import announcementReducer from "../slice/announcementSlice";
import suggestionReducer from "../slice/suggestionSlice";
import newsReducer from "../slice/newsSlice";
import reviewReducer from "../slice/reviewSlice";



export const store = configureStore({
    reducer: {
        event: eventReducer,
        user: userReducer,
        donation: donationReducer,
        gallery: galleryReducer,
        category: categoryReducer,
        post: postReducer,
        group: groupReducer,
        chat: chatReducer,
        search: searchReducer,
        announcement: announcementReducer,
        suggestion: suggestionReducer,
        news: newsReducer,
        reviews: reviewReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

