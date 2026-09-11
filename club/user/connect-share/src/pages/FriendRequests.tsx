import { useEffect, useState } from 'react';
import { UserPlus, Check, X, Users, MessageCircle, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { FriendButton } from '@/components/connections/FriendButton';
import { useConnections } from '@/hooks/useConnections';
import { users, mockChats } from '@/data/mockData';
import { getSuggestedUsers, sendRequest, acceptRequest, cancelRequest, pendingRequest, getFriendUsers } from "@/service/friendRequest";
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { addUserFromChat } from "@/service/chat";
import socket from '@/socket/socket';
import OnlineDot from '@/components/ui/online-dot';
import { getMutualFriends } from "@/service/friendRequest";


const FriendRequests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'suggestions' | 'friends'>('received');
  const totalUnread = mockChats.reduce((acc, c) => acc + c.unread, 0);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [sendRequestList, setSendRequestList] = useState([]);
  const [receivedRequestList, setReceivedRequestList] = useState([]);
  const [userListRefresh, setUserListRefresh] = useState(false);
  const [friendList, setFriendList] = useState([]);
  const [messageLoading, setMessageLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState<string | null>(null);

  useEffect(() => {
    socket.on("unSeenFriendRequest", () => {
      handleGetFromAnToPendingRequest();
    })
    socket.on("deleteUser", (data) => {
      const userId = typeof data === "object" ? data?._id : data;

      setFriendList((prev) =>
        prev.filter((u) => u._id !== userId)
      );

      setSuggestedUsers((prev) =>
        prev.filter((u) => u._id !== userId)
      );

      setSendRequestList((prev) =>
        prev.filter((u) => u._id !== userId)
      );

      setReceivedRequestList((prev) =>
        prev.filter((u) => u._id !== userId)
      );
    });

    socket.on("recoverUser", (user) => {
      setFriendList((prev) =>
        prev.some((u) => u._id === user._id)
          ? prev
          : [...prev, user]
      );

      setSuggestedUsers((prev) =>
        prev.some((u) => u._id === user._id)
          ? prev
          : [...prev, user]
      );

      setSendRequestList((prev) =>
        prev.some((u) => u._id === user._id)
          ? prev
          : [...prev, user]
      );

      setReceivedRequestList((prev) =>
        prev.some((u) => u._id === user._id)
          ? prev
          : [...prev, user]
      );
    });
    return () => {
      socket.off("unSeenFriendRequest");
      socket.off("deleteUser");
      socket.off("recoverUser");
    }
  }, []);


  const handleAddUserFromChat = async (userId: string) => {
    if (!user?._id || !userId) return;
    const obj = { senderId: user?._id, receiverId: userId };
    try {
      setMessageLoading(userId);
      const res = await addUserFromChat(obj);

      if (res.status === 200) {
        toast({ title: "Add User From Chat Successfully.", description: res?.data?.message });
        setChatOpen(true);
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Add User From Chat Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" });
    } finally {
      setMessageLoading(null);
    }
  }

  const handleSendRequest = async (userId: string) => {
    if (!user?._id || !userId) return;
    const obj = { fromId: user?._id, toId: userId };
    try {
      setSendLoading(userId);
      const res = await sendRequest(obj);
      if (res.status === 201) {
        toast({ title: "Request Send Successfully.", description: res?.data?.message });
        socket.emit("unSeenFriendRequest", { from: user?._id, to: userId });
        setUserListRefresh(true);
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Send Request Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    } finally {
      setSendLoading(null);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    if (!userId) return;
    try { 
      setAcceptLoading(userId);
      const res = await acceptRequest(userId);
      if (res.status === 200) {
        toast({ title: "Request Accept Successfully.", description: res?.data?.message });
        setUserListRefresh(true);
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Request Accept Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    } finally {
      setAcceptLoading(null);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    if (!userId) return;
    try {
      setCancelLoading(userId);
      const res = await cancelRequest(userId);
      if (res.status === 200) {
        toast({ title: "Request Cancel Successfully.", description: res?.data?.message });
        setUserListRefresh(true);
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Request Cancel Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    } finally {
      setCancelLoading(null);
    }
  };




  const handleGetFromAnToPendingRequest = async () => {
    if (!user?._id) return;
    try {
      const res = await pendingRequest(user?._id);
      if (res.status === 200) {
        setSendRequestList(res?.data?.sent?.length ? res.data.sent : []);
        setReceivedRequestList(res?.data?.received?.length ? res.data.received : []);
        setUserListRefresh(false);
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  const handleGetSuggestedUsers = async () => {
    if (!user?._id) return;
    try {
      const res = await getSuggestedUsers(user?._id);
      if (res.status === 200) {
        setSuggestedUsers(res?.data);
        setUserListRefresh(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (activeTab === "suggestions" || userListRefresh) {
      handleGetSuggestedUsers();
    }
    if (activeTab === "sent" || activeTab === "received" || userListRefresh) {
      handleGetFromAnToPendingRequest();
    }
  }, [activeTab, userListRefresh]);



  const handleGetFriendUsers = async () => {
    if (!user?._id) return;
    try {
      const res = await getFriendUsers(user?._id);
      if (res.status === 200) {
        setFriendList(res?.data?.friends);
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (activeTab === "friends") {
      handleGetFriendUsers();
    }
  }, [activeTab]);


  return (
    <div className="min-h-screen bg-background">
      <Navbar onChatToggle={() => setChatOpen(!chatOpen)} chatUnread={totalUnread} />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
          <UserPlus className="h-7 w-7 text-primary" />
          Friend Requests
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['received', 'sent', 'suggestions', 'friends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {tab}
              {tab === 'received' && receivedRequestList?.length > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                  {receivedRequestList?.length}
                </span>
              )}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary rounded-full" />}
            </button>
          ))}
        </div>

        {/* Received */}
        {activeTab === 'received' && (
          <div className="space-y-3">
            {receivedRequestList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No pending requests</p>
                <p className="text-sm mt-1">When someone sends you a friend request, it will appear here.</p>
              </div>
            ) : (
              receivedRequestList?.map(req => (
                <div key={req?._id} className="bg-card rounded-xl shadow-card p-4 flex items-center gap-4 animate-fade-in">
                  <div className="relative h-16 w-16 shrink-0">
                    <img src={req?.from?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} alt="" className="h-16 w-16 rounded-full object-cover" />
                    <OnlineDot userId={req?.from?._id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground">{req?.from?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{req?.from?.occupation}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      {new Date(req.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(req._id)}
                      className="flex items-center gap-1.5 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      {acceptLoading === req?._id ? <Loader2 className='animate-spin' /> : <span className='flex items-center gap-1'><Check className="h-4 w-4" /> Accept</span>}
                    </button>
                    <button
                      onClick={() => handleCancelRequest(req._id)}
                      className="flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      {cancelLoading === req?._id ? <Loader2 className='animate-spin' /> : <span className='flex items-center gap-1'><X className="h-4 w-4" /> Decline</span>}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Sent */}
        {activeTab === 'sent' && (
          <div className="space-y-3">
            {sendRequestList?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No sent requests</p>
                <p className="text-sm mt-1">Requests you've sent will appear here.</p>
              </div>
            ) : (
              sendRequestList?.map(req => (
                <div key={req._id} className="bg-card rounded-xl shadow-card p-4 flex items-center gap-4 animate-fade-in" >
                  <div className="relative h-14 w-14 shrink-0">
                    <img src={req?.to?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} alt="" className="h-14 w-14 rounded-full object-cover" />
                    <OnlineDot userId={req?.to?._id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground">{req?.to?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{req?.to?.occupation}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(req.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                    </p>                  </div>
                  <button
                    onClick={() => handleCancelRequest(req?._id)}
                    className="flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    {cancelLoading === req?._id ? <Loader2 className='animate-spin' /> : <span className='flex items-center gap-1'><X className="h-4 w-4" /> Cancel</span>}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Suggestions */}
        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {suggestedUsers && suggestedUsers.length > 0 ? (
              suggestedUsers.map(user => (
                <div
                  key={user._id}
                  className="bg-card rounded-xl shadow-card p-4 flex flex-col items-center text-center gap-3 animate-fade-in"
                >
                  <div className="relative h-20 w-20">
                    <img
                      src={user.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    <OnlineDot userId={user?._id} className="bottom-1 right-1" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{user.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user.occupation}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                      <Users className="h-3 w-3" /> {user?.mutualFriendsCount} mutual friends
                    </p>
                  </div>
                  <Button className='h-7.2' onClick={() => handleSendRequest(user?._id)}>
                    {sendLoading === user?._id ? <Loader2 className='animate-spin' /> : <span className='flex items-center gap-1'> <UserPlus /> Add friend</span>}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No suggested users found</p>
                <p className="text-sm mt-1">Users who match your interests or mutual friends will appear here.</p>
              </div>
            )}
          </div>
        )}


        {/* Friends */}
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {friendList?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No Friends Found.</p>
                <p className="text-sm mt-1">Once a friend request is accepted, they will appear here.</p>
              </div>
            ) : (
              friendList?.map(friend => (
                <div key={friend._id} className="bg-card rounded-xl shadow-card p-4 flex items-center gap-4 animate-fade-in cursor-pointer" onClick={() => { navigate(`/profile/${friend?._id}`) }}>
                  <div className="relative h-14 w-14 shrink-0">
                    <img src={friend.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} alt={friend.fullName} className="h-14 w-14 rounded-full object-cover" />
                    <OnlineDot userId={friend?._id} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-foreground">{friend.fullName}</p>
                    <p className="text-sm text-muted-foreground">{friend.occupation}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Friends since {new Date(friend.friendshipCreatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddUserFromChat(friend._id) }}
                    className="flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-green-400 hover:text-white transition-colors"
                  >
                    {messageLoading === friend?._id ? <Loader2 className='animate-spin' /> : <span className='flex items-center gap-1'><MessageCircle className="h-4 w-4" /> Message</span>}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancelRequest(friend._id) }}
                    className="flex items-center gap-1.5 rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    {cancelLoading === friend?._id ? <Loader2 className='animate-spin' /> : <span className='flex items-center gap-1'><X className="h-4 w-4" /> Remove</span>}
                  </button>
                </div>
              ))
            )}
          </div>
        )}



      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default FriendRequests;
