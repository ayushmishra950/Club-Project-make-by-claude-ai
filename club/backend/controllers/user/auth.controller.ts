import type { Request, Response } from "express";
import User from "../../models/user.model.js";
import Admin from "../../models/admin.model.js";
import Post from "../../models/post.model.js";
import Block from "../../models/block.model.js";
import FriendRequest from "../../models/friendRequest.model.js";
import {
  MAX_ACTIVE_SESSIONS,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken
} from "../../utils/generateToken.js";
import {
  AUTHOR_FIELDS,
  PUBLIC_USER_FIELDS,
  EDITABLE_PROFILE_FIELDS,
  adminViewUser,
  publicUser,
  publicUsers,
  selfUser
} from "../../utils/serialize.js";
import { refreshCookieOptions } from "../../utils/cookies.js";
import { badRequest, conflict, forbidden, notFound, unauthorized } from "../../utils/appError.js";
import uploadToCloudinary from "../../cloudinary/uploadToCloudinary.js";
import { getIO } from "../../utils/socketHelper.js";
import { createNotificationInternal } from "./notification.controller.js";
import { NotificationType } from "../../models/notification.model.js";
import { nanoid } from "nanoid";
import logger from "../../utils/logger.js";

/**
 * Member accounts.
 *
 * The rules this file now follows, each of which replaces a specific hole:
 *
 *   - The acting member is `req.actor.id`, resolved from a verified token.
 *     A `userId` in the body or the URL is only ever the *target* of an
 *     action, and is checked against the actor before anything happens.
 *   - Responses are built by `serialize.ts`. The Mongoose document is never
 *     returned directly, because that is how password hashes, refresh tokens
 *     and every member's home address were reaching clients.
 *   - Profile writes use an allow-list. `role`, `isVerified`, `blocked` and
 *     `premiumUser` are not member-editable at any price.
 */

const isSelf = (req: Request, targetId: string) => req.actor?.id === targetId;
const isStaff = (req: Request) => req.actor?.type === "admin";

const assertCanActOn = (req: Request, targetId: string) => {
  if (!isSelf(req, targetId) && !isStaff(req)) {
    throw forbidden("You can only do that on your own account.");
  }
};

/* ================================================================
   REGISTRATION AND SIGN-IN
================================================================ */

export const registerUser = async (req: Request, res: Response) => {
  const { fullName, email, mobile, dob, gender, maritalStatus, occupation, address, city, state, password } =
    req.body as Record<string, string>;

  const existing = await User.findOne({
    $or: [...(email ? [{ email: email.toLowerCase() }] : []), ...(mobile ? [{ mobile }] : [])]
  });

  if (existing) throw conflict("An account already exists with that email or mobile number.");

  const user = await User.create({
    userId: `USR-${nanoid(8)}`,
    fullName,
    email,
    mobile,
    dob,
    gender,
    maritalStatus,
    occupation,
    address,
    city,
    state,
    password
  });

  // The broadcast carries the public shape only. It previously carried the
  // whole document to every connected client.
  getIO().emit("newUser", publicUser(user));

  await createNotificationInternal(
    user._id,
    user._id,
    NotificationType.NEW_USER,
    undefined,
    "New member registered. Please check member list."
  );

  logger.info({ userId: user._id.toString() }, "Member registered");

  res.status(201).json({
    success: true,
    message: "Registration received. An administrator will verify your account shortly.",
    data: selfUser(user)
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { identifier, password, platform } = req.body as {
    identifier: string;
    password: string;
    platform?: string;
  };

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }]
  }).select("+password +refreshTokens");

  // One message for "no such account" and "wrong password", so the endpoint
  // cannot be used to work out who is a member.
  if (!user || !(await user.comparePassword(password))) {
    logger.warn({ identifier }, "Failed member sign-in attempt");
    throw unauthorized("Those sign-in details are not correct.");
  }

  if (user.isDeleted || ["pending", "approved", "rejected"].includes(user.deleteStatus)) {
    throw forbidden(
      "This account is scheduled for deletion. Contact the club administration if you would like it restored."
    );
  }

  if (user.blocked) {
    throw forbidden("Your account has been blocked. Please contact the club administration.");
  }

  if (!user.isVerified) {
    throw forbidden("Your account is waiting for administrator approval.");
  }

  const accessToken = generateAccessToken(user._id.toString(), "user");
  const refreshToken = generateRefreshToken(user._id.toString(), "user");

  user.refreshTokens = [...(user.refreshTokens ?? []), hashToken(refreshToken)].slice(-MAX_ACTIVE_SESSIONS);
  await user.save();

  logger.info({ userId: user._id.toString(), platform: platform ?? "web" }, "Member signed in");

  // Mobile has no cookie jar, so it receives the refresh token in the body.
  // The browser gets it as an httpOnly cookie, where script cannot read it.
  if (platform === "mobile") {
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: selfUser(user),
      accessToken,
      refreshToken
    });
    return;
  }

  res.cookie("refreshToken", refreshToken, refreshCookieOptions());

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: selfUser(user),
    accessToken
  });
};

export const logoutUser = async (req: Request, res: Response) => {
  const token =
    (req.cookies as Record<string, string> | undefined)?.refreshToken ||
    (req.body as { refreshToken?: string })?.refreshToken;

  if (token && req.actor) {
    await User.findByIdAndUpdate(req.actor.id, { $pull: { refreshTokens: hashToken(token) } });
  }

  res.clearCookie("refreshToken", { ...refreshCookieOptions(), maxAge: undefined });
  res.status(200).json({ success: true, message: "Signed out." });
};

/** The signed-in member's own record. The client calls this on boot instead of trusting local storage. */
export const getCurrentUser = async (req: Request, res: Response) => {
  if (req.actor?.type === "admin") {
    res.status(200).json({ success: true, type: "admin", data: req.currentAdmin });
    return;
  }
  res.status(200).json({ success: true, type: "user", data: selfUser(req.currentUser) });
};

/**
 * Exchanges a refresh token for a new access token, and rotates the refresh
 * token at the same time.
 *
 * Rotation means a token that is replayed after use no longer matches any
 * stored hash, so a stolen refresh token has a single-use window rather than
 * seven days.
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  const token =
    (req.cookies as Record<string, string> | undefined)?.refreshToken ||
    (req.body as { refreshToken?: string })?.refreshToken;

  if (!token) throw unauthorized("No refresh token was sent.");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw unauthorized("Your session has expired. Please sign in again.");
  }

  const tokenHash = hashToken(token);

  if (payload.type === "admin") {
    const admin = await Admin.findOne({ _id: payload.sub, refreshTokens: tokenHash }).select("+refreshTokens");
    if (!admin) throw unauthorized("Your session is no longer valid. Please sign in again.");
    if (!admin.isActive) throw forbidden("This admin account has been deactivated.");

    const accessToken = generateAccessToken(admin._id.toString(), "admin");
    const nextRefresh = generateRefreshToken(admin._id.toString(), "admin");

    admin.refreshTokens = [...admin.refreshTokens.filter((entry) => entry !== tokenHash), hashToken(nextRefresh)].slice(
      -MAX_ACTIVE_SESSIONS
    );
    await admin.save();

    res.cookie("refreshToken", nextRefresh, refreshCookieOptions());
    res.status(200).json({ success: true, accessToken, refreshToken: nextRefresh });
    return;
  }

  const user = await User.findOne({ _id: payload.sub, refreshTokens: tokenHash }).select("+refreshTokens");
  if (!user) throw unauthorized("Your session is no longer valid. Please sign in again.");

  if (user.isDeleted) throw forbidden("This account is scheduled for deletion.");
  if (user.blocked) throw forbidden("Your account has been blocked.");

  const accessToken = generateAccessToken(user._id.toString(), "user");
  const nextRefresh = generateRefreshToken(user._id.toString(), "user");

  user.refreshTokens = [...(user.refreshTokens ?? []).filter((entry) => entry !== tokenHash), hashToken(nextRefresh)].slice(
    -MAX_ACTIVE_SESSIONS
  );
  await user.save();

  res.cookie("refreshToken", nextRefresh, refreshCookieOptions());
  res.status(200).json({ success: true, accessToken, refreshToken: nextRefresh });
};

/* ================================================================
   READING MEMBERS
================================================================ */

/**
 * The member directory.
 *
 * Paginated, projected, and filtered to exclude anybody either side of a
 * block. Returns the public shape: no contact details, no family details.
 */
export const getAllUsers = async (req: Request, res: Response) => {
  const viewerId = req.actor!.id;
  const { limit = 20, cursor, search } = req.query as unknown as {
    limit: number;
    cursor?: string;
    search?: string;
  };

  const blocks = await Block.find({ $or: [{ blockerId: viewerId }, { blockedId: viewerId }] })
    .select("blockerId blockedId")
    .lean();

  const hidden = blocks.map((record) =>
    record.blockerId.toString() === viewerId ? record.blockedId.toString() : record.blockerId.toString()
  );
  hidden.push(viewerId);

  const filter: Record<string, unknown> = {
    _id: { $nin: hidden },
    isVerified: true,
    blocked: false,
    isDeleted: false
  };

  if (cursor) filter.createdAt = { $lt: new Date(cursor) };
  if (search) filter.$text = { $search: search };

  const users = await User.find(filter)
    .select(PUBLIC_USER_FIELDS)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = users.length > limit;
  const page = hasMore ? users.slice(0, limit) : users;
  const last = page[page.length - 1] as { createdAt?: Date } | undefined;

  res.status(200).json({
    success: true,
    count: page.length,
    data: publicUsers(page),
    nextCursor: hasMore && last?.createdAt ? new Date(last.createdAt).toISOString() : null,
    hasMore
  });
};

/** One member's profile, plus their accepted friend list. */
export const getSingleUser = async (req: Request, res: Response) => {
  const id = String(req.params.id ?? "");

  const user = await User.findById(id);
  if (!user || user.isDeleted) throw notFound("That member could not be found.");
  if (user.blocked && !isStaff(req)) throw notFound("That member could not be found.");

  // A member sees their own full record; everyone else sees the public shape.
  const profile = isSelf(req, id) ? selfUser(user) : isStaff(req) ? adminViewUser(user) : publicUser(user);

  const friends = await FriendRequest.find({ $or: [{ from: id }, { to: id }] })
    .populate({ path: "from", match: { isDeleted: false }, select: AUTHOR_FIELDS })
    .populate({ path: "to", match: { isDeleted: false }, select: AUTHOR_FIELDS })
    .lean();

  const friendList = friends
    .map((entry) => {
      if (!entry.from || !entry.to) return null;
      const other = (entry.from as unknown as { _id: unknown })._id?.toString() === id ? entry.to : entry.from;
      if (!other) return null;
      return { ...(other as object), status: entry.status, requestId: entry._id };
    })
    .filter(Boolean);

  res.status(200).json({ success: true, data: profile, friends: friendList });
};

/** A member's profile page: their details, a page of their posts, and their connections. */
export const getSingleUserDetail = async (req: Request, res: Response) => {
  const userId = String(req.params.id ?? "");
  const limit = Math.min(Number((req.query as { limit?: string }).limit) || 20, 50);

  const user = await User.findById(userId);
  if (!user || user.isDeleted) throw notFound("That member could not be found.");

  const [posts, followers, following] = await Promise.all([
    Post.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("createdBy", AUTHOR_FIELDS)
      .lean(),
    FriendRequest.find({ to: userId, status: "accepted" }).populate("from", AUTHOR_FIELDS).lean(),
    FriendRequest.find({ from: userId, status: "accepted" }).populate("to", AUTHOR_FIELDS).lean()
  ]);

  // The friend set is the union of both directions, computed from the two
  // queries already made rather than with two more round trips.
  /* Both lists are populated, so `entry.to` and `entry.from` are documents,
     not ids. Calling `.toString()` on them yields the literal string
     "[object Object]", which then fails the ObjectId cast and 500s the whole
     profile — but only for a member who actually has friends, which is why an
     empty test account never showed it. Read `_id` when it is there. */
  const idOf = (value: unknown): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    const doc = value as { _id?: unknown };
    if (doc._id) return String(doc._id);
    return String(value);
  };

  const friendIds = new Set<string>([
    ...following.map((entry) => idOf(entry.to)),
    ...followers.map((entry) => idOf(entry.from))
  ]);
  friendIds.delete("");
  friendIds.delete("[object Object]");

  const friends = await User.find({ _id: { $in: Array.from(friendIds) }, isDeleted: false })
    .select(PUBLIC_USER_FIELDS)
    .lean();

  res.status(200).json({
    success: true,
    user: isSelf(req, userId) ? selfUser(user) : isStaff(req) ? adminViewUser(user) : publicUser(user),
    posts,
    followers: followers.map((entry) => entry.from),
    following: following.map((entry) => entry.to),
    friends: publicUsers(friends),
    friendCount: friendIds.size
  });
};

/* ================================================================
   WRITING
================================================================ */

/**
 * Profile update.
 *
 * `EDITABLE_PROFILE_FIELDS` is an allow-list. The previous deny-list left
 * `role`, `isVerified`, `blocked`, `premiumUser`, `accountType` and
 * `isDeleted` writable, which let any member promote themselves and switch on
 * premium for free.
 */
export const updateUser = async (req: Request, res: Response) => {
  const body = req.body as Record<string, any>;
  const targetId = String(body.userId || body._id || req.actor!.id);

  assertCanActOn(req, targetId);

  const user = await User.findById(targetId).select("+password");
  if (!user) throw notFound("That member could not be found.");
  if (user.isDeleted) throw forbidden("This account is scheduled for deletion.");

  const files = ((req as { files?: Express.Multer.File[] }).files ?? []) as Express.Multer.File[];
  const fileFor = (field: string) => files.find((file) => file.fieldname === field);

  const parseJson = <T>(value: unknown, fallback: T): T => {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== "string") return value as T;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  };

  /* ---- images ---- */

  const profileImage = fileFor("profileImage");
  if (profileImage) {
    user.profileImage = await uploadToCloudinary(profileImage.buffer, profileImage.mimetype, "profile");
  }

  const coverImage = fileFor("coverImage");
  if (coverImage) {
    user.coverImage = await uploadToCloudinary(coverImage.buffer, coverImage.mimetype, "cover");
  }

  /* ---- scalar fields, allow-listed ---- */

  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (body[field] !== undefined && body[field] !== "") {
      (user as Record<string, any>)[field] = body[field];
    }
  }

  /* ---- admin-only fields ---- */

  if (isStaff(req)) {
    if (typeof body.isVerified === "boolean") user.isVerified = body.isVerified;
    if (typeof body.blocked === "boolean") user.blocked = body.blocked;
    if (typeof body.role === "string" && ["user", "secretary", "treasurer"].includes(body.role)) {
      user.role = body.role as typeof user.role;
    }
    if (body.premiumUser === null || body.premiumUser === "premium") user.premiumUser = body.premiumUser;
    if (["user", "business"].includes(body.accountType)) user.accountType = body.accountType;
  }

  /* ---- password change: current password required ---- */

  if (typeof body.password === "string" && body.password.trim()) {
    if (!isSelf(req, targetId)) throw forbidden("A member must change their own password.");

    const hasPassword = Boolean(user.password);
    if (hasPassword && !(await user.comparePassword(String(body.currentPassword ?? "")))) {
      throw badRequest("Your current password is not correct.");
    }

    user.password = body.password;
    // Changing a password ends every other session on the account.
    user.refreshTokens = [];
  }

  /* ---- children ---- */

  if (body.children !== undefined) {
    const children = parseJson<unknown[]>(body.children, []);
    user.children = (Array.isArray(children) ? children : []) as typeof user.children;
  }

  /* ---- businesses ---- */

  if (body.businesses !== undefined) {
    const incoming = parseJson<Record<string, any>[]>(body.businesses, []).filter(
      (business) =>
        business &&
        (business.businessName?.trim() ||
          business.businessCategory?.trim() ||
          business.businessPhone?.trim() ||
          business.businessDescription?.trim() ||
          business.businessAddress?.trim())
    );

    const mapped = incoming.map((business) => {
      const existing = user.businesses.find((entry) => entry.businessId === business.businessId);
      return {
        ...business,
        businessId: business.businessId || `BIZ-${nanoid(8)}`,
        // Verification is the admin's decision, never the submitter's. An edit
        // to an approved listing does not silently keep its approved badge
        // unless nothing material changed.
        isVerified: existing ? existing.isVerified : "pending",
        businessCoverImage:
          typeof business.businessCoverImage === "string"
            ? business.businessCoverImage
            : existing?.businessCoverImage || ""
      };
    });

    for (let index = 0; index < mapped.length; index += 1) {
      const file = fileFor(`businessCoverImage_${index}`);
      if (file) {
        mapped[index]!.businessCoverImage = await uploadToCloudinary(file.buffer, file.mimetype, "business-cover");
      }
    }

    user.businesses = mapped as typeof user.businesses;
  }

  await user.save();

  getIO().emit("updateProfileFromUser", { userId: user._id.toString() });

  res.status(200).json({
    success: true,
    message: "Profile updated.",
    user: selfUser(user),
    data: selfUser(user)
  });
};

/** Submits a payment screenshot for admin approval. Does not grant premium. */
export const convertPremiumUser = async (req: Request, res: Response) => {
  const { userId, amount, transitionNumber } = req.body as Record<string, string>;
  const targetId = String(userId || req.actor!.id);

  assertCanActOn(req, targetId);

  const files = (req as { files?: Record<string, Express.Multer.File[]> }).files;
  const file = files?.paymentImage?.[0];

  if (!amount || !transitionNumber?.trim() || !file?.buffer?.length) {
    throw badRequest("Amount, transaction number and a payment screenshot are all required.");
  }

  const user = await User.findById(targetId);
  if (!user) throw notFound("That member could not be found.");
  if (user.isDeleted) throw forbidden("This account is scheduled for deletion.");

  user.paymentImage = await uploadToCloudinary(file.buffer, file.mimetype, "payment");
  user.transitionNumber = transitionNumber;
  user.amount = amount;
  // premiumUser stays untouched. An administrator grants it after checking the payment.
  await user.save();

  // Notify staff, not everybody, and carry an id rather than the document.
  getIO().emit("premiumStatusUpdated", { userId: user._id.toString() });

  res.status(200).json({
    success: true,
    message: "Payment submitted. An administrator will confirm your premium membership shortly.",
    data: selfUser(user)
  });
};

export const addPushNotifications = async (req: Request, res: Response) => {
  const { userId, pushToken } = req.body as { userId?: string; pushToken: string };
  const targetId = String(userId || req.actor!.id);

  assertCanActOn(req, targetId);

  const user = await User.findByIdAndUpdate(targetId, { pushToken }, { new: true });
  if (!user) throw notFound("That member could not be found.");

  res.status(200).json({ success: true, message: "Push token saved." });
};

/* ================================================================
   DELETION
================================================================ */

/** Hard delete. Administrators only. */
export const deleteUser = async (req: Request, res: Response) => {
  const targetId = String(req.params.id ?? (req.body as { userId?: string })?.userId ?? "");
  if (!targetId) throw badRequest("Which account should be removed?");

  if (!isStaff(req)) throw forbidden("Only an administrator can remove an account.");

  const user = await User.findByIdAndDelete(targetId);
  if (!user) throw notFound("That member could not be found.");

  logger.info({ actor: req.actor?.id, target: targetId }, "Member account hard-deleted by admin");

  res.status(200).json({ success: true, message: "Member removed." });
};

/** A member asks for their own account to be deleted. Admin approves it later. */
export const requestDeleteAccount = async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? "");
  assertCanActOn(req, userId);

  const user = await User.findById(userId);
  if (!user) throw notFound("That member could not be found.");

  if (user.deleteStatus === "pending") throw badRequest("A deletion request is already pending on this account.");
  if (user.isDeleted) throw badRequest("This account is already scheduled for deletion.");

  const reason = (req.body as { reason?: string })?.reason?.trim();

  user.deleteStatus = "pending";
  user.deleteDate = new Date();
  user.deleteReason = reason || "Requested by the member.";
  user.isOnline = false;
  // Signing the member out everywhere while the request is open.
  user.refreshTokens = [];
  await user.save();

  getIO().emit("deleteRequest", { userId: user._id.toString() });

  res.status(200).json({
    success: true,
    message: "Your deletion request has been sent to the administrators.",
    deleteStatus: user.deleteStatus
  });
};

export const cancelDeleteRequest = async (req: Request, res: Response) => {
  const userId = String(req.params.userId ?? "");
  assertCanActOn(req, userId);

  const user = await User.findById(userId);
  if (!user) throw notFound("That member could not be found.");
  if (user.deleteStatus !== "pending") throw badRequest("There is no pending deletion request on this account.");

  user.deleteStatus = "active";
  user.deleteDate = null;
  user.deleteReason = null;
  await user.save();

  getIO().emit("cancelDeleteRequest", { userId: user._id.toString() });

  res.status(200).json({
    success: true,
    message: "Deletion request cancelled.",
    data: selfUser(user)
  });
};
