import { request } from './client';
import type { Playlist, PlaylistItem } from '../types';

export function listPlaylists() {
  return request<Playlist[]>('/playlists');
}

export function createPlaylist(name: string) {
  return request<Playlist>('/playlists', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function addPlaylistItem(playlistId: string, audioJobId: string, title: string) {
  return request<PlaylistItem>(`/playlists/${playlistId}/items`, {
    method: 'POST',
    body: JSON.stringify({ audioJobId, title }),
  });
}

export function reorderPlaylist(playlistId: string, itemIds: string[]) {
  return request<Array<{ id: string; position: number }>>(`/playlists/${playlistId}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ itemIds }),
  });
}

export function deletePlaylist(playlistId: string) {
  return request<void>(`/playlists/${playlistId}`, {
    method: 'DELETE',
  });
}

export function deletePlaylistItem(playlistId: string, itemId: string) {
  return request<void>(`/playlists/${playlistId}/items/${itemId}`, {
    method: 'DELETE',
  });
}
