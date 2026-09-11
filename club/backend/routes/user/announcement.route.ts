import express from "express";
import { getAllAnnouncements,getAnnouncementById } from "../../controllers/user/announcement.controller.js";

const router = express.Router();

router.get("/get", getAllAnnouncements);
router.get("/getbyid/:id", getAnnouncementById);


export default router;