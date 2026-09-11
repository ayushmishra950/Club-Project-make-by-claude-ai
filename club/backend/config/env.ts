import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Every environment variable the server needs, validated once at boot.
 *
 * The rule: anything the app cannot run safely without is `required`.
 * If it is missing the process exits here, with a readable list of what
 * is wrong, instead of falling back to a hardcoded secret and silently
 * running an insecure server.
 */

const nonEmpty = (name: string) =>
  z.string({ error: `${name} is required` }).trim().min(1, `${name} cannot be empty`);

const secret = (name: string) =>
  nonEmpty(name).min(32, `${name} must be at least 32 characters. Generate one with: openssl rand -hex 32`);

const optionalUrl = z.string().trim().url().optional().or(z.literal("").transform(() => undefined));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: nonEmpty("MONGO_URI"),

  // Auth
  ACCESS_TOKEN_SECRET: secret("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_SECRET: secret("REFRESH_TOKEN_SECRET"),
  // No longer used: express-session was removed. Kept optional so an
  // existing deployment that still sets it starts without complaint.
  SESSION_SECRET: z.string().trim().optional(),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),

  // Uploads
  CLOUDINARY_CLOUD_NAME: nonEmpty("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: nonEmpty("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: nonEmpty("CLOUDINARY_API_SECRET"),

  // Social login (optional: only required if that provider is enabled)
  GOOGLE_CLIENT_ID: z.string().trim().optional(),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional(),
  GOOGLE_CALLBACK_URL: z.string().trim().optional(),
  GOOGLE_ANDROID_CLIENT_ID: z.string().trim().optional(),
  GOOGLE_ANDROID_CLIENT2_ID: z.string().trim().optional(),
  GOOGLE_IOS_CLIENT_ID: z.string().trim().optional(),
  APPLE_BUNDLE_ID: z.string().trim().optional(),
  OAUTH_STATE_SECRET: z.string().trim().optional(),

  // Messaging (optional)
  TWILIO_ACCOUNT_SID: z.string().trim().optional(),
  TWILIO_AUTH_TOKEN: z.string().trim().optional(),
  TWILIO_PHONE_NUMBER: z.string().trim().optional(),
  EMAIL_USER: z.string().trim().optional(),
  EMAIL_PASS: z.string().trim().optional(),
  RESEND_API_KEY: z.string().trim().optional(),

  // Frontend origins
  RESET_URL: z.string().trim().optional(),
  FRONTEND_URL: optionalUrl,
  FRONTEND_USER_LOCAL_URL: optionalUrl,
  FRONTEND_ADMIN_LOCAL_URL: optionalUrl,
  FRONTEND_USER_APP_LOCAL_URL: optionalUrl,
  FRONTEND_USER_SOCKET_LOCAL_URL: optionalUrl,
  FRONTEND_ADMIN_SOCKET_LOCAL_URL: optionalUrl,
  FRONTEND_USER_PRODUCTION_URL: optionalUrl,
  FRONTEND_ADMIN_PRODUCTION_URL: optionalUrl,
  FRONTNED_ADMIN_PRODUCTION_URL: optionalUrl, // legacy misspelling, still read
  FRONTEND_USER_APP_PRODUCTION_URL: optionalUrl,
  FRONTEND_USER_SOCKET_PRODUCTION_URL: optionalUrl,
  FRONTEND_ADMIN_SOCKET_PRODUCTION_URL: optionalUrl,

  // Behaviour flags
  BODY_LIMIT: z.string().default("1mb"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1)
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");

  console.error(`\nEnvironment configuration is invalid:\n${issues}\n`);
  console.error("Fix the values in backend/.env and start the server again.\n");
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  isDevelopment: raw.NODE_ENV === "development",

  /**
   * Origins allowed to call the HTTP API and open a socket.
   *
   * Each value is reduced to scheme://host:port before it is used. A browser
   * only ever sends that much in an `Origin` header, so comparing against a
   * full URL silently fails to match, and a value with a path pasted into it
   * by mistake becomes harmless rather than confusing.
   */
  allowedOrigins: Array.from(
    new Set(
      [
        raw.FRONTEND_URL,
        raw.FRONTEND_USER_LOCAL_URL,
        raw.FRONTEND_ADMIN_LOCAL_URL,
        raw.FRONTEND_USER_APP_LOCAL_URL,
        raw.FRONTEND_USER_SOCKET_LOCAL_URL,
        raw.FRONTEND_ADMIN_SOCKET_LOCAL_URL,
        raw.FRONTEND_USER_PRODUCTION_URL,
        raw.FRONTEND_ADMIN_PRODUCTION_URL,
        raw.FRONTNED_ADMIN_PRODUCTION_URL,
        raw.FRONTEND_USER_APP_PRODUCTION_URL,
        raw.FRONTEND_USER_SOCKET_PRODUCTION_URL,
        raw.FRONTEND_ADMIN_SOCKET_PRODUCTION_URL
      ]
        .filter((value): value is string => Boolean(value))
        .map((value) => {
          try {
            // Non-http schemes (Expo's exp://) have no meaningful origin; keep
            // them verbatim so native clients still match.
            if (!value.startsWith("http")) return value.replace(/\/+$/, "");
            return new URL(value).origin;
          } catch {
            return "";
          }
        })
        .filter(Boolean)
    )
  )
};

export type Env = typeof env;
export default env;
