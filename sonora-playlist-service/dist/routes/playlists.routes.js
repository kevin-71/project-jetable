import { Router } from 'express';
import { prisma } from '../db/prisma.js';
export const playlistsRouter = Router();
playlistsRouter.get('/playlists', async (_request, response, next) => {
    try {
        const playlists = await prisma.playlist.findMany({ include: { items: { orderBy: { position: 'asc' } } } });
        response.json(playlists);
    }
    catch (error) {
        next(error);
    }
});
playlistsRouter.post('/playlists', async (request, response, next) => {
    try {
        const { userId, name } = request.body;
        const playlist = await prisma.playlist.create({ data: { userId, name } });
        response.status(201).json(playlist);
    }
    catch (error) {
        next(error);
    }
});
