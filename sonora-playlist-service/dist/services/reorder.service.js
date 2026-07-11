import { prisma } from '../db/prisma.js';
export async function reorderPlaylistItems(playlistId, itemIds) {
    return prisma.$transaction(async (transaction) => {
        const updatedItems = [];
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
