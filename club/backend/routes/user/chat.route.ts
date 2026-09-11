import express from "express";
import { getChatUsers,deleteMessageForMe,deleteAllMessagesForMe, deleteMessageForEveryone,blockUserInChat,unBlockUserInChat, rejectGroupInvite, acceptGroupInvite, createOrGetChat, sendMessage, getMessages, markAsSeen } from "../../controllers/user/chat.controller.js"
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.get("/users/:userId", getChatUsers);
router.post("/user/add", createOrGetChat);
router.post("/message/send", upload.fields([{ name: "image", maxCount: 1 }]), sendMessage);
router.get("/messages", getMessages);
router.get("/users/:userId", markAsSeen);
router.post("/user/reject-group-invite", rejectGroupInvite);
router.post("/user/accept-group-invite", acceptGroupInvite);
router.patch("/user/block", blockUserInChat);
router.patch("/user/unblock", unBlockUserInChat);
router.patch("/user/deleteMessageForMe", deleteMessageForMe);
router.patch("/user/deleteMessageForEveryone", deleteMessageForEveryone);
router.patch("/user/deleteAllMessagesForMe", deleteAllMessagesForMe);

export default router;  
