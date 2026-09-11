
import api from "@/api/axios";

export const getAllNotifications = async() => {
    const res = await api.get(`/admin/notification/get`);
    return res;
};

