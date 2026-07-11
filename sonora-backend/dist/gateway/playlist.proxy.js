import { env } from '../config/env.js';
async function forward(path, init) {
    const response = await fetch(`${env.playlistServiceUrl}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        ...init,
    });
    const text = await response.text();
    return {
        status: response.status,
        body: text ? JSON.parse(text) : null,
    };
}
export const playlistProxy = {
    listPlaylists: (userId) => forward(`/playlists?userId=${encodeURIComponent(userId)}`),
    createPlaylist: (body) => forward('/playlists', { method: 'POST', body: JSON.stringify(body) }),
    addPlaylistItem: (playlistId, body) => forward(`/playlists/${playlistId}/items`, { method: 'POST', body: JSON.stringify(body) }),
    reorderPlaylist: (playlistId, body) => forward(`/playlists/${playlistId}/reorder`, { method: 'PATCH', body: JSON.stringify(body) }),
};
