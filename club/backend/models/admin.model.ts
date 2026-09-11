import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

/** The single source of truth for admin roles. The schema enum and the
 *  TypeScript type are both derived from this, so they cannot disagree. */
export const ADMIN_ROLES = ["super_admin", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  isActive: boolean;
  profileImage: string;
  comparePassword(password: string): Promise<boolean>;
  isOnline:boolean;
  lastSeen: string;
  mobile:string;
  clubName:string;
  foundedYear:string;
  refreshTokens: string[];
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    mobile:{
      type:String,
      default:"9876543212"
    },

    clubName:{
      type:String,
      default:"xyz club"
    },

    foundedYear:{
      type:String,
      default:"2026"
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      // Never returned by a query unless explicitly re-selected with "+password".
      select: false
    },

    role: {
      type: String,
      enum: ADMIN_ROLES,
      default: "admin"
    },

    isActive: {
      type: Boolean,
      default: true
    },
    profileImage:{
      type:String,
      default:"https://imgs.search.brave.com/jZRu1Bg_0aa2nFmLdLrYbySoJg6ePZzvVdlNw5_1GQE/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdC5k/ZXBvc2l0cGhvdG9z/LmNvbS82MjYyODc4/MC81NTIxOC9pLzQ1/MC9kZXBvc2l0cGhv/dG9zXzU1MjE4OTA0/Mi1zdG9jay1waG90/by13b3VsZC15b3Ut/bGlrZS10by1qb2lu/LmpwZw"
    },
    isOnline:{
      type:Boolean,
      default:false,
    },
    lastSeen:{
      type:String,
      default:null,
    },
    // SHA-256 hashes of active refresh tokens, one per signed-in device.
    refreshTokens: { type: [String], default: [], select: false }
  },
  {
    timestamps: true
  }
);


// 🔐 Password Hash Middleware
AdminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});


// 🔑 Password Compare Method
AdminSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

AdminSchema.index({ refreshTokens: 1 });

const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);

export default Admin;