import express from "express";
import {handleSendGroupMessage, handleGetChatFromGroup} from "../../controllers/admin/chat.controller.js";
import upload from "../../middlewares/upload.js";


const router = express.Router();

router.post("/group/message",upload.fields([{name:"image", maxCount:1}]), handleSendGroupMessage);
router.get("/group/get/messages/:groupId", handleGetChatFromGroup);

export default router;