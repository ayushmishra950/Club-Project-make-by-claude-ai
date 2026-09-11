import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Send, Smile, Image, ArrowLeft, Users, LogOut, Phone, Video, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getChatUsers, sendMessage, getMessages, rejectGroupInvite,blockUser,unblockUser, acceptGroupInvite, deleteMessageForMe, deleteMessageForEveryone, deleteAllMessagesForMe } from "@/service/chat";
import { formatChatDate, formatMessageTimestamp, formatMongoDate } from "@/service/global";
import socket from '@/socket/socket';
import { usePresence } from '@/hooks/usePresence';
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import { setMessageList, setMessageRefresh, setNewMessageAdd,setBlockUser, setUnblockUser, setAcceptedInvite, setGroupInvited, setRejectGroupInvite, setUnreadCountRemove, setUserChatList, setExitUserFromGroup, setDeleteUserChat, setRecoverUserChat } from '@/redux-toolkit/slice/chatSlice';
import {setUpdateUserFromList} from '@/redux-toolkit/slice/userSlice';
import { exitMemberFromGroup } from "@/service/group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import DeleteCard from "@/components/card/DeleteCard";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ChatBlockMember {
  user?: string;
  blockedBy?: string;
  blockedAt?: string;
}

export function ChatPanel({ open, onClose }: Props) {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  const messageEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [checkUserId, setCheckUserId] = useState(null);
  // Presence is shared, not local to this panel: see src/socket/socket.ts.
  const isOnline = usePresence();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const dispatch = useAppDispatch();
  const [chatType, setChatType] = useState<"single" | "group">("single");
  const [sendLoading, setSendLoading] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [deleteChatData, setDeleteChatData] = useState(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [unblockLoading, setUnblockLoading] = useState(false);
  const [allMessageDeleteLoading, setAllMessageDeleteLoading] = useState(false);
  const [allMessageDeleteDialog, setAllMessageDeleteDialog] = useState(false);
  const [messageDeleteDialog, setMessageDeleteDialog] = useState(false);
   const [selectedMessage, setSelectedMessage] = useState(null);
   const [deleteType, setDeleteType] = useState<"me" | "everyone" | null>(null);
   const [messageDeleteLoading, setMessageDeleteLoading] = useState(false);
   const [openMessageMenu, setOpenMessageMenu] = useState<string | null>(null);
  const userList = useAppSelector((state) => state?.chat?.userChatList);
  const messageList = useAppSelector((state) => state?.chat?.messageList);
  const filteredChats = userList?.filter((chat) => chatType === "single" ? !chat.isGroup : chat.isGroup);


const handleDeleteAllMessageForMe = async() => {
   const userId = user?._id;
  if(!activeChat?.chatId || !userId) return;
  const obj = {userId, chatId:activeChat?.chatId};
  try{
     setAllMessageDeleteLoading(true);
     const res = await deleteAllMessagesForMe(obj);
     if(res.status=== 200){
      setAllMessageDeleteDialog(false);
              toast({title:"All message Deleted Successfully.", description:res?.data?.message || "All message Deleted."})      
      handleGetMessages();
    }
  }
  catch(err){
        toast({title:"All Message Delete Failed.", description:err?.response?.data?.message || err?.message, variant:"destructive"})
  }finally{
    setAllMessageDeleteLoading(false);
  }
}

const handleDeleteMessage = async () => {

  if(!selectedMessage || !deleteType) return;
  const userId =user?._id;

  try{
    setMessageDeleteLoading(true);
    let res;

    if(deleteType === "me"){
    res = await deleteMessageForMe({ messageId:selectedMessage?._id, userId });
    }else{
      res = await deleteMessageForEveryone({ messageId:selectedMessage?._id, userId });
    }

    if(res.status === 200){
       toast({title:"message Deleted Successfully.", description:res?.data?.message || "message Deleted."})      
      setMessageDeleteDialog(false);
      setSelectedMessage(null);
      setDeleteType(null);
      handleGetMessages();
    }
  }
  catch(err){
    toast({title:"Delete Failed.", description:err?.response?.data?.message || err?.message, variant:"destructive"})
  }
  finally{
    setMessageDeleteLoading(false);
  }
};
 

  const handleBlockUser = async() => {
    try{
      setBlockLoading(true);
      const obj = {chatId: activeChat?.chatId, toId: activeChat?.friend?._id, fromId: user?._id};
      const res = await blockUser(obj);
      if(res.status === 200){
        toast({title:"User Blocked Successfully", description: res?.data?.message || "User Blocked Successfully"});
        setBlockDialogOpen(false);
        dispatch(setBlockUser(obj));
      setActiveChat(prevChat => ({
  ...prevChat,
  blockedMembers: [
    ...(prevChat?.blockedMembers || []),
    {
      user: activeChat?.friend?._id,
      blockedBy: user?._id, // Logged-in user
      blockedAt: new Date().toISOString(),
    },
  ],
}));
      }
    }
    catch(err){
      console.log(err);
      toast({title:"Failed to Block User", description: err?.response?.data?.message || err?.message, variant: "destructive"});
    }
    finally{ 
      setBlockLoading(false);
    }
  };

  const handleUnBlockUser = async() => {
    try{
      setUnblockLoading(true);
      const obj = {chatId: activeChat?.chatId, toId: activeChat?.friend?._id, fromId: user?._id};
      const res = await unblockUser(obj);
      if(res.status === 200){
        toast({title:"User Unblocked Successfully", description: res?.data?.message || "User Unblocked Successfully"});
        setUnblockDialogOpen(false);
        dispatch(setUnblockUser(obj));
        setActiveChat(prevChat => ({
          ...prevChat, blockedMembers: (prevChat?.blockedMembers || []).filter(block => block?.user?.toString() !== activeChat?.friend?._id?.toString())
        }));
      }
    }
    catch(err){
      console.log(err);
      toast({title:"Failed to Unblock User", description: err?.response?.data?.message || err?.message, variant: "destructive"});
    }
    finally{
      setUnblockLoading(false);
    }
  }

  const handleSeenMessages = async (chat) => {
    socket.emit("messageSeen", { chatId: chat?.chatId, receiverUserId: user?._id, senderUserId: chat?.friend?._id });
    socket.emit("getUnreadCount", user?._id);

    dispatch(setUnreadCountRemove({ chat }));
  };

  const syncChatBlockState = useCallback((data: { chatId?: string; toId?: string; userId?: string; fromId?: string }, isBlocked: boolean) => {
    const targetUserId = data?.toId || data?.userId;
    const blockerId = data?.fromId;

    if (!targetUserId || !data?.chatId) return;

    const normalizedPayload = {
      ...data,
      toId: targetUserId,
      fromId: blockerId,
    };

    dispatch(isBlocked ? setBlockUser(normalizedPayload) : setUnblockUser(normalizedPayload));

    setActiveChat((prevChat) => {
      if (!prevChat || prevChat.chatId?.toString() !== data?.chatId?.toString()) return prevChat;

      if (isBlocked) {
        const alreadyBlocked = (prevChat?.blockedMembers || []).some((block: ChatBlockMember) =>
          block?.user?.toString() === targetUserId?.toString() && block?.blockedBy?.toString() === blockerId?.toString()
        );

        if (alreadyBlocked) return prevChat;

        return {
          ...prevChat,
          blockedMembers: [
            ...(prevChat?.blockedMembers || []),
            {
              user: targetUserId,
              blockedBy: blockerId,
              blockedAt: new Date().toISOString(),
            },
          ],
        };
      }

      return {
        ...prevChat,
        blockedMembers: (prevChat?.blockedMembers || []).filter((block: ChatBlockMember) =>
          !(block?.user?.toString() === targetUserId?.toString() && block?.blockedBy?.toString() === blockerId?.toString())
        ),
      };
    });
  }, [dispatch]);

  useEffect(() => {
    socket.on("messageRefresh", (newMessage, updatedAt) => {
      if (newMessage.chatId?.toString() === activeChat?.chatId?.toString()) {
        dispatch(setNewMessageAdd(newMessage));
        socket.emit("messageSeen", { chatId: newMessage.chatId, receiverUserId: user?._id, senderUserId: activeChat?.friend?._id });
      }
      dispatch(setMessageRefresh({ newMessage, updatedAt }));
    });
    socket.on("typingChat", () => {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    });

    socket.on("groupInvite", (data) => {
      handleGetFriendList();
    })

    socket.on("messageSeen", (data) => {
      if (data?.chatId === activeChat?.chatId) {
        dispatch(setMessageList(data?.messages));
      }
    });

    socket.on("blockUser", (data) => {
      syncChatBlockState(data, true);
    });

    socket.on("unblockUser", (data) => {
      syncChatBlockState(data, false);
    });

    socket.on("groupInviteAccepted", (data) => {
      dispatch(setAcceptedInvite(data));
    })

    /* The dots themselves come from the shared presence store, not from here.
       This handler only stamps the open conversation's "last seen", and it is
       named so the cleanup can remove this one listener. A bare
       `socket.off("userOffline")` would take the store's listener with it and
       presence would stop updating for the whole session. */
    const handleFriendOffline = () => {
      setActiveChat((prev) => {
        if (!prev || !prev.friend) return prev;

        return { ...prev, friend: { ...prev.friend, lastSeen: new Date() } };
      });
    };

    socket.on("userOffline", handleFriendOffline);
    socket.on("deleteUser", (user) => {
      dispatch(setDeleteUserChat(user));
    })

    socket.on("recoverUser", (user) => {
      dispatch(setRecoverUserChat(user));
    })

    return () => {
      socket.off("messageRefresh");
      socket.off("typingChat");
      socket.off("userOffline", handleFriendOffline);
      socket.off("messageSeen");
      socket.off("userListUnReadChatCount");
      socket.off("groupInvite");
      socket.off("groupInviteAccepted");
      socket.off("deleteUser");
      socket.off("recoverUser");
      socket.off("blockUser");
      socket.off("unblockUser");
    }
  }, [activeChat?.chatId,activeChat?.friend?._id, dispatch, syncChatBlockState, user?._id])

  const handleAcceptGroupInvite = async (chatId: string, userId: string) => {
    try {
      setAcceptLoading(true);
      const res = await acceptGroupInvite({ chatId, userId });
      if (res.status === 200 || res.status === 201) {
        dispatch(setAcceptedInvite({ chatId, userId }));
        toast({ title: "Group invite accepted successfully.", description: res?.data?.message || "invite accepted successfully" });
      } else {
        toast({ title: "Failed to accept group invite", description: res?.data?.message || "invite accepted failed", variant: "destructive" });
      }
    } catch (err) {
      console.log(err);
      toast({ title: "Failed to accept group invite", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleRejectGroupInvite = async (chatId: string, userId: string) => {
    try {
      setRejectLoading(true);
      const res = await rejectGroupInvite({ chatId, userId });
      if (res.status === 200 || res.status === 201) {
        toast({ title: "Group invite rejected successfully.", description: res?.data?.message || "invite rejected successfully" });
        setActiveChat(null);
        dispatch(setRejectGroupInvite({ chatId, userId }));
      } else {
        toast({ title: "Failed to reject group invite", description: res?.data?.message || "invite rejected failed", variant: "destructive" });
      }
    } catch (err) {
      console.log(err);
      toast({ title: "Failed to reject group invite", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally {
      setRejectLoading(false);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    setCheckUserId(user?._id)
    socket.emit("typingChat", user?._id)
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  const handleSendMessage = async () => {
    try {
      const form = new FormData();
      form.append("chatId", activeChat?.chatId);
      form.append("senderId", user?._id);
      form.append("text", message || "");

      if (selectedFile) {
        form.append("image", selectedFile);
      }
      setSendLoading(true);

      const res = await sendMessage(form);
      if (res.status === 201) {
        setMessage("");
        setSelectedFile(null);
        setPreviewUrl("");
        socket.emit("getUnreadCount", activeChat?.friend?._id)
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Message Send Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    } finally {
      setSendLoading(false);
    }
  };

  const handleGetMessages = useCallback(async () => {
    if (!activeChat?.chatId) { return };
    try {
      const res = await getMessages(activeChat?.chatId);
      if (res.status === 200) {
        dispatch(setMessageList(res?.data?.messages));
      }
    }
    catch (err) {
      console.log(err);
    }
  }, [dispatch, activeChat?.chatId]);

  useEffect(() => {
    if (activeChat?.chatId && messageList?.length === 0) {
      handleGetMessages();
    }
  }, [activeChat?.chatId, handleGetMessages, messageList?.length])

  const handleGetFriendList = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await getChatUsers(user?._id);
      if (res.status === 200) {
        dispatch(setUserChatList(res?.data?.friends));
      }
    }
    catch (err) {
      console.log(err);
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    if (open && (userList?.length === 0 || user?._id)) {
      handleGetFriendList();
    }
  }, [handleGetFriendList, open, user?._id, userList?.length]);


  const handleExitGroup = async () => {
    try {
      setDeleteLoading(true);
      const res = await exitMemberFromGroup({ chatId: activeChat?.chatId, userId: user?._id });
      if (res.status === 200 || res.status === 201) {
        toast({ title: "exit the group", description: res?.data?.message || "You have exited the group successfully" });
        setShowProfileCard(false);
        setActiveChat(null);
        dispatch(setExitUserFromGroup({ chatId: activeChat?.chatId, userId: user?._id }));
        setDeleteChatData(null);
        setDeleteDialogOpen(false);
        await handleGetFriendList();
      }
    } catch (err) {
      console.log(err);
      toast({ title: "Failed to exit group", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!open) return null;
  return (
    <>
       <DeleteCard
     isOpen={allMessageDeleteDialog}
     onOpenChange={()=>{setAllMessageDeleteDialog(false)}}
     isLoading={allMessageDeleteLoading}
     title="Delete All Messages"
     description="All messages will be removed only from your chat. This action cannot be undone."
     buttonName="Delete"
     onConfirm={handleDeleteAllMessageForMe}
     />
    <DeleteCard
     isOpen={messageDeleteDialog}
     onOpenChange={()=>{setMessageDeleteDialog(false)}}
     isLoading={messageDeleteLoading}
     title={deleteType==="everyone"?"Delete Message For Everyone":"Delete Message For Me"}
     description={deleteType==="everyone"?"This message will be removed for everyone.":"This message will be removed only from your chat."}
     buttonName="Delete"
     onConfirm={handleDeleteMessage}
     />

    <DeleteCard
        isOpen={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        isLoading={blockLoading}
        buttonName="Block"
        title={`Block ${activeChat?.friend?.fullName || ""}`}
        description={`Are you sure you want to block the user "${activeChat?.friend?.fullName || ""}"? They will no longer be able to message or view your profile.`}
        onConfirm={handleBlockUser}
      />
      <DeleteCard
        isOpen={unblockDialogOpen}
        onOpenChange={setUnblockDialogOpen}
        isLoading={unblockLoading}
        buttonName="Unblock"
        title={`Unblock ${activeChat?.friend?.fullName || ""}`}
        description={`Are you sure you want to unblock the user "${activeChat?.friend?.fullName || ""}"? This will allow them to send you messages and view your profile again.`}
        onConfirm={handleUnBlockUser}
      />
      <DeleteCard
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteLoading}
        buttonName="Delete"
        title={`Delete Post: ${deleteChatData?.friend?.fullName || deleteChatData?.group?.title || ""}`}
        description={`Are you sure you want to delete the post "${deleteChatData?.friend?.fullName || deleteChatData?.group?.title || ""}"? This action cannot be undone.`}
        onConfirm={handleExitGroup}
      />

      <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => { setChatType("single"); setActiveChat(null); onClose() }} />
      <div className="fixed right-0 top-0 z-50 h-full w-full sm:w-96 bg-card border-l border-border shadow-elevated animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          {activeChat ? (
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => { setShowProfileCard(false); setActiveChat(null); }}
                className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <Popover open={showProfileCard} onOpenChange={setShowProfileCard}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity flex-1 text-left min-w-0">
                    <div className="relative shrink-0">
                      <img
                       src={chatType === "single" ? (activeChat?.friend?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2") : (activeChat?.group?.images?.[0] || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2")}
                       alt=""
                       className="h-8 w-8 rounded-full object-cover"
                      />
                      {/* Online Badge */}
                      {chatType === "single" && activeChat?.friend?._id !== user?._id && isOnline(activeChat?.friend?._id) && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-heading font-semibold text-sm text-left truncate">{chatType === "single"
                        ? (activeChat?.friend?.isDeleted ? "Deleted User" : activeChat?.friend?.fullName)
                        : activeChat?.group?.title}</p>
                      {/* Online / Offline text */}
                      <p className="text-xs text-muted-foreground text-left truncate">
                        {chatType === "group"
                          ? "Group Chat"
                          : chatType === "single" &&
                            activeChat?.friend?._id !== user?._id &&
                            isOnline(activeChat?.friend?._id)
                            ? "Online"
                            : formatMongoDate(activeChat?.friend?.lastSeen)}
                      </p>
                    </div>
                  </button>
                </PopoverTrigger>

                {/* Profile Card Popover */}
                <PopoverContent align="start" className="w-80 p-0 border-0 shadow-lg rounded-2xl">
                  <div className="bg-gradient-to-b from-primary/10 to-transparent p-6 rounded-t-2xl">
                    {/* Profile Image */}
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <img
                          src={chatType === "single" ? (activeChat?.friend?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2") : (activeChat?.group?.images?.[0] || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2")}
                          alt=""
                          className="h-24 w-24 rounded-full object-cover border-4 border-card"
                        />
                        {chatType === "single" && isOnline(activeChat?.friend?._id) && (
                          <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full bg-green-500 ring-2 ring-card" />
                        )}
                      </div>
                    </div>

                    {/* Name & Status */}
                    <div className="text-center mb-6">
                      <h3 className="font-heading font-bold text-lg text-foreground">
                        {chatType === "single" ? activeChat?.friend?.isDeleted ? "Deleted User" : activeChat?.friend?.fullName : activeChat?.group?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {chatType === "group"
                          ? `${activeChat?.group?.members?.length || 0} members`
                          : activeChat?.friend?._id !== user?._id && isOnline(activeChat?.friend?._id)
                            ? "Active now"
                            : `Last seen ${formatMongoDate(activeChat?.friend?.lastSeen)}`}
                      </p>
                    </div>
                    {/* Divider */}
                    <div className="border-t border-border"></div>
                  </div>

                  {/* Details Section */}
                  <div className="p-4">
                    {chatType === "single" && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">PHONE</p>
                          <p className="text-sm text-foreground">{activeChat?.friend?.phoneNumber || "Not available"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">EMAIL</p>
                          <p className="text-sm text-foreground">{activeChat?.friend?.email || "Not available"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">BIO</p>
                          <p className="text-sm text-foreground">{activeChat?.friend?.bio || "No bio added"}</p>
                        </div> 
                        <div className= "flex flex-col gap-2"> 
                           {
                            activeChat?.blockedMembers?.some((block) => block?.user?.toString() === activeChat?.friend?._id?.toString()) ? (
                              <button className="text-sm text-green-500 bg-green-100 hover:bg-green-200 h-10 rounded-lg" onClick={() => {setUnblockDialogOpen(true)}}>Unblock</button>
                            ) : (
                              <button className='text-sm text-red-500 bg-red-100 hover:bg-red-200 h-10 rounded-lg' onClick={() => {setBlockDialogOpen(true)}}>Block</button>
                            )
                          }                         
                          </div> 
                      </div>
                    )}

                    {chatType === "group" && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-2">GROUP MEMBERS ({activeChat?.group?.members?.length || 0})</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {activeChat?.group?.members?.slice(0, 5).map((member, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <img src={member?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} alt="" className="h-6 w-6 rounded-full object-cover" />
                                <span className="text-foreground truncate">{member?.fullName}</span>
                                {member?._id === activeChat?.group?.admin?._id && (
                                  <span className="text-[10px] px-2 py-1 bg-primary/20 text-primary rounded-full">Admin</span>
                                )}
                              </div>
                            ))}
                            {activeChat?.group?.members?.length > 5 && (
                              <p className="text-xs text-muted-foreground">+{activeChat?.group?.members?.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setDeleteChatData(activeChat);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={deleteLoading}
                      className="w-full flex items-center justify-center gap-2 p-3 mt-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {deleteLoading ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      {deleteLoading ? "Deleting..." : chatType === "group" ? "Exit Group" : "Leave Chat"}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <h3 className="font-heading font-semibold text-foreground">Messages</h3>
          )}

          <button
            onClick={() => { setShowProfileCard(false); setActiveChat(null); onClose(); }}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {activeChat ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-3">
              {chatType === "single" && activeChat?.isGroup === false && messageList.length > 0 &&
                messageList.map((m, index) => {
                  const isMe = m?.sender?._id === user?._id || m?.sender === user?._id;
                  const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const currentMessageDate = formatChatDate(m.createdAt);
                  const prevMessageDate = index > 0 ? formatChatDate(messageList[index - 1].createdAt) : null;
                  const showDateBanner = currentMessageDate !== prevMessageDate;

                  let statusIcon;
                  if (isMe) {
                    if (m.status === 'sent') statusIcon = '✓';
                    else if (m.status === 'delivered') statusIcon = '✓✓';
                    else if (m.status === 'seen') statusIcon = '✓✓';
                  }

                  return (
                    <React.Fragment key={m._id}>
                      {/* ------------------- Date Banner ------------------- */}
                      {showDateBanner && (
                        <div className="flex justify-center my-2">
                          <span className="bg-muted/50 text-muted-foreground text-xs px-2 py-1 rounded-full">
                            {currentMessageDate}
                          </span>
                        </div>
                      )}

                      {/* ------------------- Message Bubble ------------------- */}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div
                          className={`relative max-w-[75%] rounded-2xl px-4 py-2 text-sm group ${isMe
                            ? 'gradient-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md'
                            }`}
                        >
                          <button
                        onClick={(e)=>{
                          e.stopPropagation();
                          setOpenMessageMenu(
                            openMessageMenu === m._id ? null : m._id
                          );
                        }}
                        className={`absolute top-2 ${
                          isMe ? "right-2" : "left-2"
                        } opacity-0 group-hover:opacity-100 transition text-xs`}
                      >
                        ⋮
                      </button>
                      {openMessageMenu === m._id && (
                        <div
                          className={`absolute z-50 top-8 ${
                            isMe ? "right-0" : "left-0"
                          } bg-white shadow-lg rounded-lg w-32 text-black text-xs overflow-hidden`}
                        >

                        <button
                          className="w-full px-3 py-2 text-left hover:bg-gray-100"
                          onClick={()=>{
                            setSelectedMessage(m);
                            setDeleteType("me");
                            setMessageDeleteDialog(true);
                            setOpenMessageMenu(null);
                          }}
                        >
                          Delete for me
                        </button>


                            {
                              isMe && (
                                <button
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                                  onClick={()=>{
                                    setSelectedMessage(m);
                                    setDeleteType("everyone");
                                    setMessageDeleteDialog(true);
                                    setOpenMessageMenu(null);
                                  }}
                                >
                                  Delete for everyone
                                </button>
                              )
                            }


                            </div>
                          )}
                          {/* ------------------- Message or Post ------------------- */}
                          {m.postId?._id ? (
                            <div className="flex flex-col gap-1 border rounded-lg p-2 bg-white shadow-sm max-h-48 overflow-hidden">
                              {m.postId.images?.length > 0 && (
                                <img
                                  src={m.postId.images?.[0]}
                                  alt={m.postId.title}
                                  className="w-full h-7 object-cover rounded-md"
                                />
                              )}
                              {m.postId.video && (
                                <video controls className="w-full h-24 rounded-md">
                                  <source src={m.post.video} type="video/mp4" />
                                </video>
                              )}
                              <div className="flex flex-col mt-1">
                                <span className="font-semibold text-sm line-clamp-1">{m?.postId?.title}</span>
                                {m?.postId?.description && (
                                  <span className="text-xs text-muted-foreground line-clamp-2">{m?.postId?.description}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p>{m.text}</p>
                          )}



                          {/* ------------------- Time + Status ------------------- */}
                          <div className="flex items-center justify-end mt-1 text-[10px] gap-1">
                            <span className={isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}>
                              {time}
                            </span>
                            {isMe && (
                              <span
                                className={`text-[10px] ${m.status === 'seen' ? 'text-green-500' : 'text-muted-foreground'}`}
                              >
                                {statusIcon}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}

              {chatType === "group" && activeChat?.isGroup === true && messageList.length > 0 && messageList.map((m, index) => {
                const sender = m.sender;

                const isMe = sender?._id === user?._id || sender === user?._id || sender === user?._id?.toString();

                // admin message (backend: sender null)
                const isAdmin = sender === null;

                const time = new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                const currentMessageDate = formatChatDate(m.createdAt);
                const prevMessageDate = index > 0 ? formatChatDate(messageList[index - 1].createdAt) : null;

                const showDateBanner = currentMessageDate !== prevMessageDate;

                // MEDIA NORMALIZATION
                const media = m.postId?.images?.length > 0 ? m.postId.images : m.images?.length > 0 ? m.images : [];

                const isVideo = (url: string) => url?.includes(".mp4") || url?.includes(".webm") || url?.includes(".ogg") || url?.includes("video");

                return (
                  <React.Fragment key={m._id}>
                    {/* Date */}
                    {showDateBanner && (
                      <div className="flex justify-center my-2">
                        <span className="bg-muted/50 text-muted-foreground text-xs px-2 py-1 rounded-full">
                          {currentMessageDate}
                        </span>
                      </div>
                    )}

                    {/* Message Row */}
                    <div className={`flex items-end gap-2 mb-2 ${isMe ? "justify-end" : "justify-start"}`} >
                      {/* NAME ONLY */}
                      {!isMe && (
                        <div className="flex flex-col items-start w-10">
                          <span className="text-[11px] font-semibold text-primary">
                            {isAdmin ? "Admin" : sender?.fullName} {sender?.isDeleted && "(Deleted User)"}
                          </span>
                        </div>
                      )}

                      {/* MESSAGE BUBBLE */}
                      <div
                        className={`relative max-w-[75%] rounded-2xl px-4 py-2 text-sm group ${isMe
                          ? "gradient-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                          }`}
                      >
                        <button
                      onClick={(e)=>{
                        e.stopPropagation();
                        setOpenMessageMenu(
                          openMessageMenu === m._id ? null : m._id
                        );
                      }}
                      className={`absolute top-2 ${
                        isMe ? "right-2" : "left-2"
                      } opacity-0 group-hover:opacity-100 transition text-xs`}
                    >
                      ⋮
                  </button>
                  {openMessageMenu === m._id && (
                    <div
                      className={`absolute z-50 top-8 ${
                        isMe ? "right-0" : "left-0"
                      } bg-white shadow-lg rounded-lg w-32 text-black text-xs overflow-hidden`}
                    >

                  <button
                    className="w-full px-3 py-2 text-left hover:bg-gray-100"
                    onClick={()=>{
                      setSelectedMessage(m);
                      setDeleteType("me");
                      setMessageDeleteDialog(true);
                      setOpenMessageMenu(null);
                    }}
                  >
                    Delete for me
                  </button>

                      {
                        isMe && (
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-gray-100"
                            onClick={()=>{
                              setSelectedMessage(m);
                              setDeleteType("everyone");
                              setMessageDeleteDialog(true);
                              setOpenMessageMenu(null);
                            }}
                          >
                            Delete for everyone
                          </button>
                        )
                      }
                      </div>
                    )}
                        {/* MEDIA */}
                        {media.length > 0 &&
                          media.map((url: string, i: number) => (
                            <div key={i} className="mb-2">
                              {isVideo(url) ? (
                                <video
                                  controls
                                  className="w-full h-40 rounded-md object-cover"
                                >
                                  <source src={url} type="video/mp4" />
                                </video>
                              ) : (
                                <img
                                  src={url}
                                  className="w-full h-40 object-cover rounded-md"
                                />
                              )}
                            </div>
                          ))}

                        {/* TEXT (ADMIN + USER SAFE) */}
                        {m.text && (
                          <p className={media.length > 0 ? "mt-2" : ""}>{m.text}</p>
                        )}

                        {/* TIME */}
                        <div className="flex justify-end mt-1 text-[10px] opacity-70">
                          {time}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* ------------------- Typing Indicator ------------------- */}
              {(isTyping && (checkUserId !== user?._id)) && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md max-w-[60px]">
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>
            {previewUrl && (
              <div className="px-3 pb-2">
                <div className="relative w-16 h-16">
                  {selectedFile?.type?.startsWith("video") ? (
                    <video
                      src={previewUrl}
                      className="w-16 h-16 rounded object-cover"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}

                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl("");
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* { activeChat && (
              <div className="p-3 border-t border-border mb-[60px] md:mb-0">

                <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">

                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Smile className="h-5 w-5" />
                  </button>

                  <label className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    <Image className="h-5 w-5" />

                    <input
                      type="file"
                      accept="image/*,video/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setSelectedFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }}
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={handleTyping}
                    className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendLoading || (!message && !selectedFile)}
                    className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {sendLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>

                </div>

              </div>
            )} */}

            { activeChat && (
              <div className="p-3 border-t border-border mb-[60px] md:mb-0">

                {/* { chatType === "single" && activeChat?.friend?.isDeleted ? (
                  <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
                    This user is no longer available on ChatApp
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">

                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Smile className="h-5 w-5" />
                    </button>

                    <label className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                      <Image className="h-5 w-5" />
                      <input
                        type="file"
                        accept="image/*,video/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={message}
                      onChange={handleTyping}
                      className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={sendLoading || (!message && !selectedFile)}
                      className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {sendLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>

                  </div>
                )} */}




              { chatType === "single" && activeChat?.friend?.isDeleted ? (
  // 1. पहला नियम: अगर यूजर का अकाउंट डिलीट हो गया है
  <div className="flex items-center justify-center py-3 text-sm text-muted-foreground bg-muted/30 rounded-xl">
    This user is no longer available on ChatApp
  </div>
) : activeChat?.blockedMembers && activeChat.blockedMembers.length > 0 ? (
  // 2. दूसरा नियम: अगर चैट रूम में कोई भी ब्लॉक मौजूद है
  <div className="w-full">
    {/* चेक करें कि ब्लॉक करने वाला मैं (Current User) हूँ या नहीं */}
    {activeChat.blockedMembers[0]?.blockedBy?.toString() === user?._id?.toString() ? (
      // स्थिति A: अगर मैंने ब्लॉक किया है (Blocker View)
      <div className="flex items-center justify-center py-3 px-3 text-sm text-red-500 bg-red-50 rounded-xl font-medium border border-red-100">
        You have blocked this user. Unblock to resume conversation.
      </div>
    ) : (
      // स्थिति B: अगर सामने वाले ने मुझे ब्लॉक किया है (Blocked User View)
      <div className="flex items-center justify-center py-3 px-3 text-sm text-gray-500 bg-gray-50 rounded-xl font-medium border border-gray-200">
        You cannot reply to this conversation anymore.
      </div>
    )}

    {/* अनब्लॉक बटन: सिर्फ और सिर्फ ब्लॉक करने वाले (Blocker) को ही दिखेगा */}
    {activeChat.blockedMembers[0]?.blockedBy?.toString() === user?._id?.toString() && (
      <button 
        className="text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 h-10 rounded-lg mt-2 w-full transition-colors border border-green-200" 
        onClick={() => setUnblockDialogOpen(true)}
      >
        Unblock
      </button>
    )}
  </div>
) : (
  // 3. तीसरा नियम: नॉर्मल चैट इनपुट फ़ील्ड (जब कोई ब्लॉक न हो)
  <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
    <button className="text-muted-foreground hover:text-foreground transition-colors">
      <Smile className="h-5 w-5" />
    </button>

    <label className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
      <Image className="h-5 w-5" />
      <input
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }}
      />
    </label>

    <input
      type="text"
      placeholder="Type a message..."
      value={message}
      onChange={handleTyping}
      className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
    />

    <button
      onClick={handleSendMessage}
      disabled={sendLoading || (!message && !selectedFile)}
      className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
    >
      {sendLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
    </button>
  </div>
)}

              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex border-b bg-white sticky top-0 z-10">
              <button
                onClick={() => setChatType("single")}
                className={`flex-1 py-2 text-sm font-medium transition-all ${chatType === "single" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`} >
                Chats
              </button>
              <button
                onClick={() => setChatType("group")}
                className={`flex-1 py-2 text-sm font-medium transition-all ${chatType === "group" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`} >
                Groups
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredChats?.length > 0 ? (
                filteredChats.map((chat) => {

                  const isPending = chat?.pendingMembers?.some(
                    (id) => id.toString() === user?._id
                  );

                  return (
                    <button
                      key={chat._id}
                      onClick={() => {
                        if (!isPending) {
                          handleSeenMessages(chat);
                          setActiveChat(chat);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={
                            chat.isGroup
                              ? chat?.group?.images?.[0] || "/group.png"
                              : chat?.friend?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"
                          }
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />

                        {!chat.isGroup &&
                          chat?.friend?._id !== user?._id &&
                          isOnline(chat?.friend?._id) && (
                            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-card" />
                          )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">

                          <div>
                            <p className="font-semibold text-sm text-foreground truncate">
                              {chat.isGroup
                                ? chat?.group?.title
                                : chat?.friend?.fullName}
                            </p>

                            {isPending && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Are you interested in joining this group?
                              </p>
                            )}
                          </div>
                          {chat?.lastMessage?.createdAt && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatMessageTimestamp(chat.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        {chat?.lastMessage?.text && (
                          <p className="text-sm text-muted-foreground truncate">
                            <span className="font-medium">
                              {chat?.lastMessage?.sender?._id === user?._id
                                ? "You: "
                                : ""}
                            </span>

                            {chat.lastMessage.text.length > 40
                              ? chat.lastMessage.text.slice(0, 40) + "..."
                              : chat.lastMessage.text}
                          </p>
                        )}
                      </div>

                      {/* 🔥 RIGHT SIDE */}
                      {isPending ? (
                        <div className="flex items-center gap-1.5 shrink-0">

                          {/* ✅ Accept */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptGroupInvite(chat?.chatId, user?._id);
                            }}
                            disabled={acceptLoading}
                            className="flex items-center justify-center h-7 w-7 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600 transition"
                          >
                            {acceptLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={2.5} />}
                          </button>

                          {/* ❌ Reject */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectGroupInvite(chat?.chatId, user?._id);
                            }}
                            disabled={rejectLoading}
                            className="flex items-center justify-center h-7 w-7 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition"
                          >
                            {rejectLoading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} strokeWidth={2.5} />}
                          </button>

                        </div>
                      ) : (
                        chat?.deliveredMessages?.filter(
                          (msg) =>
                            (msg.sender?._id || msg.sender) !== user?._id
                        )?.length > 0 && (
                          <span className="h-5 w-5 rounded-full gradient-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shrink-0">
                            {chat.deliveredMessages.filter((msg) => (msg.sender?._id || msg.sender) !== user?._id).length}
                          </span>
                        )
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-sm text-muted-foreground">
                  No {chatType === "single" ? "Chats" : "Groups"} Found.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
