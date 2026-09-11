import type { Request, Response } from "express";
import BusinessGroup from "../../models/business.group.model.js";
import mongoose from "mongoose";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";

// ========================
// Create Business Group
// ========================
export const createBusinessGroup = async (req: Request, res: Response) => {
  try {
    const { title, description, members, type, location, category } = req.body;
    
    const files = (req as any).files?.media || [];

    const images: string[] = [];

    for (const file of files) {
      if (!file.buffer) continue;
      const url = await uploadToCloudinary(file.buffer, file.mimetype, "groups");
      images.push(url);
    }

    /* The dashboard posts this as multipart, so `members` arrives as a JSON
       string rather than an array. Passing it straight to Mongoose failed the
       ObjectId cast and the whole request 500'd. */
    const parseMembers = (value: unknown): string[] => {
      if (Array.isArray(value)) return value.flatMap((entry) => parseMembers(entry));
      if (typeof value !== "string") return [];
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[")) {
        try {
          return parseMembers(JSON.parse(trimmed));
        } catch {
          return [];
        }
      }
      return [trimmed];
    };

    const memberIds = parseMembers(members).filter((id) => mongoose.Types.ObjectId.isValid(id));

    const group = new BusinessGroup({
      title,
      description,
      images,
      members: memberIds,
      // The schema only allows public or private; anything else silently
      // failed validation and took the request down with it.
      type: type === "private" ? "private" : "public",
      location,
      category
    });

    await group.save();
    return res.status(201).json({ message: "Group created successfully", group });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Get All Groups
// ========================
export const getBusinessGroups = async (req: Request, res: Response) => {
  try {
    const groups = await BusinessGroup.find().populate("members", "fullName email profileImage");
    return res.status(200).json({ groups });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Get Single Group
// ========================
export const getBusinessGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const groupId = id as string;

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ message: "Invalid Group ID" });

    const group = await BusinessGroup.findById(groupId).populate("members", "fullName email profileImage");
    if (!group) return res.status(404).json({ message: "Group not found" });

    return res.status(200).json({ group });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Update Business Group
// ========================
export const updateBusinessGroup = async (req: Request, res: Response) => {
  try {
    const {id, title, description, members, type, location, category } = req.body;
    const groupId = id as string;

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ message: "Invalid Group ID" });

    const group = await BusinessGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Update basic fields
    group.title = title || group.title;
    group.description = description || group.description;
    group.type = type || group.type;
    group.location = location || group.location;
    group.category = category || group.category;
    if (members) group.members = members;

    // Handle new media files
    const files = (req as any).files?.media || [];
    for (const file of files) {
      if (!file.buffer) continue;
      const url = await uploadToCloudinary(file.buffer, file.mimetype, "groups");
      group.images.push(url);
    }

    await group.save();
    return res.status(200).json({ message: "Group updated successfully", group });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Delete Business Group
// ========================
export const deleteBusinessGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const groupId = id as string;

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return res.status(400).json({ message: "Invalid Group ID" });

    const group = await BusinessGroup.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Add Business Member
// ========================
export const addBusinessMember = async (req: Request, res: Response) => {
  try {
    // The route is POST /addmember/:id, so prefer the param and fall back to the body.
    const groupId = String(req.params.id ?? (req.body as { groupId?: string })?.groupId ?? "");
    const userId = String((req.body as { userId?: string })?.userId ?? "");

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid IDs" });

    const group = await BusinessGroup.findById(groupId).sort({ createdAt: -1 });
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.members.some((id) => id.toString() === userId))
      return res.status(400).json({ message: "User already in group" });

    group.members.push(new mongoose.Types.ObjectId(userId));
    await group.save();

    return res.status(200).json({ message: "Member added successfully", group });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};

// ========================
// Remove Business Member
// ========================
export const removeBusinessMember = async (req: Request, res: Response) => {
  try {
    /* The route is DELETE /removemember/:id/:memberId, but this read the body.
       A DELETE from the dashboard carries no body, so removal never worked.
       Params win; the body stays as a fallback for older callers. */
    const groupId = String(req.params.id ?? (req.body as { groupId?: string })?.groupId ?? "");
    const userId = String(req.params.memberId ?? (req.body as { userId?: string })?.userId ?? "");

    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "Invalid IDs" });

    const group = await BusinessGroup.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter((id) => id.toString() !== userId);
    await group.save();

    return res.status(200).json({ message: "Member removed successfully", group });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || "Server Error" });
  }
};