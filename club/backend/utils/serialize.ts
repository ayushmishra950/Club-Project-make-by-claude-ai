import type { IAdmin } from "../models/admin.model.js";
import type { IUser } from "../models/user.model.js";
import { isUserOnline } from "./socketHelper.js";

/**
 * Response shaping.
 *
 * Handlers return one of these instead of the Mongoose document. Returning the
 * document is how password hashes, refresh tokens and every member's home
 * address ended up in API responses, so the rule is: nothing reaches a client
 * that has not passed through a function in this file.
 */

const toPlain = (doc: unknown): Record<string, any> => {
  if (!doc) return {};
  const candidate = doc as { toObject?: (options?: unknown) => Record<string, any> };
  return typeof candidate.toObject === "function" ? candidate.toObject({ virtuals: false }) : { ...(doc as object) };
};

/** Fields a member may change about themselves. Everything else is admin-controlled. */
export const EDITABLE_PROFILE_FIELDS = [
  "fullName",
  "email",
  "mobile",
  "dob",
  "occupation",
  "gender",
  "maritalStatus",
  "address",
  "city",
  "state",
  "country",
  "spouseName",
  "spouseEmail",
  "spouseMobile",
  "spouseDob",
  "spouseOccupation",
  "anniversaryDate"
] as const;

/**
 * What any signed-in member may see about another member.
 *
 * This is a members' club directory, so contact details are the point: email
 * and mobile are included deliberately. What stays out is everything that is
 * nobody else's business — date of birth, home address, marital status,
 * spouse and children, payment screenshots, and anything to do with
 * credentials or account moderation.
 *
 * Note this is only reachable with a valid session. It is not public.
 */
export const publicUser = (doc: unknown) => {
  const user = toPlain(doc);
  if (!user._id) return null;

  return {
    _id: user._id,
    userId: user.userId,
    fullName: user.fullName,
    // Directory contact details. Email is always present; mobile is optional.
    email: user.email ?? null,
    mobile: user.mobile ?? null,
    profileImage: user.profileImage ?? "",
    coverImage: user.coverImage ?? "",
    occupation: user.occupation ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    accountType: user.accountType ?? "user",
    role: user.role ?? "user",
    premiumUser: user.premiumUser ?? null,
    isVerified: Boolean(user.isVerified),

    /* Presence comes from the live connection list, not the stored flag.
       The flag is only as fresh as the last clean disconnect, so a deploy or
       a dropped connection used to leave somebody showing a green dot
       indefinitely. If they are not connected right now, they are offline. */
    isOnline: isUserOnline(String(user._id)),
    lastSeen: user.lastSeen ?? null,
    // Only businesses the admin has approved are listed publicly.
    businesses: Array.isArray(user.businesses)
      ? user.businesses
          .filter((business: Record<string, any>) => business?.isVerified === "verified")
          .map((business: Record<string, any>) => ({
            _id: business._id,
            businessId: business.businessId,
            businessName: business.businessName,
            businessCategory: business.businessCategory,
            businessDescription: business.businessDescription,
            website: business.website,
            businessPhone: business.businessPhone,
            businessAddress: business.businessAddress,
            workingHours: business.workingHours,
            businessCoverImage: business.businessCoverImage,
            bannerPosition: business.bannerPosition,
            // Only verified listings reach here, but the field is kept because
            // the directory filters on it client-side as well.
            isVerified: business.isVerified
          }))
      : [],
    createdAt: user.createdAt
  };
};

export const publicUsers = (docs: unknown[]) => docs.map(publicUser).filter(Boolean);

const STRIPPED = ["password", "refreshTokens", "refreshToken", "__v"];

/** A member's own record: everything about them except their credentials. */
export const selfUser = (doc: unknown) => {
  const user = toPlain(doc);
  if (!user._id) return null;
  for (const field of STRIPPED) delete user[field];
  // Same reasoning as publicUser: the stored flag can be stale.
  user.isOnline = isUserOnline(String(user._id));
  return user;
};

/**
 * The admin view of a member. Same as their own view today, kept separate so
 * the two can diverge (for example, adding moderation notes) without one
 * leaking into the other.
 */
export const adminViewUser = (doc: unknown) => selfUser(doc);
export const adminViewUsers = (docs: unknown[]) => docs.map(adminViewUser).filter(Boolean);

/** An admin account, with credentials removed. */
export const safeAdmin = (doc: unknown) => {
  const admin = toPlain(doc);
  if (!admin._id) return null;
  for (const field of STRIPPED) delete admin[field];
  return admin;
};

export const safeAdmins = (docs: unknown[]) => docs.map(safeAdmin).filter(Boolean);

/**
 * The projection to use in a `.select()` when only the public shape is needed.
 * Fetching less from MongoDB beats fetching everything and filtering after.
 */
export const PUBLIC_USER_FIELDS =
  "userId fullName email mobile profileImage coverImage occupation city state accountType role premiumUser isVerified isOnline lastSeen businesses createdAt";

/** The minimum needed to render an author byline or an avatar. */
export const AUTHOR_FIELDS = "fullName email profileImage occupation isOnline role isDeleted";

export type PublicUser = ReturnType<typeof publicUser>;
export type SelfUser = IUser | null;
export type SafeAdmin = IAdmin | null;
