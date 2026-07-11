import type { PassportStatic } from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config/env.js';

export function configureGoogleStrategy(passport: PassportStatic) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID ?? 'change-me',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'change-me',
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? `http://localhost:${env.port}/auth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, {
          id: profile.id,
          email: profile.emails?.[0]?.value ?? null,
          displayName: profile.displayName,
        });
      },
    ),
  );
}
