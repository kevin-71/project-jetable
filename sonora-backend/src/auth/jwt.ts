import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface InternalTokenPayload {
  sub: string;
  email?: string | null;
  displayName?: string | null;
}

export function signInternalToken(payload: InternalTokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}

export function verifyInternalToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as InternalTokenPayload;
}
