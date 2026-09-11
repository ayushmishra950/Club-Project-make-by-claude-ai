import env from "./config/env.js";

import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import connectDb from "./config/db.js";
import { originCallback } from "./config/cors.js";
import { initSocket } from "./utils/socketHelper.js";
import passport from "./utils/google.fb.login.js";
import logger from "./utils/logger.js";
import { apiNotFound, errorHandler } from "./middlewares/errorHandler.js";
import { requireAdmin, requireAuth } from "./middlewares/auth.js";
import { bindActor } from "./middlewares/bindActor.js";
import { allowLegacyMobileMember, legacyCompatBanner } from "./middlewares/legacyAppCompat.js";
import { stripPrivilegedPostFields } from "./middlewares/ownership.js";
import { apiLimiter, authLimiter, writeLimiter } from "./middlewares/rateLimit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===========================================================
   ROUTES
=========================================================== */

// Public: everything the marketing site reads, no sign-in required.
import publicRoutes from "./routes/public.route.js";

// Admin
import adminAuthRoutes from "./routes/admin/auth.route.js";
import adminUserRoutes from "./routes/admin/user.route.js";
import adminDonationRoutes from "./routes/admin/donation.route.js";
import adminEventRoutes from "./routes/admin/event.route.js";
import adminGalleryRoutes from "./routes/admin/gallery.route.js";
import adminDashboardRoutes from "./routes/admin/dashboard.route.js";
import adminCategoryRoutes from "./routes/admin/category.route.js";
import adminPostRoutes from "./routes/admin/post.route.js";
import adminGroupRoutes from "./routes/admin/group.route.js";
import adminBusinessGroupRoutes from "./routes/admin/business.group.route.js";
import adminAnnouncementRoutes from "./routes/admin/announcement.route.js";
import adminChatRoutes from "./routes/admin/chat.route.js";
import adminSuggestionRoutes from "./routes/admin/suggestion.route.js";
import adminNotificationRoutes from "./routes/admin/notification.route.js";
import adminNewsRoutes from "./routes/admin/news.route.js";
import adminReviewsRoutes from "./routes/admin/review.route.js";
import adminReportRoutes from "./routes/admin/report.routes.js";

// Member
import userAuthRoutes from "./routes/user/auth.route.js";
import userPostRoutes from "./routes/user/post.route.js";
import userGroupRoutes from "./routes/user/group.route.js";
import userFriendRoutes from "./routes/user/friendRequest.route.js";
import userChatRoutes from "./routes/user/chat.route.js";
import userNotificationRoutes from "./routes/user/notification.route.js";
import userAnnouncementRoutes from "./routes/user/announcement.route.js";
import userEventRoutes from "./routes/user/event.route.js";
import userSuggestionRoutes from "./routes/user/suggestion.route.js";
import userReviewRoutes from "./routes/user/review.route.js";
import userBlockRoutes from "./routes/user/block.route.js";
import userReportRoutes from "./routes/user/report.routes.js";
import resetPasswordRoutes from "./routes/user/resetPassword.route.js";

const app = express();

app.set("trust proxy", env.TRUST_PROXY);
app.disable("x-powered-by");

/* The database is connected in `start()` at the bottom of this file, not here.
   Awaiting at the top level makes this an async module, and a host that loads
   the built server with `require()` — LiteSpeed's Node handler on Hostinger
   does — then refuses it outright with ERR_REQUIRE_ASYNC_MODULE and serves 503
   for every request. Nothing above needs the connection: Mongoose buffers
   commands until it is up, and no route runs before `listen`. */

/* ===========================================================
   SECURITY AND PARSING
=========================================================== */

app.use(
  helmet({
    // The SPA build is served from this same origin, so a strict CSP would
    // need the exact asset hashes. Scripts are locked to same-origin instead.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https:"],
        mediaSrc: ["'self'", "https://res.cloudinary.com"],
        connectSrc: ["'self'", ...env.allowedOrigins, "wss:", "ws:"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
  })
);

app.use(compression());

// The same policy the socket server uses: see config/cors.ts.
const corsOptions: CorsOptions = {
  origin: originCallback,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400
};

// Scoped to the API. Static assets are same-origin by definition and need no
// CORS handling at all.
app.use("/api", cors(corsOptions));

/**
 * End every CORS preflight here.
 *
 * When an origin is not on the allow-list the cors middleware adds no headers
 * and calls next(), so the OPTIONS request carried on into the routers and hit
 * `requireAuth`, which answered 401 — or 403 on an admin router. The browser
 * then blocked the real request, and the app reported what looked like a
 * permissions problem when the actual cause was a missing origin.
 *
 * Answering 204 changes nothing about security: a browser still refuses to use
 * a response that carries no Access-Control-Allow-Origin. It only stops a
 * preflight from being reported as an authentication failure.
 */
app.use("/api", (req, res, next) => {
  if (req.method !== "OPTIONS") return next();

  if (!res.getHeader("Access-Control-Allow-Origin")) {
    logger.warn(
      { origin: req.headers.origin, path: req.originalUrl },
      "CORS preflight from an origin that is not allowed. Add it to the FRONTEND_* variables in backend/.env."
    );
  }

  res.sendStatus(204);
});

app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
app.use(cookieParser());

/**
 * Passport, without sessions.
 *
 * Nothing in this codebase reads `req.session`, and no `serializeUser` is
 * defined, so `express-session` was doing nothing except warning on every boot
 * that its in-memory store leaks and cannot scale past one process. The OAuth
 * flow passes `session: false` and carries its own `state`, so it needs no
 * session at all. Authentication is by bearer token throughout.
 */
app.use(passport.initialize());

/* ===========================================================
   HEALTH
=========================================================== */

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: Math.round(process.uptime()), env: env.NODE_ENV });
});

/* ===========================================================
   API
   ---------------------------------------------------------
   Authentication is mounted here, at the router level, so a
   new endpoint added inside any of these files is protected
   by default. Only the three groups listed as public are
   reachable without a token.
=========================================================== */

app.use("/api", apiLimiter);

// --- Public: read-only content for the marketing site -----------------
app.use("/api/public", publicRoutes);

// --- Auth: login, registration and password reset are necessarily open.
//     Each of these routers protects its own privileged endpoints. ------
app.use("/api/admin/auth", authLimiter, adminAuthRoutes);
app.use("/api/user/auth", userAuthRoutes);
app.use("/api/user/password", authLimiter, resetPasswordRoutes);

// --- Admin: signed in, and holding an admin account -------------------
const adminOnly = [requireAuth, requireAdmin, writeLimiter];

app.use("/api/admin/user", adminOnly, adminUserRoutes);
app.use("/api/admin/donation", adminOnly, adminDonationRoutes);
/* Four routers accept a member from an already-installed mobile app, on the
   exact paths that app uses and nothing else, with the same ownership rules
   the member routes apply. See middlewares/legacyAppCompat.ts. */
const legacyBridge = (name: string) => [
  requireAuth,
  allowLegacyMobileMember(name),
  writeLimiter,
  bindActor(),
  stripPrivilegedPostFields
];

app.use("/api/admin/event", legacyBridge("event"), adminEventRoutes);
app.use("/api/admin/gallery", adminOnly, adminGalleryRoutes);
app.use("/api/admin/dashboard", adminOnly, adminDashboardRoutes);
app.use("/api/admin/category", adminOnly, adminCategoryRoutes);
app.use("/api/admin/post", legacyBridge("post"), adminPostRoutes);
app.use("/api/admin/group", legacyBridge("group"), adminGroupRoutes);
app.use("/api/admin/businessgroup", adminOnly, adminBusinessGroupRoutes);
app.use("/api/admin/announcement", legacyBridge("announcement"), adminAnnouncementRoutes);
app.use("/api/admin/chat", adminOnly, adminChatRoutes);
app.use("/api/admin/suggestion", adminOnly, adminSuggestionRoutes);
app.use("/api/admin/notification", adminOnly, adminNotificationRoutes);
app.use("/api/admin/news", adminOnly, adminNewsRoutes);
app.use("/api/admin/reviews", adminOnly, adminReviewsRoutes);
app.use("/api/admin/reports", adminOnly, adminReportRoutes);

// --- Member: signed in. Admins may also call these, so the check is
//     `requireAuth` rather than `requireUser`; handlers that are
//     member-only add `requireUser` themselves.
//
//     `bindActor` overwrites the "who am I" fields in the request with the
//     verified caller, so a handler that reads `req.body.userId` can no
//     longer be pointed at another member's account. ---------------------
const signedIn = [requireAuth, writeLimiter, bindActor()];

app.use("/api/user/post", signedIn, userPostRoutes);
app.use("/api/user/friend", signedIn, userFriendRoutes);
app.use("/api/user/chat", signedIn, userChatRoutes);
app.use("/api/user/notification", signedIn, userNotificationRoutes);
app.use("/api/user/announcement", signedIn, userAnnouncementRoutes);
app.use("/api/user/event", signedIn, userEventRoutes);
app.use("/api/user/suggestion", signedIn, userSuggestionRoutes);
app.use("/api/user/review", signedIn, userReviewRoutes);
app.use("/api/user/block", signedIn, userBlockRoutes);
app.use("/api/user/report", signedIn, userReportRoutes);

// Removing somebody else from a group is the one member endpoint where
// `userId` legitimately names another account, so it opts out of the rewrite
// and checks permission inside the handler instead.
app.use(
  "/api/user/group",
  requireAuth,
  writeLimiter,
  bindActor({ except: ["/remove-member"] }),
  userGroupRoutes
);

// An unmatched /api path is a 404 in JSON, never the SPA shell.
app.use("/api", apiNotFound);

/* ===========================================================
   STATIC SPA BUILDS
=========================================================== */

const oneYear = 1000 * 60 * 60 * 24 * 365;
const staticOptions = { maxAge: oneYear, index: false as const };

/**
 * Find a front-end build, wherever it happens to sit.
 *
 * In development the server runs from `backend/`, so the folders are siblings
 * of app.ts. Compiled, it runs from `backend/dist/`, so they are either copied
 * in beside app.js or still sitting one level up in `backend/`. Checking a few
 * candidates means the same code works in both, and a build placed by hand in
 * the obvious spot is found rather than ignored.
 */
const findFrontend = (folder: string): string | null => {
  const candidates = [
    path.join(__dirname, folder),
    path.join(__dirname, "..", folder),
    path.join(process.cwd(), folder),
    path.join(process.cwd(), "dist", folder)
  ];

  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html"))) ?? null;
};

const adminBuild = findFrontend("admin_build");
const userBuild = findFrontend("user_build");
 
if (adminBuild) app.use("/admin", express.static(adminBuild, staticOptions));
if (userBuild) app.use(express.static(userBuild, staticOptions));
  
logger.info(
  { adminBuild: adminBuild ?? "not found", userBuild: userBuild ?? "not found" },
  adminBuild || userBuild ? "Serving front-end builds" : "No front-end build found; running as an API only"
); 
   
/**
 * Serve the single-page app for anything that is not an API call.
 *
 * On a deployment that hosts only the API — the front ends live on their own
 * services — these folders are not present. Falling through to `sendFile` then
 * produced an opaque error, so say plainly what is going on instead.
 */ 
app.use((req, res) => {
  const base = req.path.startsWith("/admin") ? adminBuild : userBuild;
  const indexFile = base ? path.join(base, "index.html") : "";

  if (!indexFile || !fs.existsSync(indexFile)) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(404).json({
      success: false,
      code: "NO_FRONTEND_BUILD",
      message:
        "No front-end build was found on this server, so it is serving the API only. " +
        "Build the web apps into it with `npm run build:full`, or host them separately. " +
        "API endpoints live under /api.",
      api: "/api",
      health: "/healthz"
    });
  } 

  // The shell itself must never be cached, or a deploy leaves stale asset hashes.
  res.setHeader("Cache-Control", "no-store");
  return res.sendFile(indexFile);
});

/* ===========================================================
   ERRORS
=========================================================== */
    
app.use(errorHandler);

/* ===========================================================
   SERVER
=========================================================== */

const server = http.createServer(app);

initSocket(server);

/**
 * Start up: connect, then listen.
 *
 * This is a function rather than a pair of top-level statements so that
 * nothing in this module awaits at the top level. See the note where the
 * database used to be connected.
 */
const start = async () => {
  await connectDb();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, `Server listening on port ${env.PORT}`);
    legacyCompatBanner();
  });
};

void start();

/* A crash should take the process down cleanly so the supervisor restarts it,
   rather than leaving it running in an unknown state. */

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection, shutting down");
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught exception, shutting down");
  server.close(() => process.exit(1));
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutting down");
  server.close(() => process.exit(0));
  // Do not wait forever for open sockets to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
