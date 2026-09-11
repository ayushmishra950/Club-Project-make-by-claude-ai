/**
 * An error the client is allowed to see.
 *
 * Anything thrown that is not an AppError is treated as a bug by the error
 * handler and reported to the client as a generic 500, so internal messages,
 * stack traces and driver errors never leak.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational = true;

  constructor(statusCode: number, message: string, code = "ERROR", details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, "BAD_REQUEST", details);

export const unauthorized = (message = "You need to sign in to do that.") =>
  new AppError(401, message, "UNAUTHORIZED");

export const forbidden = (message = "You do not have permission to do that.") =>
  new AppError(403, message, "FORBIDDEN");

export const notFound = (message = "Not found.") => new AppError(404, message, "NOT_FOUND");

export const conflict = (message: string) => new AppError(409, message, "CONFLICT");

export const tooManyRequests = (message = "Too many requests. Please slow down.") =>
  new AppError(429, message, "TOO_MANY_REQUESTS");

export default AppError;
