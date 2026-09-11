import api from "@/api/axios";

export const addReviews = async (obj: any) => {
    const res = await api.post(`/user/review/add`, obj);
    return res;
};

export const getReviews = async (id: string) => {
    const res = await api.get(`/user/review/get/${id}`);
    return res;
};

export const getGlobalReviews = async () => {
    const res = await api.get(`/user/review/get/global`);
    return res;
};


export const getByIdReview = async (id: string) => {
    const res = await api.get(`/admin/reviews/getbyid/${id}`);
    return res;
};



export const updateReviews = async (obj: any) => {
    const res = await api.put(`/admin/reviews/update`, obj);
    return res;
};



export const deleteSingleReview = async (id: string) => {
    const res = await api.delete(`/admin/reviews/delete/${id}`);
    return res;
};

