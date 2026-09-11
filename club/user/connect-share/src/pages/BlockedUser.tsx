import React, { useState, useEffect } from "react";
import { Search, UserX, Unlock, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Assumed router package
import { useAppDispatch, useAppSelector } from "@/redux-toolkit/customHook/hook";
import { getFriendUsers } from "@/service/friendRequest";
import {getBlockedUsers, unblockedUser} from "@/service/block";
import { getChatUsers, sendMessage, getMessages, rejectGroupInvite,blockUser,unblockUser, acceptGroupInvite } from "@/service/chat";
import { useToast } from "@/hooks/use-toast";
import { setBlockUser, setUnblockUser } from "@/redux-toolkit/slice/chatSlice";
import DeleteCard from "@/components/card/DeleteCard";


export default function BlockedUsers() {
  const navigate = useNavigate(); // Navigation hook instance
  const [blockedList, setBlockedList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
   const[unblockLoading,setUnblockLoading] = useState<null | string>(null);
 const [unblockDialogOpen, setUnblockDialogOpen] = useState(false);
    const [activeChat, setActiveChat] = useState(null);
    const {toast} = useToast();
  const user = JSON.parse(localStorage.getItem("member.user") || "{}");

    const handleUnBlockUser = async(toId) => {
      try{
        setUnblockLoading(toId);
        const obj = {toId: toId, fromId: user?._id};
        const res = await unblockedUser(obj);
        if(res.status === 200){
            handleGetBlockedUsers();
            setUnblockDialogOpen(false);
            setActiveChat(null); 
          toast({title:"User Unblocked Successfully", description: res?.data?.message || "User Unblocked Successfully"});
        }
      }
      catch(err){
        console.log(err);
        toast({title:"Failed to Unblock User", description: err?.response?.data?.message || err?.message, variant: "destructive"});
      }
      finally{
        setUnblockLoading(null);
      }
    }

  const handleGetBlockedUsers = async() => {
    console.log("Fetching blocked users for user ID:", user?._id);
    if(!user?._id) return;
    try{
      const res = await getBlockedUsers(user?._id);
       console.log("Friend Users Response:", res);
        if(res.status === 200){
            setBlockedList(res?.data?.data);
        }
    }
    catch(err){
        console.log(err);
    }
  };

  useEffect(() => {
        handleGetBlockedUsers(); 
  },[]); 
  
  const filteredUsers = blockedList.filter(
    (user) =>
      user?.blockedId?.fullName?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      user?.blockedId?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  return (
    <>
     <DeleteCard
        isOpen={unblockDialogOpen}
        onOpenChange={setUnblockDialogOpen}
        isLoading={Boolean(unblockLoading)}
        buttonName="Unblock"
        title={`Unblock ${activeChat?.blockedId?.fullName || ""}`}
        description={`Are you sure you want to unblock the user "${activeChat?.blockedId?.fullName || ""}"? This will allow them to send you messages and view your profile again.`}
        onConfirm={()=>{handleUnBlockUser(activeChat?.blockedId?._id)}}
      />

    <div className="w-full max-w-2xl mx-auto my-8 bg-white border border-black text-black font-sans shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Header section with explicit navigation control */}
      <div className="p-6 border-b border-black bg-black text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back Action Trigger Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700 mr-1"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
          <UserX className="w-6 h-6 stroke-[2]" />
          <h2 className="text-xl font-bold tracking-tight uppercase">Blocked Accounts</h2>
        </div>
      </div>

      {/* Top Controls Row */}
      <div className="p-6 border-b border-black bg-neutral-50 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search current blocked list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 focus:border-black outline-none transition-colors text-sm tracking-wide"
            />
          </div>

          {/* <form onSubmit={handleBlockUser} className="flex gap-2 flex-1 md:flex-initial">
            <input
              type="text"
              placeholder="Enter User ID to block..."
              value={targetIdInput}
              onChange={(e) => setTargetIdInput(e.target.value)}
              className="flex-1 md:w-56 px-3 py-2 bg-white border border-neutral-300 focus:border-black outline-none transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={loading || !targetIdInput.trim()}
              className="px-5 py-2 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 font-medium text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-black"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Block"}
            </button>
          </form> */}
        </div>
      </div>

      {/* Optimized Infinite Scroll-Safe List Body Section */}
      <div className="max-h-[500px] overflow-y-auto divide-y divide-neutral-200 scrollbar-thin scrollbar-thumb-black">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user?.blockedId?._id}
              className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {user.profileImage ? (
                  <img
                    src={user?.blockedId?.profileImage}
                    alt={user?.blockedId?.fullName}
                    className="w-10 h-10 border border-black grayscale object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 border border-black bg-neutral-100 flex items-center justify-center font-bold text-sm">
                    {user?.blockedId?.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm tracking-wide">{user?.blockedId?.fullName}</h4>
                  <p className="text-xs text-neutral-500 font-mono">ID: {user?.blockedId?._id}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveChat(user);
                  setUnblockDialogOpen(true);
                }}
                disabled={unblockLoading === user?.blockedId?._id}
                className="px-3 py-1.5 border border-black text-black bg-white hover:bg-black hover:text-white disabled:opacity-40 font-medium text-xs uppercase tracking-widest transition-all flex items-center gap-1.5"
              >
                {unblockLoading === user?.blockedId?._id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Unlock className="w-3 h-3 stroke-[2.5]" />
                )}
                Unblock
              </button>
            </div>
          ))
        ) : (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-neutral-400 gap-2">
            <AlertCircle className="w-8 h-8 stroke-[1.5]" />
            <p className="text-sm tracking-wide">No blocked accounts found</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-black bg-neutral-100 text-right text-[10px] text-neutral-500 tracking-widest font-mono uppercase">
        Total Restrictions: {filteredUsers.length}
      </div>
    </div>
    </>
  );
}
