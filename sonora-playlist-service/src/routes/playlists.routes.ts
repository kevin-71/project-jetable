import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const playlistsRouter = Router();

playlistsRouter.post('/users', async (request, response, next) => {
  try {
    const { id, email, name } = request.body as { id: string; email: string; name?: string };
    const user = await prisma.user.upsert({
      where: { id },
      update: { email, name },
      create: { id, email, name },
    });
    response.json(user);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.get('/playlists', async (request, response, next) => {
  try {
    const userId = request.query.userId as string;
    const playlists = await prisma.playlist.findMany({
      where: userId ? { userId } : undefined,
      include: { items: { orderBy: { position: 'asc' } } },
    });
    response.json(playlists);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.post('/playlists', async (request, response, next) => {
  try {
    const { userId, name, email, displayName } = request.body as {
      userId: string;
      name: string;
      email?: string;
      displayName?: string;
    };

    // Ensure the user exists in the database
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: email || `${userId}@placeholder.com`,
        name: displayName || name || 'User',
      },
    });

    const playlist = await prisma.playlist.create({ data: { userId, name } });
    response.status(201).json(playlist);
  } catch (error) {
    next(error);
  }
});

playlistsRouter.delete('/playlists/:id', async (request, response, next) => {
  try {
    const id = request.params.id;
    await prisma.playlist.delete({
      where: { id },
    });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
