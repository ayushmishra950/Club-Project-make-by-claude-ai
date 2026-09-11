import env from "./env.js";
import logger from "../utils/logger.js";

/**
 * One origin policy, used by both the HTTP API and the socket server.
 *
 * These used to be decided separately: the API allowed any local origin in
 * development, the socket server compared against the pinned list alone. So a
 * front end started on a port that was not in .env could call the API and
 * appear to work, while every handshake was blocked by CORS and nothing
 * realtime arrived. The symptom is easy to misread as a broken token.
 */

/**
 * In development, any local origin is fine.
 *
 * Expo picks whichever port is free, Vite moves on when a port is taken, and
 * Metro, the web build and a phone on the LAN all arrive with different
 * origins. Pinning them in .env means the front end silently stops working the
 * moment the port changes. Production keeps the explicit list.
 */
const isLocalDevOrigin = (origin: string) =>
  !env.isProduction &&
  (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin) ||
    // A phone on the same network, and Expo Go's own scheme.
    /^https?:\/\/(10|192\.168|172\.(1[6-9]|2\d|3[01]))\.[\d.]+(:\d+)?$/.test(origin) ||
    origin.startsWith("exp://"));

/**
 * May this origin call us?
 *
 * An absent origin is allowed: curl, server-to-server calls and native apps
 * send no Origin header, and a browser always sends one.
 */
export const isOriginAllowed = (origin?: string | null) => {
  if (!origin) return true;
  if (env.allowedOrigins.includes(origin)) return true;
  return isLocalDevOrigin(origin);
};

/**
 * The shape both `cors` and socket.io want.
 *
 * Rejection withholds the CORS headers rather than throwing. Throwing turns a
 * disallowed origin into a 500 from the error handler, and because the HTTP
 * middleware also sat in front of the static files it made the browser's own
 * same-origin asset requests fail. The browser enforces the block either way;
 * the server just declines to grant permission.
 */
export const originCallback = (
  origin: string | undefined,
  callback: (error: Error | null, allowed?: boolean) => void
) => {
  if (isOriginAllowed(origin)) return callback(null, true);

  logger.warn({ origin }, "Declined CORS for an unlisted origin");
  return callback(null, false);
};

export default originCallback;
