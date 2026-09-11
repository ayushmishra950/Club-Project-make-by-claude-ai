import type { CookieOptions } from "express";
import env from "../config/env.js";

/**
 * Cookie settings for the refresh token.
 *
 * These were hardcoded to `secure: false` in two controllers, which sent the
 * refresh token over plain HTTP in production. Deriving them from the
 * environment in one place means there is nowhere left to get it wrong.
 *
 * `sameSite: "none"` is required in production because the SPA is served from
 * a different origin than the API, and "none" is only honoured together with
 * `secure`, which is why the two move together.
 */
export const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export default refreshCookieOptions;
