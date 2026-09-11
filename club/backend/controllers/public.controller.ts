import type { Request, Response } from "express";
import Event from "../models/event.model.js";
import Gallery from "../models/gallery.model.js";
import Announcement from "../models/announcement.model.js";
import News from "../models/news.js";
import ReviewModel from "../models/review.model.js";
import User from "../models/user.model.js";
import { notFound } from "../utils/appError.js";

/**
 * The public read surface.
 *
 * Everything the marketing site renders before anybody signs in. It is a
 * deliberately separate, deliberately narrow set of handlers rather than the
 * admin ones re-exported, because the two need different shapes: the admin
 * event list carries the attendee roster, and no unauthenticated caller
 * should ever receive that.
 *
 * Rules for anything added here:
 *   - only content an admin has published,
 *   - never a member's contact details,
 *   - always a `.select()`, never a whole document.
 */

const PUBLIC_EVENT_FIELDS = "title description date location category coverImage type isPinned createdAt";

/** Upcoming and recent public events. Private events are never listed. */
export const listEvents = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 24, 50);

  const events = await Event.find({ type: "public" })
    .select(PUBLIC_EVENT_FIELDS)
    .sort({ isPinned: -1, date: -1 })
    .limit(limit)
    .lean();

  // The count is exposed, the attendee identities are not.
  res.status(200).json({ success: true, event: events, events });
};

export const getEvent = async (req: Request, res: Response) => {
  const event = await Event.findOne({ _id: req.params.id, type: "public" })
    .select(PUBLIC_EVENT_FIELDS)
    .populate({ path: "gallery", select: "image type" })
    .lean();

  if (!event) throw notFound("That event is not available.");

  const interestedCount = await Event.findById(req.params.id)
    .select("interestedCandidate")
    .lean()
    .then((doc) => doc?.interestedCandidate?.length ?? 0);

  res.status(200).json({ success: true, event: { ...event, interestedCount } });
};

export const listAnnouncements = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const announcements = await Announcement.find()
    .select("title description priority createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.status(200).json({ success: true, announcements, data: announcements });
};

export const getAnnouncement = async (req: Request, res: Response) => {
  const announcement = await Announcement.findById(req.params.id)
    .select("title description priority createdAt")
    .lean();

  if (!announcement) throw notFound("That announcement is not available.");

  res.status(200).json({ success: true, data: announcement, announcement });
};

export const listGallery = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 30, 60);

  const gallery = await Gallery.find()
    .select("image important type event")
    .populate({ path: "event", select: "title date type" })
    .sort({ important: -1, _id: -1 })
    .limit(limit)
    .lean();

  // Media attached to a private event stays private.
  const publicItems = gallery.filter((item) => {
    const event = item.event as unknown as { type?: string } | null;
    return !event || event.type === "public";
  });

  res.status(200).json({
    success: true,
    gallery: publicItems,
    data: publicItems,
    pagination: { total: publicItems.length, currentPage: 1, perPage: limit }
  });
};

export const listNews = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const news = await News.find().sort({ createdAt: -1 }).limit(limit).lean();

  res.status(200).json({ success: true, news, data: news });
};

export const getNews = async (req: Request, res: Response) => {
  const item = await News.findById(req.params.id).lean();
  if (!item) throw notFound("That article is not available.");

  res.status(200).json({ success: true, news: item, data: item });
};

/** Approved testimonials only, with just the author's display name and avatar. */
export const listReviews = async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 12, 30);

  const reviews = await ReviewModel.find({ status: "approved" })
    .select("message rating createdAt userId")
    .populate({ path: "userId", select: "fullName profileImage" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  // `data` and `reviews` are the same payload: existing components read
  // one or the other, and both are kept so neither has to change.
  res.status(200).json({ success: true, reviews, data: reviews });
};

/**
 * Headline numbers for the home page.
 *
 * Counts only, computed with `countDocuments` so nothing about an individual
 * member is exposed by the aggregate.
 */
export const getStats = async (_req: Request, res: Response) => {
  const [members, events, galleryItems] = await Promise.all([
    User.countDocuments({ isVerified: true, blocked: false, isDeleted: false }),
    Event.countDocuments({ type: "public" }),
    Gallery.countDocuments()
  ]);

  res.status(200).json({ success: true, stats: { members, events, galleryItems } });
};
