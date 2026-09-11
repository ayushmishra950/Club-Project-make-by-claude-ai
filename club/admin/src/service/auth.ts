import api from "@/api/axios";

export const registerUser = async (obj) => {
    const res = await api.post(`/user/auth/register`, obj);
    return res;
};


export const loginUser = async (obj) => {
    const res = await api.post(`/user/auth/login`, obj);
    return res;
}



export const updateUser = async (obj) => {
    const res = await api.put(`/user/auth/update`, obj);
    return res;
}



export const getSingleUser = async (id: string) => {
    const res = await api.get(`/user/auth/getbyid/${id}`);
    return res;
}




//=====================================admin k liye hai y===========================================
//==================================================================================================

export const loginAdmin = async (obj) => {
    const res = await api.post(`/admin/auth/login`, obj);
    return res;
}


export const getAdmin = async (id: string) => {
    const res = await api.get(`/admin/auth/getbyid/${id}`);
    return res;
}


export const updateAdmin = async (id: string, obj) => {
    const res = await api.put(`/admin/auth/update/${id}`, obj);
    return res;
}




export const getAllUser = async ({ page, perPage, search, filterStatus }) => {
    const res = await api.get(`/admin/user/get`, { params: { page, perPage, search, filterStatus } });
    return res;
}


export const verifyUser = async (memberIds: string[]) => {
    const res = await api.patch(`/admin/user/verify`, { memberIds });
    return res;
}



export const verifyBusinessUser = async (obj) => {
    const res = await api.post(`/admin/user/business/verify`, obj);
    return res;
}



export const deletedUser = async (id: string) => {
    const res = await api.delete(`/admin/user/delete/${id}`);
    return res;
}



export const activeAndInactiveUser = async (id: string, status: boolean) => {
    const res = await api.patch(`/admin/user/active/inactive/${id}`, { status });
    return res;
}

export const addNewUser = async (obj) => {
    const res = await api.post(`/admin/user/add`, obj);
    return res;
}

export const uploadExcel = async (obj) => {
    const res = await api.post(`/admin/user/upload-excel`, obj, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res;
};

export const acceptPaymentRequest = async (obj) => {
    const res = await api.post(`/admin/user/accept-payment`, obj);
    return res;
};

export const updateUserByAdmin = async (id: string, obj) => {
    const res = await api.put(`/admin/user/update/${id}`, obj);
    return res;
};


export const addBusinessUser = async (obj) => {
    const res = await api.post(`/admin/user/business/add`, obj);
    return res;
};


export const adminConvertPremiumUser = async (obj) => {
    const res = await api.patch(`/admin/user/convert/premium`, obj);
    return res;
}; 


export const approveDeleteRequest = async(id:string) => {
    const res = await api.patch(`/admin/user/delete/request/approve/${id}`);
    return res;
};


export const recoverAccount = async(id:string) => {
    const res = await api.patch(`/admin/user/delete/request/cancel/${id}`);
    return res;
}