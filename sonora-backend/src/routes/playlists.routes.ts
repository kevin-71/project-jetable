import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { playlistProxy } from '../gateway/playlist.proxy.js';

export const playlistsRouter = Router();

playlistsRouter.get('/playlists', requireAuth, async (_request, response, next) => {
  try {
    const result = await playlistProxy.listPlaylists((_request.user as { sub: string }).sub);
    response.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.post('/playlists', requireAuth, async (request, response, next) => {
  try {
    const user = request.user as { sub: string; email?: string; displayName?: string };
    const result = await playlistProxy.createPlaylist({
      ...request.body,
      userId: user.sub,
      email: user.email,
      displayName: user.displayName,
    });
    response.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.post('/playlists/:id/items', requireAuth, async (request, response, next) => {
  try {
    const result = await playlistProxy.addPlaylistItem(request.params.id as string, request.body);
    response.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.patch('/playlists/:id/reorder', requireAuth, async (request, response, next) => {
  try {
    const result = await playlistProxy.reorderPlaylist(request.params.id as string, request.body);
    response.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.delete('/playlists/:id', requireAuth, async (request, response, next) => {
  try {
    const result = await playlistProxy.deletePlaylist(request.params.id as string);
    response.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.delete('/playlists/:id/items/:itemId', requireAuth, async (request, response, next) => {
  try {
    const result = await playlistProxy.deletePlaylistItem(request.params.id as string, request.params.itemId as string);
    response.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});
