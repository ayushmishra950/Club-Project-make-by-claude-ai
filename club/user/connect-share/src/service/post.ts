
import api from "@/api/axios";

//======================================user k liye hai y=========================================
//================================================================================================


export const addNotes = async(obj) =>{
    const res = await api.post(`/user/post/notes/add`, obj,
    );
    return res;
};


export const likeAnUnLikePost = async(obj) =>{
    const res = await api.post(`/user/post/like/toggle`, obj,
    );
    return res;
};


export const addCommentPost = async(obj) =>{
    const res = await api.post(`/user/post/comment/add`, obj,
    );
    return res;
};


export const likeAnUnLikeComment = async(obj) =>{
    const res = await api.post(`/user/post/comment/like-toggle`, obj,
    );
    return res;
};


export const replyToComment = async(obj) =>{
    const res = await api.post(`/user/post/comment/reply`, obj,
    );
    return res;
};



export const sharePost = async(obj) =>{
    const res = await api.post(`/user/post/share`, obj,
    );
    return res;
};



export const deletePostByUser = async(obj) =>{
    const res = await api.put(`/user/post/delete`, obj,
    );
    return res;
}


//=====================================admin k liye hai y===========================================
//==================================================================================================




export const addPost = async(obj) =>{
    const res = await api.post(`/user/post/add`, obj,
          { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};


/**
 * One page of the feed.
 *
 * The endpoint returns 20 posts at a time with a `nextCursor`. Passing that
 * cursor back fetches the next page; omitting it starts from the top.
 */
export const getAllPost = async(userId: string, cursor?: string | null, limit = 20) =>{
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    const res = await api.get(`/user/post/get/${userId}?${params}`);
    return res;
};



export const updatePost = async(obj) =>{
    const res = await api.put(`/user/post/update`, obj,
          { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};


export const deletePost = async(id:string) =>{
    const res = await api.delete(`/admin/post/delete/${id}`, );
    return res;
};


export const deletePostComment = async(id:string) =>{
    const res = await api.delete(`/admin/post/delete/${id}`, );
    return res;
};



export const markAndUnMarkPost = async(id:string) =>{
    const res = await api.patch(`/admin/post/marked/${id}`);
    return res;
};


