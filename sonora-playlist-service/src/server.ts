import dotenv from 'dotenv';
import express from 'express';
import { itemsRouter } from './routes/items.routes.js';
import { playlistsRouter } from './routes/playlists.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'sonora-playlist-service' });
});

app.use(playlistsRouter);
app.use(itemsRouter);

const port = Number(process.env.PORT ?? 4001);
app.listen(port, () => {
  console.log(`sonora-playlist-service listening on ${port}`);
});
