
import api from "@/api/axios";


export const blockAndUnBlockUser = async (id: string) => {
    const res = await api.patch(`/admin/user/block/toggle/${id}`);
    return res;
}

