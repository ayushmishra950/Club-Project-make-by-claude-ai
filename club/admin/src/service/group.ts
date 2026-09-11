
import api from "@/api/axios";


export const createGroup = async (obj: any) => {
    const res = await api.post(`/admin/group/add`, obj);
    return res;
};

export const getAllGroups = async () => {
    const res = await api.get(`/admin/group/get`);
    return res;
};


export const getAllGroupsByAdmin = async (id: string) => {
    const res = await api.get(`/admin/group/getallbyadmin/${id}`);
    return res;
};

export const getGroupById = async (id: string) => {
    const res = await api.get(`/admin/group/getbyid/${id}`);
    return res;
};

export const updateGroup = async (obj: any) => {
    const res = await api.put(`/admin/group/update`, obj);
    return res;
};

export const deleteGroup = async (id: string) => {
    const res = await api.delete(`/admin/group/delete/${id}`);
    return res;
};



export const addMemberToGroup = async (obj: any) => {
    const res = await api.post(`/admin/group/addmember`, obj);
    return res;
};

export const removeMemberFromGroup = async (obj: any) => {
    const res = await api.put(`/admin/group/removemember`, obj);
    return res;
};   