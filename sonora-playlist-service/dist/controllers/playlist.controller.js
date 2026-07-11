import { prisma } from '../db/prisma.js';
export async function listPlaylists() {
    return prisma.playlist.findMany({ include: { items: { orderBy: { position: 'asc' } } } });
}
