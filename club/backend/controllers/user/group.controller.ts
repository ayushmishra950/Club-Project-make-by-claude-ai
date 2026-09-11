import Group from "../../models/group.model.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Chat from "../../models/chat.model.js";
import User from "../../models/user.model.js";
import { getIO } from "../../utils/socketHelper.js";


// ========================
// Get All Groups
// ========================
export const getAllGroups = async (req: Request, res: Response) => {
  try {
    const groups = await Group.find()
      .populate("members", "fullName email profileImage isDeleted")
      .populate("createdBy", "fullName email profileImage isDeleted")
      .sort({ createdAt: -1 });
    return res.status(200).json({ groups });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};


// ========================
// Toggle Member in Group
// ========================

export const toggleMember = async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.body;
    const io = getIO();

    // ✅ Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const user = await User.findById(userId);

    if (!user || user.isDeleted) return res.status(400).json({ message: "User is not available" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userIndex = group.members.findIndex((id) => id.toString() === userId);

    let message = "";

    if (userIndex !== -1) {
      group.members.splice(userIndex, 1);
      message = "Member removed successfully";

      await Chat.findOneAndUpdate({ groupId }, { $pull: { members: userId }, $set: { groupId: groupId }, });
    } else {
      group.members.push(userId);
      message = "Member added successfully";

      await Chat.findOneAndUpdate({ groupId }, { $set: { groupId: groupId }, $addToSet: { members: userId }, isGroup: true }, { upsert: true, new: true, });
    }

    await group.save();

    const populatedGroup = await group.populate([
      { path: "createdBy", select: "fullName email profileImage" },
      { path: "members", select: "fullName email profileImage" }
    ]);
    io.emit("addMembersToGroup", populatedGroup);

    return res.status(200).json({ message, group: populatedGroup });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Server Error",
    });
  }
};

export const removeMemberFromGroup = async (req: Request, res: Response) => {
  try {
    const { chatId, groupId: requestedGroupId, userId } = req.body;
    const io = getIO();

    if (
      !mongoose.Types.ObjectId.isValid(chatId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    /* This is the one member endpoint where `userId` names somebody other
       than the caller, so it is excluded from `bindActor` and checks
       permission here instead: you may remove yourself (leave), and the
       member who created the group may remove anybody. Admins may do either. */
    const actor = req.actor;
    if (actor?.type !== "admin" && actor?.id !== userId) {
      const owningGroup = requestedGroupId
        ? await Group.findById(requestedGroupId).select("createdBy").lean()
        : await Chat.findById(chatId)
            .select("groupId")
            .lean()
            .then((chat) => (chat?.groupId ? Group.findById(chat.groupId).select("createdBy").lean() : null));

      if (!owningGroup || owningGroup.createdBy?.toString() !== actor?.id) {
        return res.status(403).json({
          success: false,
          message: "Only the member who created this group can remove somebody else from it."
        });
      }
    }

    const user = await User.findById(userId);
if (!user) {  
  return res.status(404).json({ message: "User not found" });
}

    // 🔍 Find chat first
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // ================= SINGLE CHAT =================
    if (!chat.isGroup) {
      await Chat.findByIdAndDelete(chatId);

      io.emit("chatDeleted", {
        chatId,
        userId,
      });

      return res.status(200).json({
        message: "Single chat deleted successfully",
      });
    }

    // ================= GROUP CHAT =================
    const groupId = chat.groupId;

    if (!groupId) {
      return res.status(400).json({
        message: "Group ID not found in chat",
      });
    }

    // 🔍 Check group exists
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // ✅ Remove user from Group
    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: userId },
    });

    // ✅ Remove user from Chat members
    await Chat.findByIdAndUpdate(chatId, {
      $pull: { members: userId },
    });

    // 🔄 Updated group
    const updatedGroup = await Group.findById(groupId).populate(
      "members",
      "fullName email profileImage"
    );

    io.emit("addAnRemoveUserFromGroup", {
      groupId,
      userId,
    });

    return res.status(200).json({
      message: "Member removed successfully from group",
      group: updatedGroup,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Server Error",
    });
  }
};