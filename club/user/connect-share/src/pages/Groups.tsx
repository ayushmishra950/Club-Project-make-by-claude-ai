import { useEffect, useState } from 'react';
import { Users, Lock, Globe } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { mockChats } from '@/data/mockData';
import { getAllGroups, toggleMember, deleteGroup } from "@/service/group";
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import { setGroupList, setGroupJoinAnUnJoin, setAddAnRemoveUserGroup, setNewGroup, setDeleteGroup, setUpdateGroupDetail, setDeleteUser } from '@/redux-toolkit/slice/businessGroupSlice';
import { useNavigate } from 'react-router-dom';
import socket from '@/socket/socket';
import GroupDialog from "@/components/forms/GroupDialog";
import DeleteCard from "@/components/card/DeleteCard";
import AddMemberCard from "@/components/card/AddMemberCard";
import { setRecoverUser } from '@/redux-toolkit/slice/userSlice';


const Groups = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [chatOpen, setChatOpen] = useState(false);
  const totalUnread = mockChats.reduce((acc, c) => acc + c.unread, 0);
  const [groupListRefresh, setGroupListRefresh] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [initialData, setIntialData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteGroupData, setDeleteGroupData] = useState(null);
  const [shareCardOpen, setShareOpenCard] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const dispatch = useAppDispatch();
  const groupList = useAppSelector((state) => state?.group?.groupList);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };
  useEffect(() => {
    socket.on("newGroup", (group) => {
      dispatch(setNewGroup(group));
    });

    socket.on("groupInviteAccepted", (data) => {
      dispatch(setUpdateGroupDetail(data?.group));
    })
    socket.on("deleteGroup", (groupId) => {
      dispatch(setDeleteGroup(groupId));
    })

    socket.on("addAnRemoveUserFromGroup", (data) => {
      dispatch(setAddAnRemoveUserGroup(data));
    });
    socket.on("deleteUser", (user) => {
    dispatch(setDeleteUser(user));
    });
    
    socket.on("recoverUser", (user) => {
      dispatch(setRecoverUser(user));
    })

    return () => {
      socket.off("newGroup");
      socket.off("deleteGroup");
      socket.off("addAnRemoveUserFromGroup");
      socket.off("groupInviteAccepted");
      socket.off("deleteUser");
      socket.off("recoverUser");
    }
  }, [])

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

  const handleDeleteGroup = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteGroup(deleteGroupData?._id);
      if (res.status === 200) {
        toast({ title: "Deleted Group.", description: res?.data?.message || "Group Deleted Successfully" });
        setDeleteDialogOpen(false);
        setDeleteGroupData(null);
      }
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleGetGroups = async () => {
    try {
      const res = await getAllGroups();
      if (res.status === 200) {
        dispatch(setGroupList(res?.data?.groups));
        setGroupListRefresh(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (groupList.length === 0) {
      handleGetGroups();
    }
  }, [groupList.length]);

  return (
    <>
      <AddMemberCard isOpen={shareCardOpen} onOpenChange={setShareOpenCard} groupId={selectedGroupId} />
      <DeleteCard
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteLoading}
        buttonName="Delete"
        title={`Delete Group: ${deleteGroupData?.title}`}
        description={`Are you sure you want to delete the group "${deleteGroupData?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteGroup}
      />
      <GroupDialog isOpen={groupDialogOpen} onOpenChange={setGroupDialogOpen} initialData={initialData} setGroupListRefresh={setGroupListRefresh} />
      <div className="min-h-screen bg-background">
        <Navbar onChatToggle={() => setChatOpen(!chatOpen)} chatUnread={totalUnread} />
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className='flex flex-row justify-between items-center'>
            <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Groups</h1>
            <button onClick={() => { setIntialData(null); setGroupDialogOpen(true); }} className="gradient-primary rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">Add Group</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {
              groupList?.length > 0 ?
                groupList.map(group => {
                  const isMember = group.members?.some((member) => member._id === user?._id);
                  const isCreatedBy = group?.createdBy?._id === user?._id;
                  return (
                    <div key={group._id} className="relative group bg-card cursor-pointer rounded-xl shadow-card overflow-hidden" onClick={() => navigate(`/groups/${group._id}`)}>
                      {isCreatedBy && (
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(group._id);
                            }}
                            className="bg-black/60 text-white rounded-full p-2"                          >
                            ⋮
                          </button>

                          {/* DROPDOWN */}
                          {openMenuId === group._id && (
                            <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md z-50">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIntialData(group); setGroupDialogOpen(true)
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Edit
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteGroupData(group);
                                  setDeleteDialogOpen(true);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-500"
                              >
                                Delete
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGroupId(group._id);
                                  setShareOpenCard(true);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Add Member
                              </button>
                            </div>
                          )}
                        </div>
                      )
                      }
                      <img src={group?.images?.[0]} alt="" className="w-full h-32 object-cover" />
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-bold text-foreground">{group.title}</h3>
                          {group.isPrivate ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <Globe className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>
                        <div className="flex items-center justify-between">

                          {/* LEFT SIDE */}
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {group.members?.length} members
                            </span>

                            {/* <span className="text-xs text-muted-foreground">
                              CreatedBy:- CreatedBy: { isCreatedBy ? (group?.createdBy?.isDeleted ? "Deleted User" : "You") : (group?.createdBy?.fullName || "Admin")}
                            </span> */}

                            <span className="text-xs text-muted-foreground">
                              Created By: {
                                !group?.createdBy
                                  ? "Admin"
                                  : group?.createdBy?.isDeleted && group?.managedByAdmin
                                    ? "(Former Owner • Managed by Admin)"
                                    : isCreatedBy
                                      ? "You"
                                      : group?.createdBy?.fullName
                              }
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleJoin(group?._id);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${isMember
                              ? "bg-primary/10 text-primary"
                              : "gradient-primary text-primary-foreground hover:opacity-90"
                              }`}
                          >
                            {isMember ? "Joined ✓" : "Join"}
                          </button>

                        </div>
                      </div>
                    </div>
                  )
                }
                )
                :
                <div className="col-span-2 flex justify-center items-center mt-20">
                  <span className="text-muted-foreground text-sm">
                    No Group Found.
                  </span>
                </div>
            }
          </div>
        </div>
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div >
    </>
  );
};

export default Groups;
