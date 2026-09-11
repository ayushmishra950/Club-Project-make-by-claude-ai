import { useEffect, useState } from 'react';
import { MapPin, Briefcase, Calendar, Gift, Edit2, ChevronRight, UserMinus, Users, UserPlus, LogOut, Crown } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { PostCard } from '@/components/feed/PostCard';
import { mockChats } from '@/data/mockData';
import { deleteUserRequest, getSingleUser, recoverAccount } from "@/service/auth";
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getSuggestedUsers, sendRequest, acceptRequest, cancelRequest, pendingRequest, getFriendUsers } from "@/service/friendRequest";
import { Button } from '@/components/ui/button';
import socket from '@/socket/socket';
import { usePresence } from '@/hooks/usePresence';
import OnlineDot from '@/components/ui/online-dot';
import { isImage, getBirthdayInfo, personalFields } from "@/service/global";
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { setPostList } from "@/redux-toolkit/slice/postSlice";
import { getAllPost } from "@/service/post";
import DeleteCard from "@/components/card/DeleteCard";
import PaymentDialog from "@/components/forms/PaymentDialog";
import { setUserData, setUpdateUser } from "@/redux-toolkit/slice/userSlice";
import { cn } from '@/lib/utils';

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  // Live, so a connection coming online lights up without a refresh.
  const isOnline = usePresence();
  const user = JSON.parse(localStorage.getItem("member.user"));
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'photos' | 'friends'>('posts');
  const totalUnread = mockChats.reduce((acc, c) => acc + c.unread, 0);
  const [friendList, setFriendList] = useState([]);
  const [allFriendRequestStatusList, setAllFriendRequestStatusList] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [userListRefresh, setUserListRefresh] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recoverDialogOpen, setRecoverDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [deleteUser, setDeleteUser] = useState<any | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const postList = useAppSelector((state) => state?.post?.postList);
  const userData = useAppSelector((state) => state?.user?.userData);
  const premiumUser = userData?.premiumUser === "premium";
  const userPosts = postList?.filter((p) => p?.createdBy?._id === userId);

  const isTrue = userId === user?._id;
  const birthday = getBirthdayInfo(userData?.dob);
  const allImages = postList?.filter((p) => p?.createdBy?._id === userId).flatMap(post =>
    (post.images || []).filter(url => isImage(url))) || [];

  const relation = allFriendRequestStatusList?.find((fr) => fr?._id === user?._id);
  const currentStatus = relation?.status;

  useEffect(() => {
    socket.on("paymentRequestAccepted", (data) => {
      dispatch(setUpdateUser(data));
    });
    socket.on("friendRequestAccepted", () => {
      handleGetUser();
    });

    socket.on("userUpdate", (data) => {
      dispatch(setUpdateUser(data));
    });

    return () => {
      socket.off("paymentRequestAccepted");
      socket.off("friendRequestAccepted");
      socket.off("userUpdate");
    }
  }, []);

  const handleDeleteRequestUser = async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteUserRequest(deleteUser?._id);
      if (res.status === 200) {
        toast({ title: "User Account Delete Successfully.", description: res?.data?.message });
        setDeleteDialogOpen(false);
        setDeleteUser(null);
        dispatch(setUserData(null));
        socket.disconnect();
        localStorage.removeItem("member.user");
        localStorage.removeItem("member.accessToken");
        navigate("/login");
      }
    } catch (err) {
      toast({ title: "User Account Deletion Failed.", description: err?.response?.data?.message || err?.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDeleteRequest = async () => {
    if (!userData?._id) return;
    try {
      setRecoverLoading(true);
      const res = await recoverAccount(userData?._id);
      if (res.status === 200) {
        toast({ title: "Delete Request Cancelled.", description: res?.data?.message });
        setRecoverDialogOpen(false);
        dispatch(setUserData(res?.data?.user));
      }
    }
    catch (err) {
      toast({ title: "Delete Request Failed.", description: err?.response?.data?.message || err?.message });
    }
    finally {
      setRecoverLoading(false);
    }
  }

  const handleLogout = () => {
    try {
      setLogoutLoading(true);
      localStorage.removeItem("member.user");
      localStorage.removeItem("member.accessToken");
      toast({title:"Logout", description:"You have Successfully logout."});
       navigate("/login");
       setLogoutDialogOpen(false);
    } catch (err) {
      console.log(err);

    } finally {
      setLogoutLoading(false);
    }

  }

  const completionItems = personalFields.map(field => {
    const value = userData?.[field.key];
    return {
      label: field.label,
      done: value !== undefined && value !== null && value !== ""
    };
  });
  const completionPct = Math.round((completionItems.filter(i => i.done).length / personalFields.length) * 100);

  const tabs = ['posts', 'about', 'photos', 'friends'] as const;


  const handleGetUser = async () => {
    if (!userId) return;
    try {
      const res = await getSingleUser(userId);
      if (res.status === 200) {
        dispatch(setUserData(res?.data?.data));
        const acceptedFriends = res?.data?.friends?.filter(
          (f) => f.status === "accepted"
        );

        setFriendList(acceptedFriends);
        setAllFriendRequestStatusList(res?.data?.friends);
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  const handleGetPosts = async () => {
    if(!user?._id) return;
    try {
      const res = await getAllPost(user?._id);
      if (res.status === 200) {
        dispatch(setPostList(res?.data?.posts));
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (postList?.length === 0) {
      handleGetPosts();
    }
  }, [postList?.length])

  const handleGetSuggestedUsers = async () => {
    if (!userId) return;
    try {
      const res = await getSuggestedUsers(userId);
      if (res.status === 200) {
        setSuggestedUsers(res?.data);
        setUserListRefresh(false);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (activeTab === "friends" || userListRefresh) {
      handleGetSuggestedUsers();
    }
  }, [activeTab, userListRefresh]);


  const handleSendRequest = async (userId: string) => {
    if (!user?._id || !userId) return;
    const obj = { fromId: user?._id, toId: userId };
    try {
      const res = await sendRequest(obj);
      if (res.status === 201) {
        toast({ title: "Request Send Successfully.", description: res?.data?.message });
        setUserListRefresh(true);
        socket.emit("unSeenFriendRequest", { from: user?._id, to: userId });
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Send Request Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    }
  };

  const handleCancelRequest = async (userId: string) => {
    if (!userId) return;
    try {
      const res = await cancelRequest(userId);
      if (res.status === 200) {
        toast({ title: "Friend  Remove Successfully.", description: res?.data?.message });
        setUserListRefresh(true);
      }
    }
    catch (err) {
      console.log(err);
      toast({ title: "Friend Remove Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
    }
  };

  useEffect(() => {
    if (Object.keys(userData || {}).length === 0 || userId) {
      handleGetUser();
    }
  }, [userId, userListRefresh]);


  return (
    <>
      <PaymentDialog open={paymentDialogOpen} setOpen={setPaymentDialogOpen} />
      <DeleteCard
        isOpen={recoverDialogOpen}
        onOpenChange={setRecoverDialogOpen}
        isLoading={recoverLoading}
        buttonName="Recover"
        title={`Cancel  Deletion Request`}
        description={`Are you sure you want to cancel your account deletion request and recover your account?`}
        onConfirm={handleCancelDeleteRequest}
      />
      <DeleteCard
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteLoading}
        buttonName="Delete"
        title={`Delete Your Account`}
        description={`Are you sure you want to delete your account? This action is permanent and cannot be undone.`}
        onConfirm={handleDeleteRequestUser}
      />
      <DeleteCard
        isOpen={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        isLoading={logoutLoading}
        buttonName="Logout"
        title={`User Logout`}
        description={`Are you sure you want to Logout.`}
        onConfirm={handleLogout}
      />

      <div className="min-h-screen bg-background">
        <Navbar onChatToggle={() => setChatOpen(!chatOpen)} chatUnread={totalUnread} />

        {/* Cover */}
        <div className="relative h-48 sm:h-64">
          <img src={userData?.coverImage || "https://imgs.search.brave.com/kw_qY89Yq9zZZHGIxcrZulLXAq5h4GmQ7LtNs1KnOVk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMjIx/NDM2OTQ0Ny92ZWN0/b3IvYWJzdHJhY3Qt/YmFja2dyb3VuZC1k/ZXNpZ24tcm91Z2gt/YW5kLXNvZnQtd2F2/ZS10ZXh0dXJlLXdp/dGgtYmx1cnJlZC1w/YXN0ZWwtY29sb3Jz/LmpwZz9zPTYxMng2/MTImdz0wJms9MjAm/Yz1reW85ZmxNQVN3/c1M5eWYxR3BNRjdm/cHFFWFN5a3ZzMHhI/Zm1DRmdXVFlJPQ"} alt="cover" className={cn("w-full h-full object-cover")} />
          {/* {isTrue &&<button className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-card transition-colors">
    <Camera className="h-3.5 w-3.5" /> Edit Cover
  </button>} */}
        </div>

        <div className="mx-auto max-w-4xl px-4">
          {/* Profile header */}
          <div className="relative -mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 pb-4 border-b border-border">
            {/* <div className="relative">
              <img src={userData?.profileImage} alt="" className="h-32 w-32 rounded-full object-cover ring-4 ring-background" />
              {/* {isTrue && <button className="absolute bottom-2 right-2 h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground">
              <Camera className="h-4 w-4" />
            </button>} 
            </div> */}


            <div className="relative group">
              <img
                src={userData?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"}
                alt=""
                className="h-32 w-32 rounded-full object-cover ring-4 ring-background"
              />

              {/* No dot on your own profile: it would only ever say "yes". */}
              <OnlineDot
                userId={userData?._id}
                hidden={userData?._id === user?._id}
                className="bottom-2 right-2 h-4 w-4 ring-background"
              />

              {
                (premiumUser) && <div className="absolute -top-1 -right-1">

                  <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-30 blur-md"></div>

                  <div className="relative flex items-center justify-center
                    h-9 w-9 rounded-full
                    bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500
                    border-2 border-white
                    shadow-[0_4px_15px_rgba(255,200,0,0.6)]
                    overflow-hidden">

                    <div className="absolute inset-0 bg-white opacity-10 animate-pulse"></div>

                    <Crown size={18} className="text-white drop-shadow-sm" />
                  </div>
                </div>}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-heading text-2xl font-bold text-foreground">{userData?._id === user?._id ? `${userData?.fullName} (You)` : userData?.fullName}</h1>
              <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Briefcase className="h-4 w-4" /> {userData?.occupation}
              </p>
              <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="h-4 w-4" />{userData?.address}
              </p>
              <p className="text-muted-foreground text-sm flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Users className="h-4 w-4" /> {friendList?.length} connections
              </p>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
              {!isTrue && (
                <>
                  {currentStatus === "pending" ? (
                    <button
                      disabled
                      className="flex items-center gap-2 rounded-lg bg-gray-400 px-4 py-2 text-sm font-semibold text-white cursor-not-allowed"
                    >
                      Requested
                    </button>
                  ) : currentStatus === "accepted" ? (
                    <button
                      onClick={() => handleCancelRequest(relation?.requestId)}
                      className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(userData?._id)}
                      className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </button>
                  )}
                </>
              )}
              {isTrue && <>
                <div className='flex gap-2'>

                  <button onClick={() => { navigate(`/userDialog/${userData?._id}`) }} className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
                    <Edit2 className="h-4 w-4" /> Edit Profile
                  </button>
                  <button
                    onClick={() => { setLogoutDialogOpen(true) }}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                  <button
                    onClick={() => { setDeleteUser(userData); setDeleteDialogOpen(true) }}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <LogOut className="h-4 w-4" />
                    Delete
                  </button>
                </div>
                {/* Mobile Premium Card */}
                {
                  userData?.deleteStatus === "pending" ? (
                    <div className="sm:hidden bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm w-full text-left">
                      <h3 className="text-base font-semibold text-red-700">
                        Account Deletion Scheduled
                      </h3>

                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        Your account is scheduled for permanent deletion within 30 days.
                        You can cancel this request anytime before the deadline.
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-red-500">
                          Remaining window: 30 days
                        </span>

                        <button
                          onClick={() => { setRecoverDialogOpen(true); }}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition"
                        >
                          Cancel Deletion
                        </button>
                      </div>
                    </div>
                  ) :
                    (premiumUser || (userData?.paymentImage)) ? null : (
                      <div className="sm:hidden bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm w-full text-left">
                        <h3 className="text-base font-semibold text-yellow-700">
                          Upgrade to Premium
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          Unlock exclusive club features, priority access to events, and premium member benefits to enhance your experience.
                        </p>
                        <button onClick={() => { setPaymentDialogOpen(true) }} className="mt-3 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 transition">
                          Go Premium
                        </button>
                      </div>
                    )
                }
              </>}
            </div>
          </div>

          {/* Desktop Premium Banner */}
          {
            userData?.deleteStatus === "pending" ? (
              <div className="hidden sm:flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm w-full">

                {/* Left Content */}
                <div className="flex items-center gap-6 flex-1 min-w-0">

                  <h3 className="text-base font-semibold text-red-700 whitespace-nowrap">
                    Account Deletion Scheduled
                  </h3>

                  <p className="text-sm text-gray-600 whitespace-normal leading-relaxed">
                    Your account will be permanently deleted in 30 days. You can cancel anytime before that.
                  </p>

                </div>

                {/* Right Content */}
                <div className="flex items-center gap-4 shrink-0 ml-4">

                  <span className="text-xs text-red-500 whitespace-nowrap">
                    Remaining: 30 days
                  </span>

                  <button onClick={() => { setRecoverDialogOpen(true); }} className="text-xs bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition whitespace-nowrap">
                    Cancel Deletion
                  </button>

                </div>

              </div>
            ) :
              isTrue && !(premiumUser || (userData?.paymentImage)) && (
                <div className="hidden sm:flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-sm mt-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-white shadow-inner">
                      <Crown size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-yellow-700">Upgrade to Premium Membership</h3>
                      <p className="text-sm text-gray-600 mt-0.5">Unlock exclusive club features, priority access to events, and premium member benefits.</p>
                    </div>
                  </div>
                  <button onClick={() => setPaymentDialogOpen(true)} className="shrink-0 ml-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition">
                    Go Premium
                  </button>
                </div>
              )}

          {/* Completion bar */}
          {isTrue && <div className="mt-4 bg-card rounded-xl shadow-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading text-sm font-semibold text-foreground">Profile Completion</h3>
              <span className="text-sm font-semibold text-primary">{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${completionPct}%` }} />
            </div>
            <div className="mt-3 space-y-1">
              {completionItems.filter(i => !i.done).map(item => (
                <button key={item.label} className="w-full flex items-center justify-between rounded-lg hover:bg-muted/50 px-2 py-1.5 text-sm text-muted-foreground transition-colors">
                  <span>Add {item.label}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>}

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b border-border">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors relative ${activeTab === tab
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab}
                {tab === 'friends' && <span className="ml-1 text-xs text-muted-foreground">({friendList?.length})</span>}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary rounded-full" />}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="py-4">
            {activeTab === 'posts' && (
              <div className="max-w-2xl">
                {
                  userPosts?.length > 0 ? (
                    userPosts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))
                  ) : (
                    <div className="w-full flex justify-center items-center py-6 pl-8 text-sm text-muted-foreground">
                      No Posts Found.
                    </div>
                  )
                }
              </div>
            )}
            {activeTab === 'about' && (
              <div className="bg-card rounded-xl shadow-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{userData?.occupation}</p>
                    <p className="text-xs text-muted-foreground">Current occupation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{userData?.address}, {userData?.city} {userData?.state}</p>
                    <p className="text-xs text-muted-foreground">Location</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Joined {new Date(userData?.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <p className="text-xs text-muted-foreground">Member since</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-muted-foreground" />
                  <div>
                    {birthday && (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          {birthday.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {birthday.date}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'photos' && (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {
                  allImages && allImages.length > 0 ? (
                    allImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`image-${i}`}
                        className="aspect-square object-cover hover:opacity-90 transition-opacity"
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center text-sm text-muted-foreground py-6">
                      No Images Found.
                    </div>
                  )
                }
              </div>
            )}
            {activeTab === 'friends' && (
              <div className="space-y-3">
                {friendList?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No connections yet</p>
                    <p className="text-sm mt-1">Start connecting with people to grow your network.</p>
                  </div>
                ) : (
                  friendList?.map(friend => (
                    <div key={friend?._id} className="bg-card rounded-xl shadow-card p-4 flex items-center gap-4 animate-fade-in">
                      <div className="relative">
                        <img src={friend?.profileImage} alt="" className="h-14 w-14 rounded-full object-cover" />
                        {isOnline(friend?._id) && (
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold text-foreground">{friend?.fullName}</p>
                        <p className="text-sm text-muted-foreground">{friend?.occupation}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="h-3 w-3" />
                          {/* {getMutualCount(friend.id)}  */}
                          mutual friends
                        </p>
                      </div>
                      {userId === user?._id && <button
                        onClick={() => handleCancelRequest(friend._id)}
                        className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Unfriend
                      </button>}
                    </div>
                  ))
                )}

                {/* Suggested connections */}
                <div className="mt-6">
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-3">People You May Know</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {suggestedUsers?.slice(0, 4).map(user => (
                      <div key={user._id} className="bg-card rounded-xl shadow-card p-4 flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0">
                          <img src={user.profileImage} alt="" className="h-12 w-12 rounded-full object-cover" />
                          <OnlineDot userId={user?._id} className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {user?.mutualFriendsCount} mutual
                          </p>
                        </div>
                        {/* <FriendButton user={user} size="sm" showLabel={false} /> */}
                        <Button className='w-9 h-9' onClick={() => { handleSendRequest(user?._id) }}>
                          <UserPlus className='w-5 h-5' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </>
  );
};

export default Profile;
