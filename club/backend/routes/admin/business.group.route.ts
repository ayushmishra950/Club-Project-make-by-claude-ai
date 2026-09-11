import express from "express";
import {createBusinessGroup,getBusinessGroups, getBusinessGroupById, updateBusinessGroup, deleteBusinessGroup, addBusinessMember,removeBusinessMember  } from "../../controllers/admin/business.group.controller.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.post("/add", upload.fields([{name:"media", maxCount: 4}]), createBusinessGroup);
router.get("/get", getBusinessGroups);
router.get("/getbyid/:id", getBusinessGroupById);
router.put("/update", upload.fields([{name:"media", maxCount: 4}]), updateBusinessGroup);
router.delete("/delete/:id", deleteBusinessGroup);
router.post("/addmember/:id", addBusinessMember);
router.delete("/removemember/:id/:memberId", removeBusinessMember);


export default router;