import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { validate, objectId } from "../middlewares/validate.js";
import { z } from "zod";
import {
  getAnnouncement,
  getEvent,
  getNews,
  getStats,
  listAnnouncements,
  listEvents,
  listGallery,
  listNews,
  listReviews
} from "../controllers/public.controller.js";

/**
 * Unauthenticated, read-only, cacheable.
 *
 * This is the only router mounted without `requireAuth`, so nothing that
 * writes and nothing that touches member data belongs here.
 */

const router = express.Router();

const byId = validate({ params: z.object({ id: objectId }) });

// A minute of shared caching absorbs traffic spikes on the marketing pages.
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  next();
});

router.get("/events", asyncHandler(listEvents));
router.get("/events/:id", byId, asyncHandler(getEvent));

router.get("/announcements", asyncHandler(listAnnouncements));
router.get("/announcements/:id", byId, asyncHandler(getAnnouncement));

router.get("/gallery", asyncHandler(listGallery));

router.get("/news", asyncHandler(listNews));
router.get("/news/:id", byId, asyncHandler(getNews));

router.get("/reviews", asyncHandler(listReviews));

router.get("/stats", asyncHandler(getStats));

export default router;
