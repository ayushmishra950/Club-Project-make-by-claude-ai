

import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

/* ---------------- CHILD INTERFACE ---------------- */
interface IChild {
  name: string;
  age: number;
}

/* ---------------- BUSINESS INTERFACE ---------------- */
interface IBusiness {
  _id?: mongoose.Types.ObjectId;
  businessId?: string;
  businessName?: string;
  businessCategory?: string;
  businessDescription?: string;
  website?: string;
  businessPhone?: string;
  businessAddress?: string;
  workingHours?: string;
  businessCoverImage?: string;
  bannerPosition?: "center" | "left" | "right";
  isVerified: "pending" | "verified" | "rejected";
}

/* ---------------- USER INTERFACE ---------------- */
export interface IUser extends Document {
  userId: string;
  appleId:string;
  fullName: string;
  email?: string;
  mobile?: string;
  dob?: Date;
  occupation?: string;

  spouseName?: string;
  spouseEmail?: string;
  spouseMobile?: string;
  spouseDob?: Date;
  spouseOccupation?: string;

  anniversaryDate?: Date;
  gender?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;

  children: IChild[];

  role: "user" | "secretary" | "treasurer";
  blocked: boolean;
  profileImage: string;
  coverImage: string;
  friends: mongoose.Types.ObjectId[];

  password: string;

  isVerified: boolean;

  isOnline: boolean;
  lastSeen: string | null;

  accountType: "user" | "business";

  businesses: IBusiness[];

  paymentImage?: string;
  amount?: string;
  transitionNumber?: string;
  premiumUser?: null | "premium";
  refreshTokens?: string[];
  isDeleted: boolean;
  deleteStatus: "pending" | "approved" | "active";
  deleteDate?: Date | null;
  deleteReason: string | null;
  comparePassword(password: string): Promise<boolean>;
  pushToken:string;
  googleId?: string;
}

/* ---------------- CHILD SCHEMA ---------------- */
const ChildSchema = new Schema<IChild>(
  { name: { type: String, trim: true }, age: { type: Number } },
  { _id: false }
);

/* ---------------- BUSINESS SCHEMA ---------------- */
const BusinessSchema = new Schema<IBusiness>(
  {
    businessId: { type: String, unique: true, sparse: true },
    businessName: { type: String, trim: true },
    businessCategory: { type: String, trim: true },
    businessDescription: { type: String, trim: true },
    website: { type: String, trim: true },
    businessPhone: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    workingHours: { type: String, trim: true },
    businessCoverImage: { type: String, default: "" },
    bannerPosition: { type: String, enum: ["center", "left", "right"], default: "center" },
    isVerified: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    }
  },
  { _id: true }
);

/* ---------------- USER SCHEMA (FLAT) ---------------- */
const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, unique: true, trim: true, required: true },
    appleId: { type: String, unique: true, sparse: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    mobile: { type: String, trim: true },
    dob: Date,
    occupation: String,
    gender: String,
    maritalStatus: String,
    city: String,

    spouseName: { type: String, trim: true },
    spouseEmail: { type: String, trim: true },
    spouseMobile: { type: String, trim: true },
    spouseDob: Date,
    spouseOccupation: String,

    anniversaryDate: Date,

    address: String,
    state: String,
    country: String,

    children: {
      type: [ChildSchema],
      default: []
    },

    role: {
      type: String,
      enum: ["user", "secretary", "treasurer"],
      default: "user"
    },
    blocked: { type: Boolean, default: false },
    profileImage: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    password: {
      type: String,
      select: false,
      minlength: 8,
      // Social-login accounts (Google, Apple) have no password at all, which is
      // safer than generating a guessable placeholder for them.
      required: [
        function (this: IUser) {
          return !this.googleId && !this.appleId;
        },
        "Password is required."
      ]
    },
    isVerified: { type: Boolean, default: false },
    accountType: { type: String, enum: ["user", "business"], default: "user"},
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: String, default: null },
    businesses: { type: [BusinessSchema], default: []},
    paymentImage: String,
    amount: String,
    transitionNumber: String,
    // SHA-256 hashes of active refresh tokens, one per signed-in device.
    refreshTokens: {
      type: [String],
      default: [],
      select: false
    },
    premiumUser: {
      type: String,
      enum: [null, "premium"],
      default: null
    },
    isDeleted:{
      type:Boolean,
      default : false
    },
    deleteStatus:{
      type: String,
      enum: [ "active", "pending", "approved", "rejected", "cancelled"],
      default:"active"
    },
    deleteDate:{
      type:Date,
      default:null
    },
    deleteReason:{
      type:String,
      default:null 
    },
    pushToken:String,
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

/* ---------------- INDEX ---------------- */
/* Uniqueness.
 *
 * These four declared both `sparse: true` and `partialFilterExpression`, a
 * combination MongoDB refuses, so none of them was ever built and none of the
 * uniqueness the code assumes was actually enforced. `partialFilterExpression`
 * alone does the job and is more precise, so `sparse` is dropped.
 *
 * `$type: "string"` rather than `$exists: true` throughout: a field explicitly
 * set to null exists, so the `$exists` form would have made every member
 * without a mobile number collide with every other one. */
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
UserSchema.index({ mobile: 1 }, { unique: true, partialFilterExpression: { mobile: { $type: "string" } } });
UserSchema.index({ spouseEmail: 1 }, { unique: true, partialFilterExpression: { spouseEmail: { $type: "string" } } });
UserSchema.index({ spouseMobile: 1 }, { unique: true, partialFilterExpression: { spouseMobile: { $type: "string" } } });

/* Access-pattern indexes. Each one matches a query the app runs on every page load. */

// Member directory: verified, unblocked, not deleted, newest first.
UserSchema.index({ isVerified: 1, blocked: 1, isDeleted: 1, createdAt: -1 });

// Refresh-token lookup on every token refresh.
UserSchema.index({ refreshTokens: 1 });

// Admin moderation queue.
UserSchema.index({ deleteStatus: 1, createdAt: -1 });

// Business directory listing.
UserSchema.index({ accountType: 1, "businesses.isVerified": 1 });

// Free-text member search, used by the admin table instead of an unescaped regex.
UserSchema.index(
  { fullName: "text", email: "text", mobile: "text", city: "text", occupation: "text" },
  { name: "user_search", weights: { fullName: 10, email: 5, mobile: 5, city: 2, occupation: 1 } }
);


/* ---------------- PASSWORD HASH ---------------- */
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/* Email is the account identity, so it is required for everyone except an
   Apple sign-in that withheld the address. Mobile stays optional. */
UserSchema.pre("validate", function () {
  if (!this.email && !this.appleId) {
    throw Error("An email address is required.");
  }
});

/* ---------------- PASSWORD CHECK ---------------- */
UserSchema.methods.comparePassword = async function (password: string) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

/* ---------------- MODEL ---------------- */
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;