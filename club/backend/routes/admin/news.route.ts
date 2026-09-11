import express from "express";
import {createNews,getAllNews,getNewsById, updateNews, deleteNews  } from "../../controllers/admin/news.controller.js";

const router = express.Router();

router.post("/add", createNews);
router.get("/get", getAllNews);
router.get("/getbyid/:id", getNewsById);
router.put("/update", updateNews);
router.delete("/delete/:id", deleteNews);
 
export default router;