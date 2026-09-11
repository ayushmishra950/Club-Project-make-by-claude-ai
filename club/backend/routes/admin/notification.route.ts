import express from "express";
import {getAllNotifications} from "../../controllers/admin/notification.controller.js";


const router = express.Router();

router.get("/get", getAllNotifications);

export default router;