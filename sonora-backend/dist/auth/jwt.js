import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function signInternalToken(payload) {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });
}
export function verifyInternalToken(token) {
    return jwt.verify(token, env.jwtSecret);
}
