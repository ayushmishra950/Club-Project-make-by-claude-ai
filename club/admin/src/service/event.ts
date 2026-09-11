import api from "@/api/axios";


//=====================================admin k liye hai y===========================================
//==================================================================================================


export const addEvent = async(obj:any) =>{
    const res = await api.post(`/admin/event/add`, obj,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    
    return res;
};


export const getEvent = async() =>{
    const res = await api.get(`/admin/event/get`);
    return res;
};


export const getSingleEvent = async(id:string) =>{
    const res = await api.get(`/admin/event/getbyid/${id}`);
    return res;
};


export const updateEvent = async(obj:any) =>{
    const res = await api.put(`/admin/event/update`, obj,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};

export const deleteEvent = async(id:string) =>{
    const res = await api.delete(`/admin/event/delete/${id}`);
    return res;
};


export const interestedOrNotInterestedFromEvent = async(obj:any) =>{
    const res = await api.post(`/admin/event/candidate/interested`, obj);
    return res;
};