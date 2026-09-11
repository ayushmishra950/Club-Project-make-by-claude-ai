import User from "../../models/user.model.js";
import Donation from "../../models/donate.model.js";
import Event from "../../models/event.model.js";
import Post from "../../models/post.model.js";
import Group from "../../models/group.model.js";
import Announcement from "../../models/announcement.model.js";
import { Suggestion } from "../../models/suggestion.model.js";
import type { Request, Response } from "express";


export const dashboardSummary = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Total users & events
    const totalUser = await User.countDocuments();
    const totalEvent = await Event.countDocuments();

    // 2️⃣ Total donations
    const totalDonationResult = await Donation.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    const totalDonation = totalDonationResult[0]?.totalAmount || 0;

    // 3️⃣ Current month range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 4️⃣ Current month new users percentage
    const currentMonthUserCount = await User.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const userPercentage = totalUser
      ? Math.round((currentMonthUserCount / totalUser) * 100)
      : 0;

    // 5️⃣ Current month donation total amount
    const currentMonthDonationResult = await Donation.aggregate([
      { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    const currentMonthDonation = currentMonthDonationResult[0]?.totalAmount || 0;

    // 6️⃣ Current month donation percentage
    const donationPercentage = totalDonation
      ? Math.round((currentMonthDonation / totalDonation) * 100)
      : 0;

    // 7️⃣ Current month events count
    const currentMonthEventCount = await Event.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // 8️⃣ Send response
    return res.status(200).json({
      totalUser,
      userPercentage,
      totalDonation,
      currentMonthDonation,
      donationPercentage,
      totalEvent,
      currentMonthEventCount
    });

  } catch (err: unknown) {
    if (err instanceof Error) return res.status(500).json({ message: err.message });
    return res.status(500).json({ message: "Unknown error" });
  }
};



export const getMonthlyDonationSummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1️⃣ Aggregate donations for current year
    const result = await Donation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(currentYear, 0, 1), // Jan 1 current year
            $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999) // Dec 31 current year
          }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          totalAmount: { $sum: "$amount" },
        }
      }
    ]);

    // 2️⃣ Create a map of month => totalAmount
    const monthMap: { [key: number]: number } = {};
    result.forEach(item => {
      monthMap[item._id.month] = item.totalAmount;
    });

    // 3️⃣ Prepare final array for all 12 months
    const monthlyArray = months.map((name, index) => ({
      month: name,
      totalAmount: monthMap[index + 1] ?? 0,
      year: currentYear
    }));

    res.status(200).json({ monthlyArray });

  } catch (err: unknown) {
    if (err instanceof Error) return res.status(500).json({ message: err.message });
    return res.status(500).json({ message: "Unknown error" });
  }
};



export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // ================= USER STATS =================
    const totalUsers = await User.countDocuments();

    const activeUsers = await User.countDocuments({
      blocked: false,
      isVerified: true,
    });

    // 🏢 BUSINESS USERS (NEW)
    const totalBusinessUsers = await User.countDocuments({
      accountType: "business",
      businessVerified: true,
    });

    const currentMonthBusinessUsers = await User.countDocuments({
      accountType: "business",
      businessVerified: true,
      createdAt: { $gte: startOfMonth },
    });

    // ================= EVENT STATS =================
    const totalEvents = await Event.countDocuments();

    const currentMonthEvents = await Event.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // ================= POST STATS =================
    const totalPosts = await Post.countDocuments();

    const currentMonthPosts = await Post.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // ================= GROUP STATS =================
    const totalGroups = await Group.countDocuments();

    const currentMonthGroups = await Group.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // ================= ANNOUNCEMENT STATS =================
    const totalAnnouncements = await Announcement.countDocuments();

    const currentMonthAnnouncements = await Announcement.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // ================= SUGGESTION STATS =================
    const totalSuggestions = await Suggestion.countDocuments();

    const currentMonthSuggestions = await Suggestion.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // ================= REVENUE STATS (NEW) =================
    const totalRevenueData = await User.aggregate([
      {
        $match: {
          premiumUser: "premium",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $toDouble: "$amount" },
          },
        },
      },
    ]);

    const currentMonthRevenueData = await User.aggregate([
      {
        $match: {
          premiumUser: "premium",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $toDouble: "$amount" },
          },
        },
      },
    ]);

    const totalRevenue = totalRevenueData[0]?.totalRevenue || 0;
    const currentMonthRevenue =
      currentMonthRevenueData[0]?.totalRevenue || 0;

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        business: {
          total: totalBusinessUsers,
          currentMonth: currentMonthBusinessUsers,
        },
        events: {
          total: totalEvents,
          currentMonth: currentMonthEvents,
        },
        posts: {
          total: totalPosts,
          currentMonth: currentMonthPosts,
        },
        groups: {
          total: totalGroups,
          currentMonth: currentMonthGroups,
        },
        announcements: {
          total: totalAnnouncements,
          currentMonth: currentMonthAnnouncements,
        },
        suggestions: {
          total: totalSuggestions,
          currentMonth: currentMonthSuggestions,
        },
        revenue: {
          total: totalRevenue,
          currentMonth: currentMonthRevenue,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const getYearlyAnalytics = async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const result = [];

    for (let i = 0; i < 12; i++) {
      const startDate = new Date(year, i, 1);
      const endDate = new Date(year, i + 1, 0, 23, 59, 59, 999);

      // ================= USERS =================
      const userCount = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // ================= EVENTS =================
      const eventCount = await Event.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // ================= REVENUE (NEW LOGIC) =================
      const revenueData = await User.aggregate([
        {
          $match: {
            premiumUser: "premium",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $toDouble: "$amount" }
            },
          },
        },
      ]);

      const revenue = revenueData[0]?.totalRevenue || 0;

      result.push({
        month: months[i],
        year,
        members: userCount,
        events: eventCount,
        revenue: revenue,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};