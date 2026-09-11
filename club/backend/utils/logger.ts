import env from "../config/env.js";

/**
 * Minimal structured logger.
 *
 * Deliberately dependency-free so it can be swapped for Pino or shipped to a
 * log service later without touching call sites. The important property is
 * that every line is one JSON object in production, which is what log
 * aggregators expect, and readable text locally.
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[(process.env.LOG_LEVEL as Level) || (env.isProduction ? "info" : "debug")] ?? 20;

/** Values that must never reach a log line, whatever object they arrive inside. */
const REDACTED = new Set([
  "password",
  "newpassword",
  "confirmpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "refreshtokens",
  "identitytoken",
  "idtoken",
  "authorization",
  "cookie",
  "secret",
  "apikey",
  "resetlink"
]);

const redact = (value: unknown, depth = 0): unknown => {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));

  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    output[key] = REDACTED.has(key.toLowerCase()) ? "[redacted]" : redact(item, depth + 1);
  }
  return output;
};

const write = (level: Level, context: unknown, message?: string) => {
  if (LEVELS[level] < threshold) return;

  const hasContext = typeof context === "object" && context !== null;
  const text = message ?? (typeof context === "string" ? context : "");
  const fields = hasContext ? (redact(context) as Record<string, unknown>) : {};

  if (env.isProduction) {
    process.stdout.write(`${JSON.stringify({ level, time: new Date().toISOString(), msg: text, ...fields })}\n`);
    return;
  }

  const target = level === "error" || level === "warn" ? console.error : console.log;
  target(`[${level.toUpperCase()}] ${text}`, hasContext && Object.keys(fields).length ? fields : "");
};

export const logger = {
  debug: (context: unknown, message?: string) => write("debug", context, message),
  info: (context: unknown, message?: string) => write("info", context, message),
  warn: (context: unknown, message?: string) => write("warn", context, message),
  error: (context: unknown, message?: string) => write("error", context, message)
};

export default logger;
