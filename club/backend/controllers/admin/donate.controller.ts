import User from "../../models/user.model.js";
import Donation from "../../models/donate.model.js";
import type { Request, Response } from "express";


export const addDonation = async (req: Request, res: Response) => {
  try {
    const { userId, amount, title } = req.body;

    if (!userId || !amount || !title) {
      return res.status(400).json({ message: "UserId, title and amount are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const donation = await Donation.create({
      user: userId,
      category: title,
      amount: Number(amount)
    });

    await User.findByIdAndUpdate(userId, {
      $inc: {
        donationsCount: 1,
        totalDonated: Number(amount)
      },
      $push: {
        donations: donation._id
      }
    });

    res.status(201).json({ message: "Donation added successfully." });

  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};


export const getDonation = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 8;
    const search = (req.query.search as string) || "";
    const filterCategory = (req.query.filterCategory as string) || "all";



    const filter: any = {};
    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { state: { $regex: search, $options: "i" } },
          { country: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
        ]

      }).select("_id");
      const userIds = users.map((u) => u._id);
      filter.user = { $in: userIds };
    }

    if (filterCategory !== "all") {
      filter.category = filterCategory;
    }
    const totalDonations = await Donation.countDocuments(filter);

    const donations = await Donation.find(filter)
      .populate("user")
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalAmountAgg = await Donation.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalAmount = totalAmountAgg[0]?.total || 0;

    const totalPages = Math.ceil(totalDonations / perPage);

    res.status(200).json({
      donations,
      totalPages,
      totalAmount,
      message: "Donations fetched successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};



export const topDonors = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const donors = await Donation.aggregate([
      {
        $group: {
          _id: "$user",
          totalAmount: { $sum: "$amount" },
          category: { $first: "$category" },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          fullName: "$user.fullName",
          email: "$user.email",
          totalAmount: 1,
          category: 1,
        },
      },
    ]);

    res.status(200).json({
      donors,
      message: "Top donors fetched successfully",
    });

  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};