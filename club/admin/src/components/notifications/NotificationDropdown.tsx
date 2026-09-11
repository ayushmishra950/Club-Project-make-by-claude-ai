import { Heart, MessageSquare, Share2, UserPlus, Calendar, Shield, Check, X } from 'lucide-react';
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
  notifications: any[]
  notifOpen: boolean;
}

export function NotificationDropdown({ notifOpen, onClose, notifications }: Props) {
  const user = JSON.parse(localStorage.getItem("admin.user"));
  const [notificationList, setNotificationList] = useState(notifications);

  useEffect(() => {
    if (notifOpen === true) {
      socket.emit("notificationSeen", user?._id);
    }
  }, [notifOpen])

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl bg-card border border-border shadow-elevated animate-fade-in overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-heading font-semibold text-foreground">Notifications</h3>
          {/* <button className="text-xs text-primary hover:underline">Mark all read</button> */}
        </div>

        <div className="max-h-72 overflow-y-auto flex flex-col">
          {notificationList && notificationList.length > 0 ? (
            notificationList
              .filter(n => n?.type === "suggestion" || n?.type === "new_user")
              .map(n => {

                const userToShow = n.sender;

                return (
                  <div
                    key={n._id}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""
                      }`}
                  >
                    {/* PROFILE IMAGE */}
                    <div className="relative shrink-0">
                      <img
                        src={userToShow?.profileImage}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">
                          {userToShow?.fullName}
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          {n?.message}
                        </span>
                      </p>

                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(n.date).toLocaleDateString()}
                      </p>
                    </div>
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
