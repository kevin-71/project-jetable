import { env } from '../config/env.js';

async function forward(path: string, init?: RequestInit) {
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
  listPlaylists: (userId: string) => forward(`/playlists?userId=${encodeURIComponent(userId)}`),
  createPlaylist: (body: unknown) => forward('/playlists', { method: 'POST', body: JSON.stringify(body) }),
  addPlaylistItem: (playlistId: string, body: unknown) => forward(`/playlists/${playlistId}/items`, { method: 'POST', body: JSON.stringify(body) }),
  reorderPlaylist: (playlistId: string, body: unknown) => forward(`/playlists/${playlistId}/reorder`, { method: 'PATCH', body: JSON.stringify(body) }),
};
