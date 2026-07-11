import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import { configureGoogleStrategy } from './auth/google.strategy.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { articlesRouter } from './routes/articles.routes.js';
import { playlistsRouter } from './routes/playlists.routes.js';
dotenv.config();
configureGoogleStrategy(passport);
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(passport.initialize());
app.get('/health', (_request, response) => {
    response.json({ ok: true, service: 'sonora-backend' });
});
app.use('/audio', express.static(process.env.AUDIO_STORAGE_DIR ?? '/tmp/sonora-audio'));
app.use(authRouter);
app.use(articlesRouter);
app.use(playlistsRouter);
app.use(errorHandler);
const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
    console.log(`sonora-backend listening on ${port}`);
});
