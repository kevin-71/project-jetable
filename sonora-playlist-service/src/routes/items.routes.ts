import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { reorderPlaylistItems } from '../services/reorder.service.js';

export const itemsRouter = Router();

itemsRouter.post('/playlists/:id/items', async (request, response, next) => {
  try {
    const playlistId = request.params.id;
    const { audioJobId, title } = request.body as { audioJobId: string; title?: string };
    const itemCount = await prisma.playlistItem.count({ where: { playlistId } });

    const item = await prisma.playlistItem.create({
      data: {
        playlistId,
        audioJobId,
        title,
        position: itemCount + 1,
      },
    });

    response.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

itemsRouter.patch('/playlists/:id/reorder', async (request, response, next) => {
  try {
    const playlistId = request.params.id;
    const { itemIds } = request.body as { itemIds: string[] };
    const updatedItems = await reorderPlaylistItems(playlistId, itemIds);
    response.json(updatedItems);
  } catch (error) {
    next(error);
  }
});

itemsRouter.delete('/items/by-audio/:audioJobId', async (request, response, next) => {
  try {
    const { audioJobId } = request.params;
    await prisma.playlistItem.deleteMany({
      where: { audioJobId },
    });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

itemsRouter.delete('/playlists/:playlistId/items/:itemId', async (request, response, next) => {
  try {
    const { itemId } = request.params;
    await prisma.playlistItem.delete({
      where: { id: itemId },
    });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});
