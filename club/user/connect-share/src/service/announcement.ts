
import api from "@/api/axios";


export const getAllAnnouncement = async() => {
   const res  = await api.get(`/user/announcement/get`);
   return res;
};



export const getSingleAnnouncement = async(id:string) => {
   const res  = await api.get(`/user/announcement/getbyid/${id}`);
   return res;
};