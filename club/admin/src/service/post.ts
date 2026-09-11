
import api from "@/api/axios";

//======================================user k liye hai y=========================================
//================================================================================================


export const likeAnUnLikePost = async(obj:any) =>{
    const res = await api.post(`/user/post/like/toggle`, obj,
    );
    return res;
};


export const addCommentPost = async(obj:any) =>{
    const res = await api.post(`/user/post/comment/add`, obj,
    );
    return res;
};





//=====================================admin k liye hai y===========================================
//==================================================================================================




export const addPost = async(obj:any) =>{
    const res = await api.post(`/admin/post/add`, obj,
          { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};


export const getAllPost = async() =>{
    const res = await api.get(`/admin/post/get`);
    return res;
};



export const updatePost = async(obj:any) =>{
    const res = await api.put(`/admin/post/update`, obj,
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


