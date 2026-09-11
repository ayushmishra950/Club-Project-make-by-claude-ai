import api from "@/api/axios";

export const registerUser = async(obj) => {
   const res  = await api.post(`/user/auth/register`, obj);
   return res;
};


export const loginUser = async(obj) => {
    const res = await api.post(`/user/auth/login`, obj);
    return res;
}



export const updateUser = async (obj) => {
    const res = await api.put(`/user/auth/update`, obj, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
    });
    return res;
}



export const getSingleUser = async (id:string) => {
    const res = await api.get(`/user/auth/getbyid/${id}`);
    return res;
}


/** One page of the member directory. See getAllPost for the cursor contract. */
export const getAllUser = async (userId: string, cursor?: string | null, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    const res = await api.get(`/user/auth/get/${userId}?${params}`);
    return res;
};



export const convertPremiumUser = async (obj) => {
    const res = await api.put(`/user/auth/convert-premium`, obj,
        {
            headers:{
                "Content-Type": "multipart/form-data",
            }
        }
    );
    return res;
};



export const deleteUserRequest = async(id:string) => {
    const res = await api.delete(`/user/auth/delete/user/${id}`);
    return res;
};


export const recoverAccount = async(id:string) => {
    const res = await api.patch(`/user/auth/recover/account/${id}`);
    return res;
}

/**
 * Every member, by walking the cursor.
 *
 * The endpoint is paged so a single request can never pull the whole table.
 * Screens that genuinely need the full list, such as the business directory,
 * use this instead, with a hard page cap so a bug upstream cannot spin here.
 */
export const getAllUsersPaged = async (userId: string, maxPages = 20) => {
    const collected: any[] = [];
    let cursor: string | null = null;

    for (let page = 0; page < maxPages; page += 1) {
        const res = await getAllUser(userId, cursor);
        collected.push(...(res?.data?.data ?? []));

        if (!res?.data?.hasMore || !res?.data?.nextCursor) break;
        cursor = res.data.nextCursor;
    }

    return collected;
};
