import express from "express";
import {createAnnouncement, getAllAnnouncements,getAnnouncementById, deleteAnnouncement } from "../../controllers/admin/announcement.controller.js";

const router = express.Router();

router.post("/add", createAnnouncement);
router.get("/get", getAllAnnouncements);
router.get("/getbyid/:id", getAnnouncementById);
router.delete("/delete/:id", deleteAnnouncement);


export default router;