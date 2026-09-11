import api from "@/api/axios";


export const addMessage = async(obj:any) =>{
    const res = await api.post(`/admin/chat/group/message`, obj,
        {headers:{"Content-Type":"multipart/form-data"}}
    );
    return res;
};



export const getAllMessage = async(id:string) =>{
    const res = await api.get(`/admin/chat/group/get/messages/${id}`
    );
    return res;
};