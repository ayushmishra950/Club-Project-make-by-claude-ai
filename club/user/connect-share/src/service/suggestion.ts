
import api from "@/api/axios";

//======================================user k liye hai y=========================================
//================================================================================================



export const addSuggestion = async (obj: any) => {
    const res = await api.post(`/user/suggestion/add`, obj);
    return res;
}



export const getAllSuggestion = async (id: string) => {
    const res = await api.get(`/user/suggestion/get/${id}`);
    return res;
}

export const replyToSuggestion = async (obj: any) => {
    const res = await api.post(`/user/suggestion/reply`, obj);
    return res;
}

export const markSuggestionAsRead = async (id: string) => {
    const res = await api.post(`/user/suggestion/mark-read/${id}`);
    return res;
}