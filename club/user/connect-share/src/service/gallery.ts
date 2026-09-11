
import api from "@/api/axios";


//=====================================admin k liye hai y===========================================
//==================================================================================================

export const addGallery = async(obj:any) =>{
    const res = await api.post(`/admin/gallery/add`, obj,
          { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};


export const getAllGallery = async() =>{
    const res = await api.get(`/admin/gallery/get`);
    return res;
};


export const updateGallery = async(obj:any) =>{
    const res = await api.put(`/admin/gallery/update`, obj,
          { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};

export const deleteGallery = async(id:string) =>{
    const res = await api.delete(`/admin/gallery/delete/${id}`);
    return res;
};



export const markAndUnMarkGallery = async(id:string) =>{
    const res = await api.patch(`/admin/gallery/marked`, {galleryId:id});
    return res;
};

