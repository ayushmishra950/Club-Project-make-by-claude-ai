import  type { Request, Response } from "express";
import mongoose from "mongoose";
import Announcement from "../../models/announcement.model.js";
import { getIO } from "../../utils/socketHelper.js";

export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "fullName email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      announcements,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message || "Server Error",
    });
  }
};

/**
 * ---------------- GET ANNOUNCEMENT BY ID ----------------
 */
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const announcement = await Announcement.findById(id).populate(
      "createdBy",
      "fullName email profileImage"
    );

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    return res.status(200).json({
      announcement,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message || "Server Error",
    });
  }
};
