
import api from "@/api/axios";


export const createBusinessGroup = async(obj:any) => {
    const res = await api.post(`/admin/businessgroup/add`, obj);
    return res;
};

export const getAllBusinessGroups = async() => {
    const res = await api.get(`/admin/businessgroup/get`);
    return res;
};

export const getBusinessGroupById = async(id: string) => {
    const res = await api.get(`/admin/businessgroup/getbyid/${id}`);
    return res; 
};

export const updateBusinessGroup = async(obj:any) => {
    const res = await api.put(`/admin/businessgroup/update`, obj);
    return res;
};

export const deleteBusinessGroup = async(id: string) => {
    const res = await api.delete(`/admin/businessgroup/delete/${id}`);
    return res;
};