import type { Request } from "express";
import type { AccountType } from "../utils/generateToken.js";
import type { IAdmin } from "../models/admin.model.js";
import type { IUser } from "../models/user.model.js";

export interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

/** The caller, as resolved by `requireAuth` from a verified access token. */
export interface AuthActor {
  id: string;
  type: AccountType;
  /** "user" | "secretary" | "treasurer" for members, "admin" | "super_admin" for staff. */
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    /**
     * Passport's own types declare this, but they live in `@types/passport`,
     * which is a build-time dependency a production install can prune. The
     * build then failed on a host that runs `npm install --omit=dev`, so the
     * declaration is repeated here.
     *
     * Interface merging means this costs nothing when the passport types are
     * present: the two declarations combine rather than conflict.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User {}

    interface Request {
      /** Set by Passport after a successful OAuth callback. */
      user?: User | undefined;

      /** Set by `requireAuth`. Never trust an id from the body or query instead of this. */
      actor?: AuthActor;
      /** The member document, loaded when the caller is a member. */
      currentUser?: IUser;
      /** The admin document, loaded when the caller is staff. */
      currentAdmin?: IAdmin;
    }
  }
}

export {};
