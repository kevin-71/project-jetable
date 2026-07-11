import { prisma } from '../db/prisma.js';

export async function reorderPlaylistItems(playlistId: string, itemIds: string[]) {
  return prisma.$transaction(async (transaction) => {
    // Phase 1: move to temporary negative positions to avoid unique-constraint conflicts
    for (const [index, itemId] of itemIds.entries()) {
      await transaction.playlistItem.update({
        where: { id: itemId },
        data: { position: -(index + 1) },
      });
    }

    // Phase 2: assign final positions
    const updatedItems = [] as Array<{ id: string; position: number }>;
    for (const [index, itemId] of itemIds.entries()) {
      const item = await transaction.playlistItem.update({
        where: { id: itemId },
        data: { position: index + 1 },
        select: { id: true, position: true },
      });
      updatedItems.push(item);
    }

    return updatedItems;
  });
}
