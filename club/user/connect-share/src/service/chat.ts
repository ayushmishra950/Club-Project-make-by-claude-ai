import api from "@/api/axios";


export const getChatUsers = async (userId: string) => {
    const res = await api.get(`/user/chat/users/${userId}`);
    return res;
};


export const addUserFromChat = async (obj) => {
    const res = await api.post(`/user/chat/user/add`, obj);
    return res;
};


export const sendMessage = async (obj) => {
    const res = await api.post(`/user/chat/message/send`, obj,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};

export const getMessages = async (obj:{chatId:string, userId:string}) => {
    const res = await api.get(`/user/chat/messages`,{params : {chatId:obj?.chatId, userId:obj?.userId}});
    return res;
}

export const rejectGroupInvite = async (obj) => {
    const res = await api.post(`/user/chat/user/reject-group-invite`, obj);
    return res;
}

export const acceptGroupInvite = async (obj) => {
    const res = await api.post(`/user/chat/user/accept-group-invite`, obj);
    return res;
};


export const blockUser = async (obj) => {
    const res = await api.patch(`/user/chat/user/block`, obj);
    return res;
};

export const unblockUser = async (obj) => {
    const res = await api.patch(`/user/chat/user/unblock`, obj);
    return res;
};





export const deleteMessageForMe = async (obj:{messageId:string, userId:string}) => {
    const res = await api.patch(`/user/chat/user/deleteMessageForMe`, {messageId:obj?.messageId,userId:obj?.userId});
    return res;
};



export const deleteMessageForEveryone = async (obj:{messageId:string, userId:string}) => {
    const res = await api.patch(`/user/chat/user/deleteMessageForEveryone`, {messageId:obj?.messageId,userId:obj?.userId});
    return res;
};



export const deleteAllMessagesForMe = async (obj:{chatId:string, userId:string}) => {
    const res = await api.patch(`/user/chat/user/deleteAllMessagesForMe`, {chatId:obj?.chatId,userId:obj?.userId});
    return res;
};
