

import api from "@/api/axios";


//=====================================admin k liye hai y===========================================
//==================================================================================================



export const addCategory = async(obj:any) =>{
    const res = await api.post(`/admin/category/add`, obj);
    return res;
};



export const getAllCategory = async() =>{
    const res = await api.get(`/admin/category/get`);
    return res;
};


export const updateCategory = async(obj:any) =>{
    const res = await api.put(`/admin/category/update`, obj);
    return res;
};



export const deleteCategory = async(id:string) =>{
    const res = await api.delete(`/admin/category/delete/${id}`, );
    return res;
};
