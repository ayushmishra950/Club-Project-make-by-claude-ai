import Category from "../../models/event.category.model.js";
import type {Request, Response} from "express";


export const addCategory = async(req:Request, res:Response) => {
    try{
          const {name, description, adminId} = req.body;
           
          if(!name) return res.status(400).json({message:"name is required."});
          if(!adminId) return res.status(400).json({message:"adminId is required."});

          const category = await Category.findOne({name:name.toLowerCase()});

          if(category) return res.status(409).json({message:"this name is already used for category."});

          const created = await Category.create({
            name, description, createdBy:adminId
          });

          // The new record is returned so the dashboard can add it to its list
          // without refetching the whole collection.
          res.status(201).json({
            success: true,
            message: "add new Category successfully.",
            category: created,
            data: created
          });

    }
    catch(err:unknown){
        if(err instanceof Error){
            res.status(500).json({message:err?.message});
        }
        else{
            res.status(500).json({message:err});
        }
    }
};



export const updateCategory = async (req: Request, res: Response) => {
    try {
        const {id, name, description, adminId } = req.body;

        if (!id) return res.status(400).json({ message: "category id is required." });
        if (!adminId) return res.status(400).json({ message: "adminId is required." });

        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: "category not found." });

        if (name) {
            const existing = await Category.findOne({ name: name.toLowerCase() });
            if (existing && existing._id.toString() !== id) {
                return res.status(409).json({ message: "this name is already used for category." });
            }
            category.name = name;
        }

        if (description) category.description = description;

        await category.save();

        res.status(200).json({ message: "category updated successfully." });

    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
        } else {
            res.status(500).json({ message: err });
        }
    }
};


export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
     
        if (!id) return res.status(400).json({ message: "category id is required." });

        const category = await Category.findById(id);
        if (!category) return res.status(404).json({ message: "category not found." });

        await Category.findByIdAndDelete(id);

        res.status(200).json({ message: "category deleted successfully." });

    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
        } else {
            res.status(500).json({ message: err });
        }
    }
};

export const getAllCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });

        res.status(200).json({
            message: "categories fetched successfully.",
            data: categories
        });

    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
        } else {
            res.status(500).json({ message: err });
        }
    }
};


export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ message: "category id is required." });

        const category = await Category.findById(id);

        if (!category) return res.status(404).json({ message: "category not found." });

        res.status(200).json({
            message: "category fetched successfully.",
            data: category
        });

    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ message: err.message });
        } else {
            res.status(500).json({ message: err });
        }
    }
};