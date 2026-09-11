import type { Request, Response } from "express";
import Group from "../../models/group.model.js";
import mongoose from "mongoose";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";
import Message from "../../models/message.model.js";
import Chat from "../../models/chat.model.js";
import { getIO } from "../../utils/socketHelper.js";
import User from "../../models/user.model.js";
import Admin from "../../models/admin.model.js";

// ========================
// Create Group
// ========================


export const createGroup = async (req: Request, res: Response) => {
  try {
    const { title, description, members, createdBy } = req.body;

    const files = (req as any).files?.media || [];
    const images: string[] = [];

    for (const file of files) {
      if (!file.buffer) continue;
      const url = await uploadToCloudinary(
        file.buffer,
        file.mimetype,
        "groups"
      );
      images.push(url);
    }

    // 🔍 CHECK IN BOTH MODELS
    const userExists = await User.findById(createdBy);
    const adminExists = await Admin.findById(createdBy);

    if (!userExists && !adminExists) {
      return res.status(404).json({
        message: "Creator not found (User/Admin)",
      });
    }

    let finalMembers: any[] = [];

    if (adminExists) {
      finalMembers = [];
    } else if (userExists) {
      finalMembers = [createdBy];
    }

    const group = new Group({
      title,
      description,
      images,
      members: finalMembers,
      createdBy,
    });

    await group.save();

    // ✅ CREATE CHAT ONLY IF USER CREATED GROUP
    if (userExists) {
      await Chat.create({ members: finalMembers, isGroup: true, groupId: group._id, });
    }


    let latestGroup = await Group.findById(group._id)
      .populate({
        path: "createdBy",
        select: "fullName email profileImage",
        model: adminExists ? "Admin" : "User",
      })
      .populate({
        path: "members",
        select: "fullName email profileImage",
        model: "User", // members always user
      });

    getIO().emit("newGroup", latestGroup);

    return res.status(201).json({
      message: "Group created successfully",
      group: latestGroup,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Server Error",
    });
  }
};
// ========================
// Get All Groups
// ========================
export const getGroups = async (req: Request, res: Response) => {
  try {
    const groups = await Group.find()
      .populate("members", "fullName email profileImage").populate("createdBy", "fullName email profileImage")
      .sort({ createdAt: -1 });

    const groupsWithMessages = await Promise.all(
      groups.map(async (group) => {
        const chat = await Chat.findOne({ groupId: group._id });

        let unreadMessages: any = [];

        if (chat) {
          unreadMessages = await Message.find({
            chatId: chat._id,
            status: { $ne: "seen" },
            sender: { $ne: null },
          }).sort({ createdAt: -1 });
        }

        return {
          ...group.toObject(),
          chatId: chat ? chat._id : null,
          unreadMessages,
          updatedAt: chat ? chat.updatedAt : group.updatedAt,
        };
      })
    );

    return res.status(200).json({ groups: groupsWithMessages });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};
export const getAllGroupsByAdmin = async (req: Request, res: Response) => {
  try {
    const userId = req.params?.id;

    if (!userId) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const groups = await Group.find({ $or:[{createdBy: admin._id}, {managedByAdmin:true}] }).populate("members", "fullName email profileImage").sort({ createdAt: -1 });

    const groupsWithMessages = await Promise.all(
      groups.map(async (group) => {
        const chat = await Chat.findOne({ groupId: group._id });

        let unreadMessages: any = [];

        if (chat) {
          unreadMessages = await Message.find({ chatId: chat._id, status: { $ne: "seen" }, sender: { $ne: null } }).sort({ createdAt: -1 });
        }

        return { ...group.toObject(), chatId: chat ? chat._id : null, unreadMessages, updatedAt: chat ? chat.updatedAt : group.updatedAt, };
      })
    );

    return res.status(200).json({ groups: groupsWithMessages });

  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
// ========================
// Get Single Group
// ========================
export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const groupId = id as string;

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ message: "Invalid Group ID" });

    const group = await Group.findById(groupId).populate("members", "fullName email profileImage");
    if (!group) return res.status(404).json({ message: "Group not found" });

    return res.status(200).json({ group });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Update Group
// ========================
export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id, title, description, members } = req.body;
    const groupId = id as string;
    const io = getIO();

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ message: "Invalid Group ID" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Update basic fields
    group.title = title || group.title;
    group.description = description || group.description;
    if (members) group.members = members;

    // Handle new media files
    const files = (req as any).files?.media || [];
    for (const file of files) {
      if (!file.buffer) continue;
      const url = await uploadToCloudinary(file.buffer, file.mimetype, "groups");
      group.images.push(url);
    }

    await group.save();

    const populatedGroup = await group.populate([
      { path: "createdBy", select: "fullName email profileImage" },
      { path: "members", select: "fullName email profileImage" }
    ]);

    io.emit("updateGroupDetail", populatedGroup);
    return res.status(200).json({ message: "Group updated successfully", group: populatedGroup });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Delete Group
// ========================
export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const groupId = id as string;
    const io = getIO();

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ message: "Invalid Group ID" });

    const group = await Group.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    io.emit("deleteGroup", groupId);

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Add Member
// ========================

// export const addMember = async (req: Request, res: Response) => {
//   try {
//     const { groupId, members } = req.body;
//     const io = getIO();

//     if (!mongoose.Types.ObjectId.isValid(groupId)) {
//       return res.status(400).json({ message: "Invalid Group ID" });
//     }

//     if (!members || !Array.isArray(members) || members.length === 0) {
//       return res.status(400).json({ message: "Members not found" });
//     }

//     const group = await Group.findById(groupId);
//     if (!group) {
//       return res.status(404).json({ message: "Group not found" });
//     }

//     const existingMembers = group.members.map(m => m.toString());

//     const newMembers = members.filter(
//       (id: string) => !existingMembers.includes(id)
//     );

//     if (newMembers.length === 0) {
//       return res.status(400).json({ message: "All users already in group" });
//     }

//     group.members.push(...newMembers);
//     await group.save();

//     await Chat.findOneAndUpdate(
//       { groupId },
//       {
//         $set: { groupId: groupId, isGroup: true },
//         $addToSet: { members: { $each: newMembers } }
//       },
//       { upsert: true, new: true }
//     );

//     const updateGroup = await group.populate([
//       { path: "createdBy", select: "fullName email profileImage" },
//       { path: "members", select: "fullName email profileImage" }
//     ]);

//     io.emit("addMembersToGroup", updateGroup);

//     return res.status(200).json({
//       message: "Members added successfully",
//       added: newMembers,
//       group: updateGroup
//     });

//   } catch (err: any) {
//     console.error(err);
//     return res.status(500).json({
//       message: err.message || "Server Error"
//     });
//   }
// };











export const addMember = async (req: Request, res: Response) => {
  try {
    const { groupId, members } = req.body;
    const io = getIO();

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid Group ID" });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: "Members not found" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const existingMembers = group.members.map(m => m.toString());

    const newMembers = members.filter(
      (id: string) => !existingMembers.includes(id)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({ message: "All users already in group" });
    }

    const chat = await Chat.findOneAndUpdate(
      { groupId },
      {
        $set: { groupId, isGroup: true },
        $addToSet: {
          pendingMembers: { $each: newMembers }
        }
      },
      { upsert: true, new: true }
    );

    newMembers.forEach((userId: string) => {
      io.to(userId).emit("groupInvite", {
        groupId,
        chatId: chat?._id,
        userId,
        message: "You have been invited to a group",
      });
    });

    return res.status(200).json({
      message: "Invites sent successfully",
      invited: newMembers,
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: err.message || "Server Error"
    });
  }
};




// ========================
// Remove Member
// ========================
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.body;
    const io = getIO();

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid IDs" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter((id) => id.toString() !== userId);
    await group.save();

    // Update chat as well
    await Chat.findOneAndUpdate(
      { groupId },
      {
        $pull: { members: userId }
      },
      { upsert: true }
    );
    const updateGroup = await group.populate([
      { path: "createdBy", select: "fullName email profileImage" },
      { path: "members", select: "fullName email profileImage" }
    ]);

    io.emit("addMembersToGroup", updateGroup);

    return res.status(200).json({ message: "Member removed successfully", group: updateGroup });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};