

import api from "@/api/axios";


export const blockAndUnBlockUser = async (id: string) => {
    const res = await api.patch(`/admin/user/block/toggle/${id}`);
    return res;
}


export const getBlockedUsers = async(userId:string) => {
    const res = await api.get(`/user/block/get/${userId}`);
    return res;
}



export const unblockedUser = async(obj) => {
    const res = await api.patch(`/user/block/unblocked`, obj);
    return res;
}

export const blockedUser = async(obj) => {
    const res = await api.patch(`/user/block/blocked`, obj);
    return res;
}