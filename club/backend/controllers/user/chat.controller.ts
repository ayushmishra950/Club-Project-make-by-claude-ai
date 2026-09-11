
import User from "../../models/user.model.js";
import FriendRequest from "../../models/friendRequest.model.js";
import Chat from "../../models/chat.model.js";
import Message from "../../models/message.model.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { getIO } from "../../utils/socketHelper.js";
import Group from "../../models/group.model.js";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";
import Block from "../../models/block.model.js";

export const getChatUsers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "user not found." });
    if (user?.isDeleted) return res.status(403).json({ message: "Account is scheduled for deletion." })

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const chats = await Chat.find({
      $or: [
        { members: { $in: [userObjectId] } },
        { pendingMembers: { $in: [userObjectId] } }
      ]
    }).sort({ updatedAt: -1 }).populate([
      { path: "lastMessage", populate: { path: "sender", select: "fullName profileImage isOnline lastSeen isDeleted deleteStatus" }, },
      { path: "groupId", select: "title description images members managedByAdmin"}
      ]);

    const friendsData = await Promise.all(
      chats.map(async (chat) => {
        // 🔥 GROUP CHAT
        if (chat.isGroup && chat.groupId) {

          // ✅ GROUP POPULATE ADDED HERE
          const group = await Group.findById(chat.groupId)
            .populate({
              path: "members",
              select: "fullName profileImage isOnline lastSeen isDeleted deleteStatus"
            })
            .select("title description images members managedByAdmin");

          return {
            chatId: chat._id,
            isGroup: true,
            group: group,
            members: group?.members || [],
            pendingMembers: chat.pendingMembers,
            friend: null,
            lastMessage: chat.lastMessage || null,
            deliveredMessages: [],
            updatedAt: chat.updatedAt,
          };
        }

        // 🔥 SINGLE CHAT (UNCHANGED)
        const friendId = chat.members.find(
          (id: mongoose.Types.ObjectId) => !id.equals(userObjectId)
        );

        if (!friendId) return null;

        const friend = await User.findOne({ _id: friendId }).select(
          "fullName email profileImage isOnline lastSeen isDeleted deleteStatus"
        );

        if (!friend) return null;

        const deliveredMessages = await Message.find({
          chatId: chat._id,
          status: "delivered",
        }).select("_id sender text createdAt status");

        return {
          chatId: chat._id, 
          blockedMembers: chat.blockedMembers || [],
          isGroup: false,
          friend,
          group: null,
          lastMessage: chat.lastMessage || null,
          deliveredMessages,
          updatedAt: chat.updatedAt,
        };
      })
    );

    const friends = friendsData.filter(Boolean);

    return res.status(200).json({ friends });

  } catch (err: any) {
    return res.status(500).json({ message: err?.message });
  }
};




export const createOrGetChat = async (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) return res.status(400).json({ message: "Both user IDs are required." });

    const [sender, receiver] = await Promise.all([User.findById(senderId), User.findById(receiverId)]);

    if (!sender || sender.isDeleted) return res.status(403).json({ message: "Your Account is scheduled for deletion." });

    if (!receiver || receiver.isDeleted) return res.status(403).json({ message: "Receiver Account not available." });

    // Check existing chat
    let chat = await Chat.findOne({ members: { $all: [senderId, receiverId], $size: 2 }, isGroup: false });

    // If not exist → create new
    if (!chat) chat = await Chat.create({ members: [senderId, receiverId], isGroup: false });

    res.status(200).json({ chat, message: "user add successfully from chat." });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ 3. Get Messages of a Chat
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.query;

    if (!chatId) return res.status(400).json({ message: "chatId is required." });
    if (!userId || typeof userId !== "string") return res.status(400).json({ message: "userId is required." });

    const messages = await Message.find({ chatId, deletedFor : {$ne : userId}, isDeleted:false })
      .populate("sender", "fullName profileImage").populate("postId")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};



export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { chatId, senderId, text } = req.body;
    const io = getIO();

    const files = (req as any).files;
    const file = files?.image?.[0];

    if (!chatId || !senderId) return res.status(400).json({ message: "chatId and senderId are required." });

    if (!text && !file) return res.status(400).json({ message: "Message or media required." });

    const sender = await User.findById(senderId);

    if (!sender || sender.isDeleted) return res.status(403).json({ message: "Account is scheduled for deletion." });

    let imageUrl = null;

    if (file && file.buffer) {
      imageUrl = await uploadToCloudinary(file.buffer, file.mimetype, "gallery");
    }

    const message = await Message.create({
      chatId,
      sender: senderId,
      text: text || "",
      seenBy: [senderId],
      status: "delivered",
      images: imageUrl ? [imageUrl] : [],
    });

    await message.populate("sender", "fullName profileImage");

    const chat = await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id, updatedAt: new Date() }, { new: true });

    io.emit("messageRefresh", message, chat?.updatedAt);
    io.emit("messageAdminRefresh", { newMessage: message, groupId: chat?.groupId, chatId, updatedAt: chat?.updatedAt });

    return res.status(201).json({
      message: "message sent successfully.",
      data: message,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// ✅ 5. Mark Messages as Seen
export const markAsSeen = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return res.status(400).json({ message: "chatId and userId required." });
    }

    const user = await User.findById(userId);

if (!user) {
  return res.status(404).json({ message: "User not found" });
}

if (user.isDeleted) {
  return res.status(403).json({ message: "Account is scheduled for deletion." });
}

    await Message.updateMany(
      { chatId, seenBy: { $ne: userId } },
      { $addToSet: { seenBy: userId } }
    );

    res.status(200).json({ message: "Messages marked as seen." });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};


export const acceptGroupInvite = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;
    const io = getIO();

    if (!chatId || !userId) {
      return res.status(400).json({ message: "chatId and userId required." });
    }

    const user = await User.findById(userId);

if (!user) {
  return res.status(404).json({ message: "User not found" });
}

if (user.isDeleted) {
  return res.status(403).json({
    message: "Account is scheduled for deletion."
  });
}

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });


    if (!chat.members.includes(userId)) { chat.members.push(userId); }

    chat.pendingMembers = (chat.pendingMembers || []).filter(
      (id: mongoose.Types.ObjectId) => !id.equals(userId)
    );

    await chat.save();

    if (chat.groupId) {
      const group = await Group.findByIdAndUpdate(chat.groupId, { $addToSet: { members: userId }, }, { new: true });
      if (group) {
        await group.populate([
          { path: "createdBy", select: "fullName email profileImage isDeleted" },
          { path: "members", select: "fullName email profileImage" }
        ]);

        io.emit("groupInviteAccepted", { chatId, userId, group });
      }

    }

    return res.status(200).json({
      message: "Group invite accepted successfully.",
    });

  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};


export const rejectGroupInvite = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;

    const io = getIO();

    if (!chatId || !userId) {
      return res.status(400).json({ message: "chatId and userId required." });
    }

    const user = await User.findById(userId);

if (!user) {
  return res.status(404).json({ message: "User not found" });
}

if (user.isDeleted) {
  return res.status(403).json({
    message: "Account is scheduled for deletion."
  });
}

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.pendingMembers = chat.pendingMembers.filter((id: mongoose.Types.ObjectId) => !id.equals(userId));

    await chat.save();
    io.to(userId).emit("rejectGroupInvite", { chatId, userId });

    res.status(200).json({ message: "Group invite rejected successfully." });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};




export const blockUserInChat = async(req:Request, res:Response) => {
  try{
    const { chatId, toId, fromId } = req.body;
    const io = getIO();

    if (!chatId || !toId || !fromId) {
      return res.status(400).json({ message: "chatId, toId, and fromId required." });
    }
    
    const user = await User.findById(fromId);
    if(!user) return res.status(404).json({message:"User not found"});
    if(user.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."});

    const chat = await Chat.findById(chatId);
    if(!chat) return res.status(404).json({message:"Chat not found"});

    // if(!chat.blockedMembers) chat.blockedMembers = [];
    // if(!chat.blockedMembers.includes(toId)) chat.blockedMembers.push(toId);


    if (!chat.blockedMembers) {
  chat.blockedMembers = [];
}

const alreadyBlocked = chat.blockedMembers.some(
  (block: any) =>
    block.user.toString() === toId &&
    block.blockedBy.toString() === fromId
);

if (!alreadyBlocked) {
  chat.blockedMembers.push({
    user: new mongoose.Types.ObjectId(toId),
    blockedBy: new mongoose.Types.ObjectId(fromId),
    blockedAt: new Date(),
  } as any);
}

    await chat.save();

    await Block.findOneAndUpdate(
      { blockerId: fromId, blockedId: toId },
      { blockerId: fromId, blockedId: toId, chatId: chatId },
      { upsert: true, new: true }
    );

    const blockPayload = {
      chatId,
      toId,
      fromId,
      userId: toId,
      user: {
        _id: user._id,
        fullName: user.fullName,
        profileImage: user.profileImage,
      },
    };

    io.to(fromId).emit("blockUser", blockPayload);
    io.to(toId).emit("blockUser", blockPayload);

    res.status(200).json({message:"User blocked in chat successfully."});
  }
  catch(err:any){
    res.status(500).json({message:err.message, success:false, error:err})
  }
};

export const unBlockUserInChat = async(req:Request, res:Response) => {
  try{
    const { chatId, toId, fromId } = req.body;
    const io = getIO();

    if (!chatId || !toId || !fromId) {
      return res.status(400).json({ message: "chatId, toId, and fromId required." });
    }
    
    const user = await User.findById(toId);
    if(!user) return res.status(404).json({message:"User not found"});
    if(user.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."});

    const chat = await Chat.findById(chatId);
    if(!chat) return res.status(404).json({message:"Chat not found"});

    // if(chat.blockedMembers && chat.blockedMembers.includes(toId)){
    //   chat.blockedMembers = chat.blockedMembers.filter((id:mongoose.Types.ObjectId) => !id.equals(toId));
    //   await chat.save();   

    //   // Remove the block record matching the blocker (userId) and blocked target (targetId)
    // await Block.deleteOne({ blockerId: fromId, blockedId: toId, chatId: chatId });
    // } 

    if (chat.blockedMembers) {
    chat.blockedMembers = chat.blockedMembers.filter((block: any) => !( block.user.toString() === toId && block.blockedBy.toString() === fromId));
    await chat.save();

  await Block.deleteOne({ blockerId: fromId, blockedId: toId, chatId: chatId});
}

    const unblockPayload = {
      chatId,
      toId,
      fromId,
      userId: toId,
      user: {
        _id: user._id,
        fullName: user.fullName,
        profileImage: user.profileImage,
      },
    };

    io.to(fromId).emit("unblockUser", unblockPayload);
    io.to(toId).emit("unblockUser", unblockPayload);
             
    res.status(200).json({message:"User unblocked in chat successfully."});
  }
  catch(err:any){
    res.status(500).json({message:err.message, success:false, error:err})
  }
};


// y function single dono tarah k message ko delete karta hai but sirf ek taraf s yani for me only.

export const deleteMessageForMe = async(req:Request,res:Response)=>{
try{
const {messageId,userId}=req.body;

if(!messageId || !userId){

return res.status(400).json({success:false,message:"messageId and userId required"});}

const message = await Message.findById(messageId);

if(!message){
return res.status(404).json({success:false,message:"Message not found"});
}

// `deletedFor` is optional on the schema, so seed it before pushing rather
// than assuming an array is already there.
if (!message.deletedFor) message.deletedFor = [];

const alreadyDeleted = message.deletedFor.some((id) => id.toString() === userId);

if (!alreadyDeleted) message.deletedFor.push(new mongoose.Types.ObjectId(userId));

await message.save();

return res.status(200).json({success:true,message:"Message deleted for you successfully"});

}
catch(error:any){
return res.status(500).json({success:false,message:error.message});
}
};


// y function message ko everyone yani dono taraf s delete karta hai but y ek bar m single message ko hi delete karta hai 

export const deleteMessageForEveryone = async(req:Request,res:Response)=>{
try{

const {messageId,userId}=req.body;

if(!messageId || !userId){
return res.status(400).json({success:false,message:"messageId and userId required"});
}

const message = await Message.findById(messageId);

if(!message){
return res.status(404).json({success:false,message:"Message not found"});
}

if(message.sender?.toString()!== userId){
return res.status(403).json({success:false,message:"You can delete only your own message"});
}

message.isDeleted=true;

message.text="This message was deleted";

message.images=[];

await message.save();

return res.status(200).json({success:true,message:"Message deleted for everyone"});

}
catch(error:any){

return res.status(500).json({success:false,message:error.message});

}
};







export const deleteAllMessagesForMe = async (req: Request, res: Response) => {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return res.status(400).json({
        success: false,
        message: "chatId and userId required",
      });
    }

    await Message.updateMany(
      {
        chatId,
        deletedFor: {
          $ne: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $push: {
          deletedFor: new mongoose.Types.ObjectId(userId),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All messages deleted for you successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
