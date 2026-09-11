import type { Request, Response } from "express";
import { Suggestion } from "../../models/suggestion.model.js";
import { getIO } from "../../utils/socketHelper.js";
import Notification, { NotificationType } from "../../models/notification.model.js";
import { createNotificationInternal } from "../user/notification.controller.js";
import User from "../../models/user.model.js";


export const addSuggestion = async (req: Request, res: Response) => {
  try {
    const { userId, suggestion } = req.body;
    const io = getIO();

    if (!suggestion) return res.status(400).json({ message: "Suggestion is required" });
  
    const user = await User.findById(userId);
    if(!user) return res.status(404).json({message:"user not found."});
    if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."})

    const newSuggestion = await Suggestion.create({ suggestion, createdBy: userId, status: "pending", adminUnreadCount: 1, userUnreadCount: 0, });
    await newSuggestion.populate("createdBy", "fullName email profileImage");

    io.emit("addSuggestion", newSuggestion);

    await createNotificationInternal(userId, userId, NotificationType.SUGGESTION, undefined, `user send a new Suggestion.`);
    return res.status(201).json({ message: "Suggestion created successfully", data: newSuggestion});
  } catch (error) {
    return res.status(500).json({ message: "Server error", error});
  }
};

// ✅ GET ALL
export const getAllSuggestions = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    if (!userId) res.status(400).json({ message: "UserId not found." });
    const user = await User.findById(userId);
    if(!user) return res.status(404).json({message:"user not found."});
    if(user?.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."})
    const suggestions = await Suggestion.find({ createdBy: userId}).populate("createdBy", "fullName email profileImage").sort({ createdAt: -1 });

    return res.status(200).json({ message: "All suggestions fetched successfully", data: suggestions });
  } catch (error:any) {
    return res.status(500).json({ message: error?.message || "Server error", error });
  }
};

// ✅ GET BY ID
export const getSuggestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const suggestion = await Suggestion.findById(id).populate( "createdBy", "name email");

    if (!suggestion) return res.status(404).json({ message: "Suggestion not found" });

    return res.status(200).json({ message: "Suggestion fetched successfully", data: suggestion });
  } catch (error:any) {
    return res.status(500).json({ message: error?.message || "Server error", error });
  }
};

// ✅ DELETE
export const deleteSuggestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const suggestion = await Suggestion.findByIdAndDelete(id);

    if (!suggestion) return res.status(404).json({ message: "Suggestion not found" });

    return res.status(200).json({ message: "Suggestion deleted successfully" });
  } catch (error:any) {
    return res.status(500).json({ message: error?.message || "Server error", error });
  }
};

// ✅ REPLY
export const replyToSuggestion = async (req: Request, res: Response) => {
  try {
    const { id, userId, adminReply } = req.body;

    if (!id || !adminReply || !userId) return res.status(400).json({ message: "Suggestion ID, userId and reply are required." });

    const io = getIO();
    const user = await User.findById(userId);
     if(!user) return res.status(404).json({message:"User Not Found."});
     if(user.isDeleted) return res.status(403).json({message:"Account is scheduled for deletion."})

    const suggestionExist = await Suggestion.findById(id);
    if (!suggestionExist) return res.status(404).json({ message: "Suggestion not found." });

    const isUser = suggestionExist.createdBy.toString() === userId.toString();
    const updateQuery: any = {
      $push: { adminReplies: { userId, message: adminReply, createdAt: new Date() } } };

    if (isUser) {
      updateQuery.$inc = { adminUnreadCount: 1 };
      updateQuery.$set = { userUnreadCount: 0 };
    } else {
      updateQuery.$inc = { userUnreadCount: 1 };
      updateQuery.$set = { adminUnreadCount: 0 };
    }

    const suggestion = await Suggestion.findByIdAndUpdate( id,
      updateQuery, { new: true }).populate("createdBy", "fullName email profileImage");

    if (!suggestion) return res.status(404).json({ message: "Suggestion not found." });

    io.emit("suggestionReply", suggestion);
    return res.status(200).json({ message: "Reply sent successfully.", data: suggestion});
  } catch (error:any) {
    return res.status(500).json({ message: error?.message || "Server error", error });
  }
};

// ✅ MARK AS READ BY USER
export const markAsReadByUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const suggestion = await Suggestion.findOne({ _id: id, isDeleted: false }).populate("createdBy", "fullName email profileImage");

    if (!suggestion) return res.status(404).json({ message: "Suggestion not found"});
    suggestion.userUnreadCount = 0;
    await suggestion.save();
    const io = getIO();
    io.emit("suggestionRead", suggestion);
    return res.status(200).json({ message: "Suggestion marked as read", data: suggestion });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || "Server error", error});
  }
};