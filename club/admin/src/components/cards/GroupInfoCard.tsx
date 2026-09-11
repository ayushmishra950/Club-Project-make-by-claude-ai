import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { removeMemberFromGroup } from "@/service/group";
import { useToast } from "@/hooks/use-toast";
import DeleteCard from "@/components/cards/DeleteCard";
import { setAddAnRemoveUserGroup, setUpdateGroupDetail } from "@/redux-toolkit/slice/groupSlice";

const GroupInfoCard = ({ isOpen, onOpenChange, groupId, setSelectedGroup }) => {
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteUser, setDeleteUser] = useState(null);
    const dispatch = useAppDispatch();

    const groupList = useAppSelector((state) => state?.group?.groupList);

    const group = groupList?.find(g => g._id === groupId);

    const filteredMembers = useMemo(() => {
        if (!group?.members) return [];

        return group.members.filter(member => {
            if (!search) return true;

            const query = search.toLowerCase();

            return (
                member?.fullName?.toLowerCase().includes(query) ||
                member?.email?.toLowerCase().includes(query)
            );
        });
    }, [group, search]);


    const handleRemoveMember = async () => {
        let obj = { groupId, userId: deleteUser?._id };
        try {
            setDeleteLoading(true);
            const res = await removeMemberFromGroup(obj)
            if (res.status === 200) {
                toast({
                    title: "Member removed successfully",
                    description: res?.data?.message || "Member removed successfully",
                    variant: "default",
                });
                
                if (res.data.group) {
                    dispatch(setUpdateGroupDetail(res.data.group));
                    if (setSelectedGroup) {
                        setSelectedGroup(res.data.group);
                    }
                }

                setDeleteDialogOpen(false);
                setDeleteUser(null);
            }
        }
        catch (err) {
            console.log(err);
        }
        finally {
            setDeleteLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <DeleteCard
                isOpen={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                isLoading={deleteLoading}
                buttonName="Remove"
                title={`Remove Member from ${group?.title}`}
                description={`Are you sure you want to remove "${deleteUser?.fullName}" from "${group?.title}"? They will no longer be part of this group.`}
                onConfirm={handleRemoveMember}
            />
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            >
                <div
                    className="bg-white rounded-xl shadow-lg w-11/12 max-w-md max-h-[85vh] flex flex-col relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* CLOSE */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-3 right-3 text-gray-500"
                    >
                        ✕
                    </button>

                    {/* ===== HEADER (GROUP INFO) ===== */}
                    <div className="flex flex-col items-center px-4 pt-6 pb-4 border-b">

                        {/* IMAGE */}
                        <img
                            src={group?.images?.[0] || "https://via.placeholder.com/100"}
                            className="w-20 h-20 rounded-full object-cover mb-3"
                        />

                        {/* NAME */}
                        <p className="text-lg font-semibold text-center">
                            {group?.title}
                        </p>

                        {/* DESCRIPTION */}
                        <p className="text-sm text-gray-500 text-center mt-1">
                            {group?.description || "No description"}
                        </p>

                        {/* MEMBER COUNT */}
                        <p className="text-xs text-gray-400 mt-1">
                            {group?.members?.length || 0} members
                        </p>
                    </div>

                    {/* ===== SEARCH ===== */}
                    <div className="px-4 py-3 border-b">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search members..."
                            className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                    </div>

                    {/* ===== MEMBER LIST ===== */}
                    <div className="flex-1 max-h-[150px] overflow-y-auto px-4 py-2">

                        {filteredMembers?.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 mt-4">
                                No members found
                            </p>
                        ) : (
                            filteredMembers.map(member => (
                                <div
                                    key={member._id}
                                    className="flex items-center justify-between gap-3 py-2 border-b"
                                >
                                    {/* LEFT SIDE */}
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={member?.profileImage}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />

                                        <div>
                                            <p className="text-sm font-medium">
                                                {member?.fullName}
                                            </p>

                                            {member?.email && (
                                                <p className="text-xs text-gray-500">
                                                    {member?.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* REMOVE BUTTON */}
                                    <button
                                        onClick={() => {
                                            setDeleteUser(member);
                                            setDeleteDialogOpen(true);
                                        }}
                                        className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </>
    );
};

export default GroupInfoCard;