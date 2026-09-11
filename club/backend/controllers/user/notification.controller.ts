import type { Request, Response } from "express";
import Notification, { NotificationType } from "../../models/notification.model.js";
import mongoose from "mongoose";
import { getIO } from "../../utils/socketHelper.js";
import Admin from "../../models/admin.model.js";
import User from "../../models/user.model.js";
import { sendPushNotification } from "../../utils/pushNotification.js";

export const createNotificationInternal = async (
  senderId: string | mongoose.Types.ObjectId,
  receiverId: string | mongoose.Types.ObjectId,
  type: NotificationType,
  postId?: string | mongoose.Types.ObjectId,
  message?: string
) => {
  if (!senderId || !receiverId || !type) {
    throw new Error("senderId, receiverId and type are required");
  }
  const io = getIO();

  const notificationData: any = {
    sender: senderId,
    receiver: receiverId,
    type,
    date: new Date(),
    status: type === "friend_request" ? "pending" : type === "friend_accept" ? "accepted" : type === "friend_cancel" ? "cancelled" : ""
  };

  if (postId) notificationData.post = postId;
  if (message) notificationData.message = message;


const notification = await Notification.create(notificationData);

await notification.populate([
  { path: "sender", select: "fullName profileImage" },
  { path: "receiver", select: "fullName profileImage" }
]);

let targetUserId: string;

if (type === "friend_request") {
  targetUserId = receiverId as string;
} 
else if ( type === "friend_accept" || type === "friend_cancel" || type === "like" || type === "comment") {
  targetUserId = senderId.toString();
} 
else { targetUserId = receiverId as string;}

if (type === "announcement" || type === "event") {
  io.emit("notification", notification);
}else if(type === "suggestion" || type === "new_user"){
  io.emit("adminNotification", notification);
}
 else {
  io.to(targetUserId).emit("notification", notification);
}

const pushTargetUserId = ["friend_accept","friend_cancel","like","comment"].includes(type) ? senderId : receiverId;
const pushUser = await User.findById(pushTargetUserId);

if (pushUser?.pushToken) {
    await sendPushNotification( pushUser.pushToken, "New Notification 🔔", message || "You have a new activity",
   { type, senderId, postId });
}

return notification;
};













// ✅ CREATE Notification
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { sender, receiver, type, post, message } = req.body;

    if (!sender || !receiver || !type) {
      return res.status(400).json({
        success: false,
        message: "sender, receiver and type are required"
      });
    }

    const notification = await Notification.create({
      sender,
      receiver,
      type,
      post,
      message
    });

    res.status(201).json({
      success: true,
      data: notification
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// ✅ GET ALL Notifications (for logged-in user)
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const notifications = await Notification.find()
      .populate("sender", "fullName profileImage")
      .populate("receiver", "fullName profileImage")
      .populate("post")
      .sort({ createdAt: -1 });

    const userIdStr = userId.toString();

    const filtered = notifications.filter((n) => {
      const senderId = n.sender?._id?.toString();
      const receiverId = n.receiver?._id?.toString();

      // 🔥 ANNOUNCEMENT → SHOW TO ALL USERS
      if (n.type === "announcement") {
        return true;
      }

      // 🔵 FRIEND / LIKE / COMMENT TYPES
      if (
        n.type === "friend_accept" ||
        n.type === "friend_cancel" ||
        n.type === "like" ||
        n.type === "comment"
      ) {
        return senderId === userIdStr;
      }

      // 🔵 DEFAULT CASE (friend_request etc.)
      return receiverId === userIdStr;
    });

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET Notification BY ID
export const getNotificationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id)
      .populate("sender", "fullName profileImage")
      .populate("post");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// ✅ UPDATE Notification (mark as read)
export const updateNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// ✅ DELETE Notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const updateAllNotifications = async(req:Request, res:Response) => {
  try{
      const userId = req.params.userId;
      if(!userId) return res.status(400).json({message : "userId is required."});

      const user = await User.findById(userId);
      if(!user) return res.status(404).json({message:"user not found."});

      const notificationUpdated = await Notification.updateMany({receiver : userId},{ $set:{isRead : true}});
     
      res.status(200).json({notificationUpdated})
  }
  catch(err:any){
    res.status(500).json({message:err?.message || "server error."});
  }
}