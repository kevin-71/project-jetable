import type { NextFunction, Request, Response } from 'express';
import { verifyInternalToken } from './jwt.js';

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'missing_token' });
  }

  try {
    const token = header.slice('Bearer '.length);
    request.user = verifyInternalToken(token);
    return next();
  } catch {
    return response.status(401).json({ error: 'invalid_token' });
  }
}
