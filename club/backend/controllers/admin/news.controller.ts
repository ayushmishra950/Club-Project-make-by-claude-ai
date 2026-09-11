import { Request, Response } from "express";
import NewsModel from "../../models/news.js";

// ➤ CREATE NEWS
export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, description, category, createdBy } = req.body;


    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const news = await NewsModel.create({
      title,
      description,
      category,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "News created successfully",
      data: news,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ➤ GET ALL NEWS
export const getAllNews = async (_req: Request, res: Response) => {
  try {
    const news = await NewsModel.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ➤ GET SINGLE NEWS
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const news = await NewsModel.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ➤ UPDATE NEWS
export const updateNews = async (req: Request, res: Response) => {
  try {
    const {id, ...obj} = req.body;

    const updatedNews = await NewsModel.findByIdAndUpdate(
      id,
      obj,
      { new: true }
    );

    if (!updatedNews) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News updated successfully",
      data: updatedNews,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ➤ DELETE NEWS
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedNews = await NewsModel.findByIdAndDelete(id);

    if (!deletedNews) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};