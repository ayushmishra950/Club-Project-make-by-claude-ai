import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { useToast } from "@/hooks/use-toast";
import { addMemberToGroup } from "@/service/group";
import { setUpdateGroup } from "@/redux-toolkit/slice/groupSlice";
import { getAllUser } from "@/service/auth";
import { setUserList } from "@/redux-toolkit/slice/userSlice";

const AddMemberCard = ({ isOpen, onOpenChange, groupId }) => {
    const { toast } = useToast();
    const dispatch = useAppDispatch();
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [totalPages, setTotalPages] = useState(0);
    const [memberListRefresh, setMemberListRefresh] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("active");
    const memberList = useAppSelector((state) => state?.user?.userList);
    const groupList = useAppSelector((state) => state?.group?.groupList);

    const currentGroup = groupList?.find(g => g._id === groupId);
    const existingMemberIds = currentGroup?.members?.map(m => m._id) || [];

    useEffect(() => {
        if (!isOpen) setSelectedUsers([]);
    }, [isOpen]);

    const toggleSelectUser = (id: string) => {
        setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredList = useMemo(() => {
        return memberList
            ?.filter(user => {
                if (existingMemberIds.includes(user._id)) return false;
                if (search) { return user?.fullName?.toLowerCase()?.includes(search.toLowerCase()); }
                return true;
            });
    }, [memberList, search, groupList, groupId]);


    const handleAddMembers = async () => {
        try {
            const payload = { groupId, members: selectedUsers };
            const res = await addMemberToGroup(payload);
            if (res.status === 200) {
                toast({
                    title: "Success",
                    description: res?.data?.message
                });
                onOpenChange(false);
                setSelectedUsers([]);
            }

        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Something went wrong",
                variant: "destructive"
            });
        }
    };


    const handleGetUsers = async () => {
        try {
            const res = await getAllUser({ page, perPage, search, filterStatus });
            if (res.status === 200) {
                dispatch(setUserList(res?.data?.users));
                setTotalPages(Math.ceil(res?.data?.total / perPage));

                setMemberListRefresh(false);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    useEffect(() => {
        if (page || perPage || search || memberListRefresh || filterStatus) { handleGetUsers() }
    }, [page, perPage, search, memberListRefresh, filterStatus]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-11/12 max-w-md max-h-[80vh] flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* CLOSE */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 text-gray-500"
                >
                    ✕
                </button>

                {/* HEADER */}
                <div className="px-4 pt-4 pb-2 border-b">
                    <p className="text-lg font-semibold">Add Members</p>

                    {/* SEARCH */}
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full mt-2 px-3 py-2 border rounded-md text-sm"
                    />
                </div>

                {/* LIST */}
                <div className="flex-1 overflow-y-auto px-4 py-2">

                    {filteredList?.length === 0 && (
                        <p className="text-center text-sm text-gray-400 mt-4">
                            No users found
                        </p>
                    )}

                    {filteredList?.map(item => (
                        <div
                            key={item?._id}
                            className="flex items-center justify-between py-2 border-b"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={item?.profileImage}
                                    className="h-10 w-10 rounded-full object-cover"
                                />

                                <span>
                                    {item?.fullName}
                                </span>
                            </div>

                            <input
                                type="checkbox"
                                checked={selectedUsers.includes(item?._id)}
                                onChange={() => toggleSelectUser(item?._id)}
                                className="h-5 w-5 accent-blue-500"
                            />
                        </div>
                    ))}
                </div>

                {/* FOOTER */}
                <div className="px-4 py-3 border-t">
                    <button
                        onClick={handleAddMembers}
                        disabled={!selectedUsers.length}
                        className="w-full py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                    >
                        Add Members
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberCard;