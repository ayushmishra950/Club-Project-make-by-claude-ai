import express from "express";
import { addSuggestion, getAllSuggestions, getSuggestionById, deleteSuggestion, replyToSuggestion, markAsReadByUser } from "../../controllers/user/suggestion.controller.js";

const router = express.Router();

router.post("/add", addSuggestion);
router.get("/get/:id", getAllSuggestions);
router.get("/getbyid", getSuggestionById);
router.delete("/delete", deleteSuggestion);
router.post("/reply", replyToSuggestion);
router.post("/mark-read/:id", markAsReadByUser);

export default router;