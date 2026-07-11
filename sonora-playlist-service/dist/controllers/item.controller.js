import { prisma } from '../db/prisma.js';
import { reorderPlaylistItems } from '../services/reorder.service.js';
export async function addPlaylistItem(playlistId, audioJobId, title) {
    const itemCount = await prisma.playlistItem.count({ where: { playlistId } });
    return prisma.playlistItem.create({
        data: {
            playlistId,
            audioJobId,
            title,
            position: itemCount + 1,
        },
    });
}
export async function reorderItems(playlistId, itemIds) {
    return reorderPlaylistItems(playlistId, itemIds);
}
