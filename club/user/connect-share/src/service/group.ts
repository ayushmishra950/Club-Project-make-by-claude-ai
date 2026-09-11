import api from "@/api/axios";


export const getAllGroups = async () => {
    const res = await api.get(`/user/group/get`);
    return res;
};


export const toggleMember = async (obj: any) => {
    const res = await api.post(`/user/group/toggle-member`, obj);
    return res;
}




export const createGroup = async (obj: any) => {
    const res = await api.post(`/user/group/add`, obj);
    return res;
};

export const getGroupById = async (id: string) => {
    const res = await api.get(`/user/group/getbyid/${id}`);
    return res;
};

export const updateGroup = async (obj: any) => {
    const res = await api.put(`/user/group/update`, obj);
    return res;
};

export const deleteGroup = async (id: string) => {
    const res = await api.delete(`/user/group/delete/${id}`);
    return res;
};



export const addMemberToGroup = async (obj: any) => {
    const res = await api.post(`/user/group/addmember`, obj);
    return res;
};

export const removeMemberFromGroup = async (obj: any) => {
    const res = await api.put(`/user/group/removemember`, obj);
    return res;
};   
  

export const exitMemberFromGroup = async (obj: any) => {
    const res = await api.post(`/user/group/remove-member`, obj);
    return res;
};