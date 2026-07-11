import { Router } from 'express';
import passport from 'passport';
import { env } from '../config/env.js';
import { signInternalToken } from '../auth/jwt.js';

export const authRouter = Router();

authRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

authRouter.get('/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/auth/failed' }), async (request, response, next) => {
  try {
    const user = request.user as { id: string; email?: string | null; displayName?: string | null };

    // Register/sync user in the playlist service database
    try {
      await fetch(`${env.playlistServiceUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email ?? '',
          name: user.displayName ?? '',
        }),
      });
    } catch (syncError) {
      console.error('Failed to sync user with playlist service:', syncError);
    }

    const token = signInternalToken({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    const redirectUrl = new URL(env.frontendUrl);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('user', JSON.stringify(user));
    response.redirect(302, redirectUrl.toString());
  } catch (error) {
    next(error);
  }
});

authRouter.post('/auth/dev-token', (request, response) => {
  const { userId, email, name } = request.body as { userId?: string; email?: string; name?: string };
  const sub = userId || 'dev-user';
  const token = signInternalToken({
    sub,
    email: email || 'dev@example.com',
    displayName: name || 'Developer User',
  });
  response.json({
    token,
    user: { id: sub, email: email || 'dev@example.com', displayName: name || 'Developer User' },
  });
});

authRouter.post('/auth/logout', (_request, response) => {
  response.status(204).send();
});

authRouter.get('/auth/failed', (_request, response) => {
  response.status(401).json({ error: 'google_auth_failed' });
});
