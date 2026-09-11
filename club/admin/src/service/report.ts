import api from "@/api/axios";


export const getAllReports = async () => {
  const res = await api.get(`/admin/reports/admin/all`);
  return res;
};

export const updateReportStatus = async (reportId, adminId, obj) => {
  const res = await api.patch(
    `/admin/reports/admin/update/${reportId}/${adminId}`,
    obj
  );
  return res;
};

export const deleteReport = async (id) => {
  const res = await api.delete(`/admin/reports/admin/delete/${id}`);
  return res;
};
