import { UserPlus, Users } from 'lucide-react';
import { getSuggestedUsers, sendRequest } from "@/service/friendRequest";
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import socket from '@/socket/socket';
import OnlineDot from '@/components/ui/online-dot';
import { useToast } from '@/hooks/use-toast';

export function SuggestedUsers() {
  const {toast} = useToast();
   const user = JSON.parse(localStorage.getItem("member.user"));
  const [suggestedUsers, setSuggestedUsers] = useState([]);
   const [userListRefresh, setUserListRefresh] = useState(false);

   useEffect(() => {
  socket.on("deleteUser", (data) => {
    setSuggestedUsers((prev) =>
      prev.filter((user) => user._id !== data._id)
    );
  });
  socket.on("recoverUser", (data) => {
    setSuggestedUsers((prev) => {
      const exists = prev.some((u) => u._id === user._id);

      if (exists) {
        return prev;
      }

      return [...prev, data];
    });
  })

   socket.on("blockUser", (data) => {
  setSuggestedUsers((prevUsers) =>
    prevUsers.filter((user) => user._id?.toString() !== data?.userId?.toString())
  );
});

socket.on("unblockUser", (data) => {
  if (data?.user) {
    setSuggestedUsers((prevUsers) => {
      const exists = prevUsers.some((u) => u._id?.toString() === data?.user?._id?.toString());
      return exists ? prevUsers : [...prevUsers, data.user];
    });
  }
});

  return () => {
    socket.off("deleteUser");
    socket.off("recoverUser");
    socket.off("blockUser");
    socket.off("unblockUser");
  };
}, []);

   const handleSendRequest = async (userId: string) => {
        if(!user?._id || !userId) return;
       const obj = { fromId: user?._id, toId: userId };
       try {
         const res = await sendRequest(obj);
         if (res.status === 201) {
           toast({ title: "Request Send Successfully.", description: res?.data?.message });
           socket.emit("unSeenFriendRequest", {from:user?._id, to:userId});
           setUserListRefresh(true);
         
         }
       }
       catch (err) {
         console.log(err);
         toast({ title: "Send Request Failed.", description: err?.response?.data?.message || err?.message, variant: "destructive" })
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
        handleGetSuggestedUsers();
    }, [userListRefresh]);

  return (
    <div className="bg-card rounded-xl shadow-card p-4">
      <h3 className="font-heading font-semibold text-sm text-foreground mb-3">People You May Know</h3>
      <div className="space-y-3">
        {suggestedUsers?.length >0 ?
        suggestedUsers.slice(0, 4).map(user => (
          <div key={user._id} className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0">
              <img src={user?.profileImage || "https://imgs.search.brave.com/xCedoimthG97d8n6Aqc-6LyqR2Oa5N-3B_5XNwx_Hqc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly91cGxv/YWQud2lraW1lZGlh/Lm9yZy93aWtpcGVk/aWEvY29tbW9ucy9h/L2FjL0RlZmF1bHRf/cGZwLmpwZz9fPTIw/MjAwNDE4MDkyMTA2"} alt="" className="h-10 w-10 rounded-full object-cover" />
              <OnlineDot userId={user?._id} className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Users className="h-3 w-3" /> {user?.mutualFriendsCount} mutual
              </p>
            </div>
            {/* <FriendButton user={user} size="sm" showLabel={false} /> */}
            <Button className='w-9 h-9' onClick={()=>{handleSendRequest(user?._id)}}>
              <UserPlus />
            </Button>
          </div>
        ))
        :
        <span className='text-xs text-center ml-16 mt-4'>No Suggestion Found.</span>
      }
      </div>
    </div>
  );
}
