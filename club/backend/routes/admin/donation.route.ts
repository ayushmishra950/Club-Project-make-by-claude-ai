import express from "express";
import { addDonation, getDonation, topDonors } from "../../controllers/admin/donate.controller.js";

const router = express.Router();

router.post("/add", addDonation);
router.get("/get", getDonation);
router.get("/top-donors", topDonors);


export default router;