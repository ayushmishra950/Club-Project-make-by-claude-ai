import type { Request, Response } from "express";
import { Suggestion } from "../../models/suggestion.model.js";
import { getIO } from "../../utils/socketHelper.js";


export const addSuggestion = async (req: Request, res: Response) => {
  try {
    const { userId, suggestion } = req.body;
    const io = getIO();

    if (!suggestion) {
      return res.status(400).json({ message: "Suggestion is required" });
    }

    const newSuggestion = await Suggestion.create({ suggestion, createdBy: userId });

    const updatedSuggestion = await Suggestion.findById(newSuggestion?._id).populate("createdBy", "fullName email profileImage");

    io.emit("addSuggestion", updatedSuggestion)

    return res.status(201).json({
      message: "Suggestion created successfully",
      data: newSuggestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// ✅ GET ALL
export const getAllSuggestions = async (req: Request, res: Response) => {
  try {
    const suggestions = await Suggestion.find()
      .populate("createdBy", "fullName email profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "All suggestions fetched successfully",
      data: suggestions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// ✅ GET BY ID
export const getSuggestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const suggestion = await Suggestion.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!suggestion) {
      return res.status(404).json({
        message: "Suggestion not found",
      });
    }

    return res.status(200).json({
      message: "Suggestion fetched successfully",
      data: suggestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// ✅ DELETE
export const deleteSuggestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const io = getIO();

    const suggestion = await Suggestion.findByIdAndDelete(id);

    if (!suggestion) {
      return res.status(404).json({
        message: "Suggestion not found",
      });
    }
    io.emit("deleteSuggestion", suggestion);

    return res.status(200).json({
      message: "Suggestion deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};



export const updateSuggestionStatus = async (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;

    const io = getIO();

    const suggestion = await Suggestion.findByIdAndUpdate(id, { status }, { new: true })
      .populate("createdBy", "fullName email profileImage");

    if (!suggestion) {
      return res.status(404).json({
        message: "Suggestion not found",
      });
    }
    io.emit("updateSuggestionStatus", suggestion);

    return res.status(200).json({
      message: "Suggestion status updated successfully",
      data: suggestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

export const replyToSuggestion = async (req: Request, res: Response) => {
  try {
    const { id, userId, adminReply } = req.body;

    if (!id || !adminReply || !userId) {
      return res.status(400).json({
        message: "Suggestion ID, userId and reply are required.",
      });
    }

    const io = getIO();

    const suggestionExist = await Suggestion.findById(id);
    if (!suggestionExist) {
      return res.status(404).json({ message: "Suggestion not found." });
    }

    const isUser = suggestionExist.createdBy.toString() === userId.toString();
    const updateQuery: any = {
      $push: {
        adminReplies: { userId, message: adminReply, createdAt: new Date() },
      },
    };

    if (isUser) {
      updateQuery.$inc = { adminUnreadCount: 1 };
      updateQuery.$set = { userUnreadCount: 0 };
    } else {
      updateQuery.$inc = { userUnreadCount: 1 };
      updateQuery.$set = { adminUnreadCount: 0 };
    }

    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true }
    ).populate("createdBy", "fullName email profileImage");

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found." });
    }


    io.emit("suggestionReply", suggestion);

    return res.status(200).json({
      message: "Reply sent successfully.",
      data: suggestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

// ✅ MARK AS READ BY ADMIN
export const markAsReadByAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      { $set: { adminUnreadCount: 0 } },
      { new: true }
    ).populate("createdBy", "fullName email profileImage");

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found." });
    }

    const io = getIO();
    io.emit("suggestionRead", suggestion);

    return res.status(200).json({
      message: "Suggestion marked as read by admin",
      data: suggestion,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};