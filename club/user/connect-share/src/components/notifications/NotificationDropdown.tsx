import { Heart, MessageSquare, Share2, UserPlus, Calendar, Shield, Check, X } from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { useConnections } from '@/hooks/useConnections';
import { Link } from 'react-router-dom';
import socket from '@/socket/socket';
import { useEffect, useState } from 'react';

const typeIcon = {
  like: Heart,
  comment: MessageSquare,
  share: Share2,
  friend_request: UserPlus,
  event: Calendar,
  admin: Shield,
};

const typeColor = {
  like: 'text-red-500',
  comment: 'text-blue-500',
  share: 'text-green-500',
  friend_request: 'text-primary',
  event: 'text-yellow-500',
  admin: 'text-purple-500',
};

interface Props {
  onClose: () => void;
  notifications:any[]
  notifOpen:boolean;
}

export function NotificationDropdown({notifOpen, onClose, notifications }: Props) {
  const user = JSON.parse(localStorage.getItem("member.user"));
  const { incomingRequests, acceptRequest, rejectRequest, incomingCount } = useConnections();
  const [notificationList, setNotificationList] = useState(notifications);
  
  useEffect(()=>{
    if(notifOpen === true){
    socket.emit("notificationSeen", user?._id);
    }
  },[notifOpen])

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl bg-card border border-border shadow-elevated animate-fade-in overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-heading font-semibold text-foreground">Notifications</h3>
      
        </div>

    <div className="max-h-72 overflow-y-auto flex flex-col">
  { notificationList && notificationList.length > 0 ? (
    notificationList.filter(n => n.type !== "suggestion").filter(n => {
        if (n?.type === "friend_accept" || n?.type === "friend_cancel") {
          return n?.sender?._id === user?._id;
        }
        if (n.type === "like" || n.type === "comment") {
          return n?.sender?._id === user?._id;
        }
        return true;
      })
      .map(n => {

        // 🔥 USER LOGIC
        const userToShow =
          n.type === "friend_request"
            ? n.sender
            : n.type === "friend_accept" || n.type === "friend_cancel"
            ? n.receiver
            : n.type === "like" || n.type === "comment"
            ? n.receiver
            : n.sender;

        return (
          <div
            key={n._id}
            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
              !n.read ? "bg-primary/5" : ""
            }`}
          >
            {/* 🔥 PROFILE / ADMIN ICON */}
            <div className="relative shrink-0">
              {n.type === "announcement" || n.type === "event" ? (
                // 🟣 ADMIN LETTER AVATAR
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  A
                </div>
              ) : (
                // 🟢 NORMAL USER IMAGE
                <img
                  src={userToShow?.profileImage}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                {/* 🔥 NAME CHANGE */}
                <span className="font-semibold">
                  {n.type === "announcement" || n.type === "event" ? "Admin" : userToShow?.fullName}
                </span>{" "}
                <br />
                <span className="text-muted-foreground">
                  {n?.message}
                </span>
              </p>

              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(n.date).toLocaleDateString()}
              </p>
            </div>

            {/* 🔥 FRIEND REQUEST BUTTONS */}
            {n.type === "friend_request" && (
              <>
                {n.status === "pending" ? (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => acceptRequest(n._id)}
                      className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => rejectRequest(n._id)}
                      className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground font-semibold">
                    {n.status === "accepted"
                      ? "Request accepted"
                      : n.status === "cancelled"
                      ? "Request cancelled"
                      : ""}
                  </span>
                )}
              </>
            )}
          </div>
        );
      })
  ) : (
    <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
      No notifications found.
    </div>
  )}
</div>


        <div className="px-4 py-2.5 border-t border-border">
          <button className="w-full text-center text-sm text-primary font-medium hover:underline">
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
}
