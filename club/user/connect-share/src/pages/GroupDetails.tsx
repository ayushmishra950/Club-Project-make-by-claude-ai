import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { useToast } from "@/hooks/use-toast";
import { setGroupList, setGroupJoinAnUnJoin, setUpdateGroupDetail } from '@/redux-toolkit/slice/businessGroupSlice';
import { getAllGroups, toggleMember, removeMemberFromGroup } from "@/service/group";
import socket from "@/socket/socket";
import OnlineDot from "@/components/ui/online-dot";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import DeleteCard from "@/components/card/DeleteCard";
import AddMemberCard from "@/components/card/AddMemberCard";

const GroupDetails = () => {
    const { groupId } = useParams();
    const user = JSON.parse(localStorage.getItem("member.user"));
    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [groupListRefresh, setGroupListRefresh] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteUser, setDeleteUser] = useState(null);
    const [shareCardOpen, setShareOpenCard] = useState(false);
    const groupList = useAppSelector((state) => state?.group?.groupList);

    const group = groupList?.find((g) => g._id?.toString() === groupId?.toString());
    const isMember = group?.members?.some(
        (member) => member?._id?.toString() === user?._id?.toString()
    );

    useEffect(() => {
        if (group?.images?.length > 0) {
            setSelectedImage(group.images[0]);
        }
    }, [group]);

    useEffect(() => {
        socket.on("addMembersToGroup", (data) => {
            dispatch(setUpdateGroupDetail(data));
        });

        return () => {
            socket.off("addMembersToGroup");
        };
    }, [dispatch]);


    const toggleJoin = async (id: string) => {
        const obj = { groupId: id, userId: user?._id, fullName: user?.fullName, email: user?.email, profileImage: user?.profileImage };
        try {
            const res = await toggleMember(obj);
            if (res.status === 200) {
                toast({ title: "Group Join/Leave Successfully.", description: res?.data?.message });
                dispatch(setGroupJoinAnUnJoin(obj));
            }
        } catch (err) {
            console.log(err);
            toast({ title: "Group Join/Leave Failed.", description: err?.response?.data?.message, variant: "destructive" })
        }
    };


    const handleRemoveMember = async () => {
        const obj = { groupId, userId: deleteUser?._id };
        try {
            setDeleteLoading(true);
            const res = await removeMemberFromGroup(obj)
            if (res.status === 200) {
                toast({
                    title: "Member removed successfully",
                    description: res?.data?.message || "Member removed successfully",
                    variant: "default",
                });

                // Dispatch immediate update if backend returns updated group
                if (res.data.group) {
                    dispatch(setUpdateGroupDetail(res.data.group));
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


    if (!groupList || groupList.length === 0) {
        return (
            <div className="flex justify-center items-center h-[60vh] text-xl font-semibold">
                Loading...
            </div>
        );
    }

    if (!group) {
        return (
            <div className="flex justify-center items-center h-[60vh] text-xl font-semibold">
                Group not found
            </div>
        );
    };


    return (
        <>
            <AddMemberCard isOpen={shareCardOpen} onOpenChange={setShareOpenCard} groupId={groupId} />
            <DeleteCard
                isOpen={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                isLoading={deleteLoading}
                buttonName="Remove"
                title={`Remove Member from ${group?.title}`}
                description={`Are you sure you want to remove "${deleteUser?.fullName}" from "${group?.title}"? They will no longer be part of this group.`}
                onConfirm={handleRemoveMember}
            />
            <div className="w-full min-h-screen bg-gray-100 p-4 md:p-8">
                <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
                    <div className="flex items-center gap-3 mx-6 mt-4">

                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-gray-200 transition"
                        >
                            <ArrowLeft size={22} strokeWidth={2} />
                        </button>

                        <h1 className="font-semibold text-xl">Group</h1>
                    </div>
                    {/* TOP SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">

                        {/* IMAGE GALLERY */}
                        <div>
                            {/* MAIN IMAGE */}
                            <div className="w-full h-[250px] md:h-[350px] rounded-xl overflow-hidden mb-4">
                                <img
                                    src={selectedImage}
                                    alt="group"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* THUMBNAILS */}
                            <div className="flex gap-3 overflow-x-auto">
                                {group.images?.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt="thumb"
                                        onClick={() => setSelectedImage(img)}
                                        className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${selectedImage === img
                                            ? "border-blue-500"
                                            : "border-transparent"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* DETAILS */}
                        <div className="flex flex-col justify-between">

                            <div>

                                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                                    {group.title}
                                </h1>

                                <p className="text-gray-600 mb-3">
                                    <span className="font-semibold text-black">Description: </span>
                                    {group.description}
                                </p>

                                <p className="text-gray-600 mb-2">
                                    <span className="font-semibold text-black">Created By: </span>
                                    {
                                        !group?.createdBy
                                            ? "Admin"
                                            : group?.createdBy?.isDeleted &&
                                                group?.managedByAdmin
                                                ? "(Former Owner • Managed by Admin)"
                                                : group?.createdBy?.fullName
                                    }
                                </p>

                                <p className="text-gray-600">
                                    <span className="font-semibold text-black">Created At: </span>
                                    {new Date(group.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* RIGHT ALIGNED BUTTON */}
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={() => toggleJoin(group?._id)}
                                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all border ${isMember
                                        ? "bg-gray-200 text-blue-600 border-blue-600"
                                        : "gradient-primary text-primary-foreground hover:opacity-90 border-transparent"
                                        }`}
                                >
                                    {isMember ? "Joined" : "Join Group"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MEMBERS SECTION */}
                    <div className="p-6 border-t">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">
                                Members ({group.members?.length})
                            </h2>
                            {group?.createdBy?._id === user?._id && <button
                                onClick={() => setShareOpenCard(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                            >
                                <UserPlus size={18} />
                                Add Member
                            </button>}
                        </div>

                        {/* SCROLLABLE CONTAINER */}
                        <div className="max-h-[500px] overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {group.members?.map((member) => (
                                    <div
                                        key={member._id}
                                        className="bg-gray-50 rounded-xl p-3 text-center shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="relative w-20 h-20 mx-auto mb-2">
                                            <img
                                                src={member.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"}
                                                alt={member.fullName}
                                                className="w-20 h-20 rounded-full object-cover"
                                            />
                                            <OnlineDot userId={member?._id} className="bottom-1 right-1" />
                                        </div>

                                        <h4 className="font-semibold text-sm">
                                            {group?.createdBy?._id !== member?._id && member.fullName}{" "}
                                            {group?.createdBy?._id === member?._id && (
                                                (group?.managedByAdmin && group?.createdBy?.isDeleted)
                                                    ? "(Former Owner • Managed by Admin)"
                                                    : "(Owner)"
                                            )}
                                        </h4>

                                        <p className="text-xs text-gray-500 break-words">
                                            {member.email}
                                        </p>

                                        {/* ✅ REMOVE BUTTON */}
                                        {group?.createdBy?._id !== member?._id && <button
                                            onClick={() => {
                                                setDeleteUser(member);
                                                setDeleteDialogOpen(true);
                                            }}
                                            className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
                                        >
                                            Remove
                                        </button>}
                                    </div>
                                ))}
                            </div>
                        </div>


                    </div>

                </div>
            </div>
        </>
    );
};

export default GroupDetails;