import type { Request, Response, NextFunction } from "express";

export function respondMiddleware(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  response.success = function <T>(data: T, status: number = 200) {
    return this.status(status).json({ data });
  };

  response.fail = function (
    error: string,
    status: number = 400,
    details?: unknown,
  ) {
    const body: Record<string, unknown> = { error };
    if (details !== undefined) body.details = details;
    return this.status(status).json(body);
  };

  next();
}
