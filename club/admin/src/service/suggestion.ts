
import api from "@/api/axios";

//======================================user k liye hai y=========================================
//================================================================================================



export const getAllSuggestion = async () => {
    const res = await api.get(`/admin/suggestion/get`);
    return res;
};


export const deleteSuggestion = async (id: string) => {
    const res = await api.delete(`/admin/suggestion/delete/${id}`);
    return res;
}


export const updateSuggestionStatus = async (obj: any) => {
    const res = await api.put(`/admin/suggestion/update`, obj);
    return res;
};


export const replyToSuggestion = async (obj: { id: string; userId: string; adminReply: string }) => {
    const res = await api.post(`/admin/suggestion/reply`, obj);
    return res;
};

export const markSuggestionAsRead = async (id: string) => {
    const res = await api.post(`/admin/suggestion/mark-read/${id}`);
    return res;
};
