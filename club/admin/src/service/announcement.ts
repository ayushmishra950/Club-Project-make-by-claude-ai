import api from "@/api/axios";

export const addAnnouncement = async(obj:any) => {
   const res  = await api.post(`/admin/announcement/add`, obj);
   return res;
};



export const getAllAnnouncement = async() => {
   const res  = await api.get(`/admin/announcement/get`);
   return res;
};



export const getSingleAnnouncement = async(id:string) => {
   const res  = await api.get(`/admin/announcement/getbyid/${id}`);
   return res;
};



export const deleteAnnouncement = async(id:string) => {
   const res  = await api.delete(`/admin/announcement/delete/${id}`,);
   return res;
};
