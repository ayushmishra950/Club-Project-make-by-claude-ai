import crypto from "crypto";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

export type AccountType = "user" | "admin";

export interface TokenPayload {
  /** Account id. */
  sub: string;
  /** Which collection the id belongs to. */
  type: AccountType;
  /**
   * Legacy alias for `sub`. Tokens issued before the auth rework used `id`,
   * and the verifier still accepts them, so keep emitting it until every
   * client has refreshed.
   */
  id: string;
}

const buildPayload = (accountId: string, type: AccountType): TokenPayload => ({
  sub: accountId,
  type,
  id: accountId
});

export const generateAccessToken = (accountId: string, type: AccountType = "user") =>
  jwt.sign(buildPayload(accountId, type), env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL
  } as jwt.SignOptions);

export const generateRefreshToken = (accountId: string, type: AccountType = "user") =>
  jwt.sign(buildPayload(accountId, type), env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL
  } as jwt.SignOptions);

/**
 * Refresh tokens are stored as hashes, never in plain text.
 *
 * A leaked database dump then contains no usable session credentials, the
 * same reasoning that applies to passwords. Lookup is by hash, so it stays a
 * single indexed query.
 */
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Verifies an access token and normalises the payload across old and new formats. */
export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as Partial<TokenPayload>;
  const accountId = decoded.sub || decoded.id;

  if (!accountId) throw new jwt.JsonWebTokenError("Token is missing a subject");

  return { sub: accountId, id: accountId, type: decoded.type === "admin" ? "admin" : "user" };
};

/** Verifies a refresh token. Same normalisation as above. */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as Partial<TokenPayload>;
  const accountId = decoded.sub || decoded.id;

  if (!accountId) throw new jwt.JsonWebTokenError("Token is missing a subject");

  return { sub: accountId, id: accountId, type: decoded.type === "admin" ? "admin" : "user" };
};

/** Number of refresh tokens (devices) a single account may hold at once. */
export const MAX_ACTIVE_SESSIONS = 5;
