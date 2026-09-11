import express from "express";
import {addCategory, updateCategory, deleteCategory,getAllCategories, getCategoryById } from "../../controllers/admin/category.controller.js";

const router = express.Router();

router.post("/add", addCategory);
router.get("/get", getAllCategories);
router.get("/getbyid/:id", getCategoryById);
router.put("/update", updateCategory);
router.delete("/delete/:id", deleteCategory);


export default router;