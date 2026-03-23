import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

function getJwtSecret() {
  return process.env.JWT_SECRET || 'your-secret-key-here';
}

export function signAuthToken(payload: { id: string; email: string; username: string }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function extractUserFromAuthHeader(request: Request) {
  const authorization = request.header('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getJwtSecret()) as Express.UserInfo;
  } catch {
    return null;
  }
}

export function authMiddleware(request: Request, response: Response, next: NextFunction) {
  const user = extractUserFromAuthHeader(request);

  if (!user) {
    response.status(401).json({ error: 'Unauthorized' });
    return;
  }

  request.user = {
    id: user.id,
    email: user.email,
    username: user.username,
  };

  next();
}
