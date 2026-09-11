import api from "@/api/axios";


//=====================================admin k liye hai y===========================================
//==================================================================================================


export const addDonation = async (obj: any) => {
    const res = await api.post(`/admin/donation/add`, obj);
    return res;
}


export const getDonation = async (obj: any) => {
    const res = await api.get(`/admin/donation/get`, { params: obj });
    return res;
}



export const getTopDonation = async (limit: number) => {
    const res = await api.get(`/admin/donation/top-donors`, { params: { limit } });
    return res;
};
