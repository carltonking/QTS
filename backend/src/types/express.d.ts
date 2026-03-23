import type { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface UserInfo extends JwtPayload {
      id: string;
      email: string;
      username: string;
    }

    interface Request {
      user?: UserInfo;
    }
  }
}

export {};
