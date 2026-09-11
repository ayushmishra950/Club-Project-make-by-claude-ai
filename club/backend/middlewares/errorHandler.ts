import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { AppError } from "../utils/appError.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

/** Anything under /api that matched no route gets a JSON 404, not the SPA shell. */
export const apiNotFound = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `No endpoint matches ${req.method} ${req.originalUrl}`
  });
};

interface NormalisedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  /** True when the error is a bug rather than an expected rejection. */
  unexpected: boolean;
}

const normalise = (error: unknown): NormalisedError => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
      unexpected: false
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: "VALIDATION_FAILED",
      message: "Some of the details you sent are not valid.",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "(body)",
        message: issue.message
      })),
      unexpected: false
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      code: "VALIDATION_FAILED",
      message: "Some of the details you sent are not valid.",
      details: Object.values(error.errors).map((detail) => ({
        field: detail.path,
        message: detail.message
      })),
      unexpected: false
    };
  }

  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      code: "INVALID_ID",
      message: `"${String(error.value)}" is not a valid ${error.path}.`,
      unexpected: false
    };
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "That file is too large. The limit is 5 MB."
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? "That file field is not accepted here."
          : "The upload could not be processed.";
    return { statusCode: 400, code: error.code, message, unexpected: false };
  }

  // Duplicate key: surface which field collided, without echoing the value.
  const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
  if (mongoError?.code === 11000) {
    const field = Object.keys(mongoError.keyPattern || {})[0] || "value";
    return {
      statusCode: 409,
      code: "DUPLICATE",
      message: `That ${field} is already registered.`,
      unexpected: false
    };
  }

  /* Errors raised by body parsers and other Express middleware carry their own
     status. Without this branch an oversized request body surfaced as a 500,
     which told the client to retry a request that can never succeed. */
  const httpError = error as { status?: number; statusCode?: number; type?: string; message?: string; expose?: boolean };
  const status = httpError?.status ?? httpError?.statusCode;

  if (typeof status === "number" && status >= 400 && status < 500) {
    const known: Record<string, string> = {
      "entity.too.large": "That request is too large.",
      "entity.parse.failed": "The request body is not valid JSON.",
      "encoding.unsupported": "That content encoding is not supported."
    };

    return {
      statusCode: status,
      code: httpError.type ? httpError.type.toUpperCase().replace(/\./g, "_") : "BAD_REQUEST",
      message: (httpError.type && known[httpError.type]) || (httpError.expose && httpError.message) || "That request could not be processed.",
      unexpected: false
    };
  }

  return {
    statusCode: 500,
    code: "INTERNAL_ERROR",
    message: "Something went wrong on our side. Please try again.",
    unexpected: true
  };
};

/**
 * The single place an error becomes a response.
 *
 * Expected failures keep their message. Unexpected ones are logged in full and
 * answered with a generic message, so stack traces and driver internals never
 * reach the client.
 */
export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const normalised = normalise(error);

  if (normalised.unexpected) {
    logger.error(
      {
        method: req.method,
        url: req.originalUrl,
        actor: req.actor?.id,
        err: error
      },
      "Unhandled error"
    );
  } else if (normalised.statusCode >= 500) {
    logger.warn({ method: req.method, url: req.originalUrl, err: error }, normalised.message);
  }

  res.status(normalised.statusCode).json({
    success: false,
    code: normalised.code,
    message: normalised.message,
    ...(normalised.details ? { details: normalised.details } : {}),
    // The stack is useful locally and is never sent in production.
    ...(env.isProduction || !normalised.unexpected
      ? {}
      : { stack: error instanceof Error ? error.stack : undefined })
  });
};

export default errorHandler;
