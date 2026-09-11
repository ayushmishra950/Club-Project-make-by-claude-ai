import express from "express";
import { addGallery, getAllGallery, updateGallery, deleteGallery, markAnUnMarkGallery } from "../../controllers/admin/gallery.controller.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.post("/add", upload.fields([{ name: "image", maxCount: 4 }]), addGallery);
router.get("/get", getAllGallery);
router.put("/update", upload.fields([{ name: "image", maxCount: 4 }]), updateGallery);
router.delete("/delete/:id", deleteGallery);
router.patch("/marked", markAnUnMarkGallery);

export default router;