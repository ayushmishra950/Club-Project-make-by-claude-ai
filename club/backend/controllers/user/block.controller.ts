import Block from "../../models/block.model.js";
import { Request, Response } from "express";
import User from "../../models/user.model.js";
import {getIO} from "../../utils/socketHelper.js";
import Chat from "../../models/chat.model.js";
import mongoose from "mongoose";

export const getBlockedUsers = async(req:Request, res:Response) => {
    try{
        const {userId} = req.params;
        if(!userId)return res.status(400).json({message: "User ID is required", success: false});
        const blockedUsers = await Block.find({blockerId: userId}).populate("blockedId", "fullName email profileImage");
        res.status(200).json({ data: blockedUsers, success: true});
    }
    catch(err:any){
        res.status(500).json({message: err?.message || "Internal Server Error", error: err, success: false});
    }
};

export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { toId, fromId } = req.body;
    const io = getIO();

    if (!toId || !fromId) {
      return res.status(400).json({ message: "toId and fromId are required." });
    }
    
    const user = await User.findById(toId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isDeleted) return res.status(403).json({ message: "Account is scheduled for deletion." });
   
    const blockData = await Block.findOne({ blockerId: fromId, blockedId: toId });
    
    if (!blockData) {
      return res.status(404).json({ message: "Block record not found or already unblocked." });
    }

    /* Blocking from a profile or the directory stores the block with no chat,
       because the two members may never have spoken. This used to return 404
       here and leave the block record in place, so anybody blocked that way
       could never be unblocked. The chat update is optional; removing the
       block record is the part that matters. */
    const chat = blockData.chatId ? await Chat.findById(blockData.chatId) : null;

    if (chat?.blockedMembers) {
      chat.blockedMembers = chat.blockedMembers.filter(
        (block: any) => !(block.user.toString() === toId && block.blockedBy.toString() === fromId)
      );
      await chat.save();
    }

    await Block.deleteOne({ blockerId: fromId, blockedId: toId });
   
    io.to(fromId).emit("unblockUser", { chatId: blockData.chatId, userId: toId, user }); 
             
    return res.status(200).json({ message: "User unblocked in chat successfully.", chatId:blockData?.chatId });
  } 
  catch (err: any) {
    return res.status(500).json({ message: err.message, success: false, error: err });
  }
};




export const blockUser = async (req: Request, res: Response) => {
  try {
    const { toId, fromId } = req.body; // toId = jisko block karna hai, fromId = jo block kar raha hai
    const io = getIO();

    // 1. Basic Validation
    if (!toId || !fromId) {
      return res.status(400).json({ message: "toId and fromId are required." });
    }

    if (toId === fromId) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }
    const user = await User.findById(fromId);
    if(!user) return res.status(404).json({message:"you are not perform this task."})

    // 2. Check Target User Exists
    const userToBlock = await User.findById(toId);
    if (!userToBlock) return res.status(404).json({ message: "User not found." });
    if (userToBlock.isDeleted) return res.status(403).json({ message: "Account is scheduled for deletion." });

    // 3. Check if Already Blocked
    const existingBlock = await Block.findOne({ blockerId: fromId, blockedId: toId });
    if (existingBlock) {
      return res.status(400).json({ message: "You have already blocked this user." });
    }

    // 4. Find if a 1v1 Chat Exists between them (Optional Check for Chat update)
    // Agar chat exist nahi karti toh code crash nahi karega, post/profile block kaam karega
    const chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [fromId, toId] }
    });

    // 5. Update Chat Document if it exists
    if (chat) {
      if (!chat.blockedMembers) {
        chat.blockedMembers = [];
      }
      
      // Duplicate entry check in array
      const alreadyInChatBlock = chat.blockedMembers.some(
        (b: any) => b.user.toString() === toId && b.blockedBy.toString() === fromId
      );

      if (!alreadyInChatBlock) {
        chat.blockedMembers.push({
          user: toId,
          blockedBy: fromId,
          blockedAt: new Date()
        });
        await chat.save();
      }
    }

    // 6. Create Global Block Record (Isme chatId save karne ki zaroorat nahi hai)
    // Agar aapke Block model me chatId required field hai, to use schema me update karke optional `chatId?: string` kar dein
    await Block.create({
      blockerId: fromId,
      blockedId: toId,
      chatId: chat ? chat._id : null // Agar chat mili toh attach ki, nahi toh null
    });

     const blockPayload = {
      chatId:chat?._id,
      toId,
      fromId,
      userId: toId,
      user: {
        _id: user._id,
        fullName: user.fullName,
        profileImage: user.profileImage,
      },
    };

    // 7. Socket Notification (Realtime update ke liye dono tabs/rooms par emit)
    io.to(fromId).emit("blockUser", blockPayload);
    io.to(toId).emit("blockUser", blockPayload);

    return res.status(200).json({
      message: "User blocked successfully.",
      chatId: chat ? chat._id : null
    });

  } catch (err: any) {
    return res.status(500).json({ message: err.message, success: false, error: err });
  }
};
