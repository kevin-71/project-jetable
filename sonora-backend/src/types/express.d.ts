import type { InternalUser } from './index.js';

declare global {
  namespace Express {
    interface Request {
      user?: InternalUser;
    }
  }
}

export {};
