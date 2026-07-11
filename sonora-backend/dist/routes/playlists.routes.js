import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { playlistProxy } from '../gateway/playlist.proxy.js';
export const playlistsRouter = Router();
playlistsRouter.get('/playlists', requireAuth, async (_request, response, next) => {
    try {
        const result = await playlistProxy.listPlaylists(_request.user.sub);
        response.status(result.status).json(result.body);
    }
    catch (error) {
        next(error);
    }
});
playlistsRouter.post('/playlists', requireAuth, async (request, response, next) => {
    try {
        const user = request.user;
        const result = await playlistProxy.createPlaylist({ ...request.body, userId: user.sub });
        response.status(result.status).json(result.body);
    }
    catch (error) {
        next(error);
    }
});
playlistsRouter.post('/playlists/:id/items', requireAuth, async (request, response, next) => {
    try {
        const result = await playlistProxy.addPlaylistItem(request.params.id, request.body);
        response.status(result.status).json(result.body);
    }
    catch (error) {
        next(error);
    }
});
playlistsRouter.patch('/playlists/:id/reorder', requireAuth, async (request, response, next) => {
    try {
        const result = await playlistProxy.reorderPlaylist(request.params.id, request.body);
        response.status(result.status).json(result.body);
    }
    catch (error) {
        next(error);
    }
});
