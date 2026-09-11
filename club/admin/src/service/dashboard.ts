import api from "@/api/axios";


//=====================================admin k liye hai y===========================================
//==================================================================================================


export const getDashboardSummary = async () => {
    const res = await api.get(`/admin/dashboard/summary`);
    return res;
};



export const getDashboardGraph = async () => {
    const res = await api.get(`/admin/dashboard/graph`);
    return res;
};




export const getDashboardStats = async () => {
    const res = await api.get(`/admin/dashboard/stats`);
    return res;
}




export const getYearlyAnalytics = async () => {
    const res = await api.get(`/admin/dashboard/analytics`);
    return res;
};
