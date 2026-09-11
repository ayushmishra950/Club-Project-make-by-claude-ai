import express from "express";
import { getMonthlyDonationSummary, getYearlyAnalytics, dashboardSummary, getDashboardStats } from "../../controllers/admin/dashboard.controller.js";

const router = express.Router();

router.get("/summary", dashboardSummary);
router.get("/graph", getMonthlyDonationSummary);
router.get("/stats", getDashboardStats);
router.get("/analytics", getYearlyAnalytics);

export default router;