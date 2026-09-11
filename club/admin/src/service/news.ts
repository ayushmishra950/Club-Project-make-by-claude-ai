import api from "@/api/axios";

export const addNews = async(obj:any) => {
    const res = await api.post(`/admin/news/add`,obj);
    return res;
};



export const getNews = async() => {
    const res = await api.get(`/admin/news/get`);
    return res;
};


export const getByIdNews = async(id:string) => {
    const res = await api.get(`/admin/news/getbyid/${id}`);
    return res;
};



export const updateNews = async(obj:any) => {
    const res = await api.put(`/admin/news/update`,obj);
    return res;
};



export const deleteNews = async(id:string) => {
    const res = await api.delete(`/admin/news/delete/${id}`);
    return res;
};

