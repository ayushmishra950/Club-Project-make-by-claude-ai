import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Wraps an async route handler so a rejected promise reaches the Express
 * error handler instead of hanging the request or crashing the process.
 *
 *   router.get("/", asyncHandler(getThings));
 */
export const asyncHandler =
  <T extends Request = Request>(handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req as unknown as T, res, next)).catch(next);
  };

export default asyncHandler;
