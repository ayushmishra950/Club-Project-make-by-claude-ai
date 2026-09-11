import api from "@/api/axios";



export const getAllNotifications = async(userId:string) =>{
            const res = await api.get(`/user/notification/get/${userId}`);
            return res;
};


export const UpdateNotifications = async(userId:string) =>{
            const res = await api.patch(`/user/notification/updateNotification/${userId}`);
            return res;
};



export const getDeleteNotifications = async(userId:string) =>{
            const res = await api.delete(`/user/notification/delete/${userId}`);
            return res;
};