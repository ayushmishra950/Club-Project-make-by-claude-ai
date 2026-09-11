
import api from "@/api/axios";


//=====================================admin k liye hai y===========================================
//==================================================================================================



export const getSuggestedUsers = async(id :string) => {
    const res = await api.get(`/user/friend/suggestion/get/${id}`);
    return res;
};



export const sendRequest = async(obj) => {
    const res = await api.post(`/user/friend/request/send`, obj);
    return res;
};



export const acceptRequest = async(id:string) => {
    const res = await api.get(`/user/friend/request/accept/${id}`);
    return res;
};



export const cancelRequest = async(id:string) => {
    const res = await api.get(`/user/friend/request/cancel/${id}`);
    return res;
};



export const pendingRequest = async(id:string) => {
    const res = await api.get(`/user/friend/request/pending/${id}`);
    return res;
};



export const getFriendUsers = async(userId:string) => {
    const res = await api.get(`/user/friend/users/${userId}`);
    return res;
}


export const getMutualFriends = async(obj) =>{
    const res = await api.post(`/user/mutualFriends`, obj);
    return res;
}