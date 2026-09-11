import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Send, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllGroupsByAdmin, deleteGroup } from "@/service/group";
import { getAllMessage, addMessage } from "@/service/chat";
import GroupDialog from "@/components/forms/GroupDialog";
import socket from "@/socket/socket";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setGroupList, setAddAnRemoveUserGroup, setNewUnReadMessage, setUpdateGroupDetail, setDeleteGroup, setNewGroup, setMessageList, setCleanMessage } from "@/redux-toolkit/slice/groupSlice";
import AddMemberCard from "@/components/cards/AddMemberCard";
import DeleteCard from "@/components/cards/DeleteCard";
import GroupInfoCard from "@/components/cards/GroupInfoCard";


export default function GroupsPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const user = JSON.parse(localStorage.getItem("admin.user"));
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [groupListRefresh, setGroupListRefresh] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [messageText, setMessageText] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const chatEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [shareCardOpen, setShareOpenCard] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteGroupData, setDeleteGroupData] = useState(null);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  const groupList = useAppSelector((state) => state?.group?.groupList);
  const filteredGroupList = groupList;
  const messageList = useAppSelector((state) => state?.group?.messageList);
  const liveUnreadCount = messageList?.filter((msg) => msg?.chatId === chatId && msg?.status !== "seen")?.length;

  const handleSelectGroup = (id: string) => { socket.emit("adminMessageSeen", id) }

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList, selectedGroup]);

  useEffect(() => {
    socket.on("messageAdminRefresh", ({ newMessage, groupId, chatId, updatedAt }) => {
      dispatch(setNewUnReadMessage({ groupId, newMessage, updatedAt }))
      setChatId(chatId);
      if (groupId?.toString() === selectedGroup?._id?.toString()) {
        dispatch(setMessageList({ groupId, newMessage }))
      }
    });


    socket.on("addAnRemoveUserFromGroup", (data) => {
      dispatch(setAddAnRemoveUserGroup(data))
    });

    socket.on("adminMessageSeen", (data) => {
      dispatch(setGroupList(data));
    });

    socket.on("newGroup", (group) => {
      if (group?.createdBy?.toString() === user?._id?.toString() || group?.createdBy === null) {
        dispatch(setNewGroup(group));
      }
    });

    socket.on("deleteGroup", (groupId) => {
      dispatch(setDeleteGroup(groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
      }
    })

    socket.on("updateGroupDetail", (data) => {
      dispatch(setUpdateGroupDetail(data));
    });
    socket.on("groupInviteAccepted", (data) => {
      dispatch(setUpdateGroupDetail(data?.group));
    });

    socket.on("addMembersToGroup", (data) => {
      dispatch(setUpdateGroupDetail(data));
    });
    socket.on("updateUserList", () => {
      handleGetGroups();
    })

    return () => {
      socket.off("messageAdminRefresh");
      socket.off("addAnRemoveUserFromGroup");
      socket.off("adminMessageSeen");
      socket.off("newGroup");
      socket.off("deleteGroup");
      socket.off("updateGroupDetail");
      socket.off("addMembersToGroup");
      socket.off("groupInviteAccepted");
      socket.off("updateUserList");
    }
  }, [selectedGroup])

  // ---------------- MOBILE ----------------
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------------- FETCH GROUPS ----------------
  const handleGetGroups = async () => {
    const res = await getAllGroupsByAdmin(user?._id);
    if (res.status === 200) dispatch(setGroupList(res?.data?.groups));
  };

  useEffect(() => {
    if (groupList?.length === 0 || groupListRefresh) { handleGetGroups(); }
  }, [groupListRefresh, groupList?.length]);

  // ---------------- FETCH MESSAGES ----------------
  const handleGetMessagesFromGroup = async () => {
    if (!selectedGroup?._id) return;
    const res = await getAllMessage(selectedGroup._id);
    if (res.status === 200) {
      dispatch(setMessageList({ groupId: selectedGroup._id, messages: res.data.messages }))
    }
  };

  useEffect(() => {
    handleGetMessagesFromGroup();
  }, [selectedGroup?._id]);

  // ---------------- DELETE ----------------
  const handleDeleteGroup = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteGroup(deleteGroupData?._id);
      if (res.status === 200) {
        toast({ title: "Deleted Group.", description: res?.data?.message || "Group Deleted Successfully" });
        setDeleteDialogOpen(false);
        setDeleteGroupData(null);
        handleGetGroups();
      }
    } catch (err) {
      toast({ title: "Error", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };
  // ---------------- FILE ----------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };

  // ---------------- SEND ----------------
  const handleSendMessage = async () => {
    if (!messageText && !selectedFile) return;

    try {
      const formData = new FormData();
      formData.append("chatId", selectedGroup?._id);
      formData.append("groupId", selectedGroup?._id);
      formData.append("message", messageText);

      if (selectedFile) formData.append("image", selectedFile);
      setSendLoading(true);
      // 👉 API CALL HERE
      const res = await addMessage(formData);

      setMessageText("");
      removeSelectedFile();
      handleGetMessagesFromGroup();
    } catch (err) {
      console.log(err);
    } finally {
      setSendLoading(false);
    }
  };

  // ---------------- VIDEO CHECK ----------------
  const isVideo = (url) => url?.includes(".mp4") || url?.includes(".webm") || url?.includes(".ogg") || url?.includes("video");
  return (
    <>
      <GroupInfoCard
        isOpen={groupInfoOpen}
        onOpenChange={setGroupInfoOpen}
        groupId={selectedGroup?._id}
        setSelectedGroup={setSelectedGroup}
      />
      <DeleteCard
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteLoading}
        buttonName="Delete"
        title={`Delete Group: ${deleteGroupData?.title}`} // Dynamic title
        description={`Are you sure you want to delete the group "${deleteGroupData?.title}"? This action cannot be undone.`} // Dynamic description
        onConfirm={handleDeleteGroup}
      />
      <AddMemberCard isOpen={shareCardOpen} onOpenChange={setShareOpenCard} groupId={selectedGroupId} />
      <GroupDialog isOpen={groupDialogOpen} onOpenChange={setGroupDialogOpen} initialData={initialData} setGroupListRefresh={setGroupListRefresh} />
      <div className="h-screen flex bg-gray-100">

        {/* ================= SIDEBAR ================= */}
        {(!isMobile || !selectedGroup) && (
          <div className="w-full md:w-[320px] bg-white border-r flex flex-col">

            <div className="p-3 flex justify-between border-b">
              <h2 className="font-semibold">Groups</h2>
              <Button size="sm" onClick={() => { setInitialData(null); setGroupDialogOpen(true) }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {
                filteredGroupList?.map((group) => {

                  const finalCount = group?.unreadMessages?.length;
                  return (
                    <div
                      key={group._id}
                      onClick={() => {
                        setSelectedGroup(group);
                        handleSelectGroup(group?._id);
                        if (selectedGroup?._id !== group?._id) {
                          dispatch(setCleanMessage());
                        }
                      }}
                      className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={group.images?.[0]}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium">{group.title}</p>
                          <p className="text-xs text-gray-500">
                            {group.members?.length} members
                          </p>
                        </div>
                      </div>

                      {/* 3 DOT */}
                      <div className="relative">
                        {finalCount > 0 && (
                          <span className="absolute -top-1 right-6 min-w-[16px] h-[16px] px-1 text-[10px] flex items-center justify-center rounded-full bg-red-500 text-white leading-none">
                            {finalCount > 99 ? "99+" : finalCount}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === group._id ? null : group._id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openMenuId === group._id && (
                          <div className="absolute right-0 top-6 bg-white border shadow-lg rounded-md w-32 z-50">
                            <button className="w-full px-3 py-2 text-sm hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setSelectedGroupId(group?._id); setShareOpenCard(true); setOpenMenuId(null) }} >
                              Add Members
                            </button>
                            <button className="w-full px-3 py-2 text-sm hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setInitialData(group); setGroupDialogOpen(true); setOpenMenuId(null) }}>
                              Edit
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteGroupData(group); setDeleteDialogOpen(true); setOpenMenuId(null) }}
                              className="w-full px-3 py-2 text-sm text-red-500 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                )}
            </div>
          </div>
        )}

        {/* ================= CHAT ================= */}
        {selectedGroup && (
          <div className="flex-1 flex flex-col bg-white">

            {/* HEADER */}
            <div className="h-14 border-b flex items-center px-3 gap-2">
              {isMobile && (
                <button onClick={() => setSelectedGroup(null)}>
                  <ArrowLeft />
                </button>
              )}

              <img
                src={selectedGroup.images?.[0]}
                className="w-8 h-8 rounded-full cursor-pointer" onClick={() => { setSelectedGroupId(selectedGroup?._id); setGroupInfoOpen(true) }}
              />
              <span className="font-semibold cursor-pointer" onClick={() => { setSelectedGroupId(selectedGroup?._id); setGroupInfoOpen(true) }}>{selectedGroup.title}</span>
            </div>

            {/* CHAT AREA */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">

              {messageList?.length > 0 ? (
                messageList?.map((m) => {
                  const sender = m.sender;

                  const isMe =
                    sender?._id === user?._id ||
                    sender === user?._id;

                  const isAdmin = sender === null;
                  const isRight = isMe || isAdmin;

                  const time = new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const media =
                    m.postId?.images?.length > 0
                      ? m.postId.images
                      : m.images?.length > 0
                        ? m.images
                        : [];

                  return (
                    <div
                      key={m._id}
                      className={`flex ${isRight ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isRight
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-black"
                          }`}
                      >
                        {!isRight && (
                          <p className="text-[11px] font-semibold mb-1 text-blue-600">
                            {sender?.fullName}
                          </p>
                        )}

                        {/* MEDIA */}
                        {media.map((url, i) => (
                          <div key={i} className="mb-2">
                            {isVideo(url) ? (
                              <video controls className="w-full h-40 rounded-md">
                                <source src={url} />
                              </video>
                            ) : (
                              <img src={url} className="w-full h-40 rounded-md" />
                            )}
                          </div>
                        ))}

                        {m.text && <p>{m.text}</p>}

                        <div className="text-[10px] text-right mt-1 opacity-70">
                          {time}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>No messages yet</p>
                  <p className="text-xs">Start chatting</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* PREVIEW */}
            {previewUrl && (
              <div className="p-2 border-t">
                <div className="relative w-fit">
                  {previewUrl.includes("video") ? (
                    <video src={previewUrl} className="w-28 h-28" controls />
                  ) : (
                    <img src={previewUrl} className="w-28 h-28 rounded" />
                  )}

                  <button
                    onClick={removeSelectedFile}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* INPUT */}
            <div className="p-3 border-t flex items-center gap-2 mb-36 md:mb-24">

              {/* FILE */}
              <label className="cursor-pointer">
                📎
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />
              </label>

              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 border rounded-full px-4 py-2"
                placeholder="Type a message..."
                onKeyDown={(e) => { if (e.key === "Enter") { handleSendMessage(); } }}
              />

              <button
                onClick={handleSendMessage}
                disabled={sendLoading || (!messageText && !selectedFile)}
                className="bg-blue-500 text-white p-2 rounded-full flex items-center justify-center"
              >
                {sendLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}