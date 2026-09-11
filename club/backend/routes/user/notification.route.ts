import express from "express";
import {getNotifications,getNotificationById,updateAllNotifications,updateNotification,deleteNotification} from "../../controllers/user/notification.controller.js";


const router = express.Router();

router.get("/get/:userId", getNotifications);
router.get("/getbyid/:id", getNotificationById);
router.put("/update", updateNotification);
router.delete("/delete/:id", deleteNotification);
router.patch("/updateNotification/:userId", updateAllNotifications);


export default router;