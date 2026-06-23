import type { Request, Response, NextFunction } from "express";
import { getLogger } from "../lib/logger";
import { Sentry } from "../lib/sentry";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const logger = getLogger();

  if (error instanceof AppError) {
    response
      .status(error.statusCode)
      .json({ error: error.message, details: error.details });
    return;
  }

  const message =
    error instanceof Error ? error.message : "Unknown server error";
  logger.error({ err: error }, message);
  Sentry.captureException(error);

  response.status(500).json({ error: "Internal server error" });
}
