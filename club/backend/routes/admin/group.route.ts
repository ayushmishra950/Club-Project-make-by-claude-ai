import express from "express";
import { createGroup, getGroups, getAllGroupsByAdmin, getGroupById, updateGroup, deleteGroup, addMember, removeMember } from "../../controllers/admin/group.controller.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.post("/add", upload.fields([{ name: "media", maxCount: 4 }]), createGroup);
router.get("/get", getGroups);
router.get("/getallbyadmin/:id", getAllGroupsByAdmin);
router.get("/getbyid/:id", getGroupById);
router.put("/update", upload.fields([{ name: "media", maxCount: 4 }]), updateGroup);
router.delete("/delete/:id", deleteGroup);
router.post("/addmember", addMember);
router.put("/removemember", removeMember);


export default router;