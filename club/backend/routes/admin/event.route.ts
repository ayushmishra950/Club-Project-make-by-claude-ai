import express from "express";
import { addEvent, getAllEvent, getSingleEvent, updateEvent, deleteEvent, addAndRemoveCandidateFromEvent, getLatestEvent } from "../../controllers/admin/event.controller.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.post("/add", upload.fields([{ name: "coverImage", maxCount: 4 }]), addEvent);
router.get("/get", getAllEvent);
router.get("/getbyid/:id", getSingleEvent);
router.put("/update", upload.fields([{ name: "coverImage", maxCount: 4 }]), updateEvent);
router.delete("/delete/:id", deleteEvent);
router.get("/latest", getLatestEvent);
router.post("/candidate/interested", addAndRemoveCandidateFromEvent);


export default router;