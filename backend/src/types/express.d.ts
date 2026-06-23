import type { JwtPayload } from "jsonwebtoken";
declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
      email: string;
      username: string;
    }

    interface Request {
      log: import("pino").Logger;
      user?: User | undefined;
    }

    interface Response {
      success<T>(data: T, status?: number): void;
      fail(error: string, status?: number, details?: unknown): void;
    }
  }
}

export {};
