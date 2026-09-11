import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, MapPin, Users, Clock, Edit, Delete, Trash, Check, X, View } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import socket from "@/socket/socket";
import { getAllUser, verifyBusinessUser } from "@/service/auth";
import { setBusinessList } from "@/redux-toolkit/slice/userSlice";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import BusinessDetailModal from "@/components/cards/businessDetailCard";
import { Button } from "@/components/ui/button";
import AddBusinessDialog from "@/components/forms/AddBusinessDialog";

export default function BusinessDirectoryPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [search, setSearch] = useState("");
  const [addBusinessDialogOpen, setAddBusinessDialogOpen] = useState(false);
  const [businessDetailOpen, setBusinessDetailOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const dispatch = useAppDispatch();
  const [filterStatus, setFilterStatus] = useState("active");
  const users = useAppSelector((state) => state?.user?.businessList);


  useEffect(() => {
    const handler = () => {
      handleGetAllUser();
    };

    socket.on("updateProfileFromUser", handler);

    return () => {
      socket.off("updateProfileFromUser", handler);
    };
  }, []);

  const handleGetAllUser = async () => {
    try {
      const res = await getAllUser({ page, perPage, search, filterStatus });
      if (res.status === 200) {

        const allBusinesses = res?.data?.users?.reduce((acc: any[], user: any) => {
          if (user.accountType === "business" && user.businesses) {
            const userBusinesses = user.businesses.map((biz: any) => ({
              ...biz,
              ownerId: user._id,
              ownerName: user.fullName,
              ownerEmail: user.email,
              userCreatedAt: user.createdAt
            }));
            return [...acc, ...userBusinesses];
          }
          return acc;
        }, []);

        dispatch(setBusinessList(allBusinesses));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleVerifyBusiness = async (userId: string, businessId: string, status: boolean) => {
    if (!userId || !businessId) return;
    try {
      let obj = { userId, businessId, status };
      const res = await verifyBusinessUser(obj);
      if (res.status === 200) {
        toast({ title: "Business update successful", description: res?.data?.message });
        handleGetAllUser();
        socket.emit("businessVerify", userId);
      }
    }
    catch (err: any) {
      console.log(err);
      toast({ title: "Verification failed", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    }
  }

  useEffect(() => {
    handleGetAllUser();
  }, [page, perPage, search, filterStatus]);


  return (
    <>
      <AddBusinessDialog open={addBusinessDialogOpen} onOpenChange={() => setAddBusinessDialogOpen(false)} />
      <BusinessDetailModal isOpen={businessDetailOpen} onClose={() => setBusinessDetailOpen(false)} business={selectedBusiness} />
      <div className="space-y-4 ">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold text-lg">
            Business Verification Directory
          </h3>

          <Button onClick={() => { setAddBusinessDialogOpen(true) }} className="h-9 px-4 text-sm">
            <Plus className="w-4 h-4" />
            Add Business
          </Button>
        </div>
        {Array.isArray(users) && users.length > 0 ? (
          <>
            {/* ================= DESKTOP TABLE ================= */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-left text-sm">
                  <tr>
                    <th className="p-3">Cover</th>
                    <th className="p-3">Business ID</th>
                    <th className="p-3">Business Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((biz: any) => (
                    <tr key={biz?._id} className="border-t hover:bg-gray-50">
                      {/* Image */}
                      <td className="p-3">
                        {biz?.businessCoverImage ? (
                          <img
                            src={biz.businessCoverImage}
                            className="w-12 h-12 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200" />
                        )}
                      </td>

                      {/* Business ID */}
                      <td className="p-3 text-xs font-mono text-gray-500">
                        {biz?.businessId || `biz-${Math.random().toString(36).substring(2, 10)}`}
                      </td>

                      {/* Business Name */}
                      <td className="p-3 font-medium">
                        {biz?.businessName}
                      </td>

                      {/* Category */}
                      <td className="p-3 text-sm">
                        {biz?.businessCategory}
                      </td>

                      {/* Owner */}
                      <td className="p-3 text-sm">
                        <div>
                          <p className="font-medium">{biz?.ownerName}</p>
                          <p className="text-xs text-gray-500">{biz?.ownerEmail}</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${biz.isVerified === 'verified' ? 'bg-green-100 text-green-700' :
                          biz.isVerified === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {biz.isVerified || 'pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedBusiness(biz); setBusinessDetailOpen(true) }}
                            className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-colors"
                            title="Reject Business"
                          >
                            <View className="w-4 h-4 text-black-600" />
                          </button>
                          {biz.isVerified !== 'verified' && (
                            <button
                              onClick={() => handleVerifyBusiness(biz.ownerId, biz._id, true)}
                              className="p-1.5 rounded bg-green-100 hover:bg-green-200 transition-colors"
                              title="Approve Business"
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </button>
                          )}

                          {biz.isVerified !== 'rejected' && (
                            <button
                              onClick={() => handleVerifyBusiness(biz.ownerId, biz._id, false)}
                              className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-colors"
                              title="Reject Business"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE VIEW ================= */}
            <div className="md:hidden space-y-3">
              {users.map((biz: any) => (
                <div
                  key={biz?.businessId}
                  className="border rounded-xl p-4 flex gap-4 items-start bg-white shadow-sm"
                >
                  {/* Image */}
                  <div className="shrink-0">
                    {biz?.businessCoverImage ? (
                      <img
                        src={biz.businessCoverImage}
                        className="w-14 h-14 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {biz?.businessName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${biz.isVerified === 'verified' ? 'bg-green-100 text-green-700' :
                        biz.isVerified === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {biz.isVerified || 'pending'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      ID: {biz?.businessId}
                    </p>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin size={12} /> {biz?.businessCategory}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Users size={12} /> {biz?.ownerName}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      {biz.isVerified !== 'verified' && (
                        <button
                          onClick={() => handleVerifyBusiness(biz.ownerId, biz._id, true)}
                          className="flex-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 flex items-center justify-center gap-1"
                        >
                          <Check size={14} /> Approve
                        </button>
                      )}

                      {biz.isVerified !== 'rejected' && (
                        <button
                          onClick={() => handleVerifyBusiness(biz.ownerId, biz._id, false)}
                          className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 flex items-center justify-center gap-1"
                        >
                          <X size={14} /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="flex items-center justify-center h-[400px]">
            No Data Found.
          </p>
        )}
      </div>
    </>
  );
}
