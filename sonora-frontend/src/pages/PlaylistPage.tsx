import { useEffect, useState } from 'react';
import { request } from '../api/client';
import { createPlaylist, reorderPlaylist, listPlaylists, deletePlaylist, deletePlaylistItem } from '../api/playlists';
import type { Playlist, PlaylistItem, ApiJobStatus } from '../types';

interface PlaylistPageProps {
  onPlayTrack: (title: string, audioUrl: string) => void;
}

export function PlaylistPage({ onPlayTrack }: PlaylistPageProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = async () => {
    try {
      const data = await request<Playlist[]>('/playlists');
      setPlaylists(data);
      if (data.length > 0 && !activePlaylistId) {
        setActivePlaylistId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPlaylists().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setCreating(true);
    try {
      const newPl = await createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      await fetchPlaylists();
      setActivePlaylistId(newPl.id);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Erreur lors de la création de la playlist.');
    } finally {
      setCreating(false);
    }
  };

  const handlePlayItem = async (item: PlaylistItem) => {
    try {
      const jobStatus = await request<ApiJobStatus>(`/articles/${item.audioJobId}/status`);
      if (jobStatus.status === 'success' && jobStatus.audio_url) {
        onPlayTrack(item.title || 'Technical Podcast', jobStatus.audio_url);
      } else {
        alert("Ce podcast n'est pas encore prêt ou a échoué.");
      }
    } catch (error) {
      console.error('Error fetching audio url:', error);
      alert("Erreur de connexion lors du chargement du fichier audio.");
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const pl = playlists.find((p) => p.id === activePlaylistId);
    if (!pl) return;

    const newItems = [...pl.items];
    const swapWithIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapWithIndex < 0 || swapWithIndex >= newItems.length) return;

    // Swap items
    const temp = newItems[index];
    newItems[index] = newItems[swapWithIndex];
    newItems[swapWithIndex] = temp;

    // Update locally first for snappy UI response
    const updatedPlaylists = playlists.map((p) => {
      if (p.id === activePlaylistId) {
        return {
          ...p,
          items: newItems.map((item, idx) => ({ ...item, position: idx + 1 })),
        };
      }
      return p;
    });
    setPlaylists(updatedPlaylists);

    // Call service transaction backend
    try {
      const itemIds = newItems.map((item) => item.id);
      await reorderPlaylist(pl.id, itemIds);
      // Refetch from database to ensure alignment
      await fetchPlaylists();
    } catch (error) {
      console.error('Failed to reorder items:', error);
      alert('Erreur lors de la réorganisation. Rétablissement...');
      await fetchPlaylists();
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette playlist ?')) {
      return;
    }

    try {
      await deletePlaylist(playlistId);
      const remainingPlaylists = playlists.filter((p) => p.id !== playlistId);
      setPlaylists(remainingPlaylists);
      if (remainingPlaylists.length > 0) {
        setActivePlaylistId(remainingPlaylists[0].id);
      } else {
        setActivePlaylistId(null);
      }
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      alert('Erreur lors de la suppression de la playlist.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activePlaylistId) return;
    if (!window.confirm('Voulez-vous vraiment retirer ce podcast de la playlist ?')) {
      return;
    }

    try {
      await deletePlaylistItem(activePlaylistId, itemId);
      await fetchPlaylists();
    } catch (error) {
      console.error('Failed to delete item from playlist:', error);
      alert('Erreur lors du retrait du podcast.');
    }
  };

  const selectedPlaylist = playlists.find((p) => p.id === activePlaylistId);

  return (
    <section className="grid playlist-layout">
      <div className="card header-card">
        <h2>Vos Playlists</h2>
        <p className="muted">Gérez vos listes de lecture de podcasts. L'ordre des pistes est maintenu de manière transactionnelle.</p>
      </div>

      <div className="playlist-sidebar-main-grid">
        {/* Playlists selectors */}
        <div className="card playlist-selector-card">
          <h3>Playlists</h3>
          <form onSubmit={handleCreate} className="create-playlist-form">
            <input
              type="text"
              placeholder="Nom de la playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              required
            />
            <button type="submit" disabled={creating}>
              {creating ? '...' : 'Créer'}
            </button>
          </form>

          <div className="playlists-list">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                className={`playlist-item-btn ${activePlaylistId === pl.id ? 'active' : ''}`}
                onClick={() => setActivePlaylistId(pl.id)}
              >
                📁 {pl.name} ({pl.items.length})
              </button>
            ))}
          </div>
        </div>

        {/* Selected Playlist Items */}
        <div className="card playlist-details-card">
          {loading ? (
            <div>Chargement de la playlist...</div>
          ) : selectedPlaylist ? (
            <>
              <div className="playlist-details-header">
                <div className="playlist-title-info">
                  <h3>{selectedPlaylist.name}</h3>
                  <span className="muted">{selectedPlaylist.items.length} podcasts</span>
                </div>
                <button
                  type="button"
                  className="delete-playlist-btn"
                  onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                >
                  🗑️ Supprimer
                </button>
              </div>

              {selectedPlaylist.items.length === 0 ? (
                <div className="empty-playlist-msg">
                  Cette playlist est vide. Ajoutez-y des podcasts depuis votre Bibliothèque !
                </div>
              ) : (
                <div className="playlist-tracks">
                  {selectedPlaylist.items.map((item, index) => (
                    <div key={item.id} className="playlist-track-row">
                      <div className="track-info">
                        <span className="track-position">{index + 1}</span>
                        <div className="track-text-info">
                          <span className="track-title">{item.title || 'Technical Article'}</span>
                          <span className="track-meta muted">ID: {item.audioJobId.slice(0, 8)}...</span>
                        </div>
                      </div>
                      <div className="track-actions">
                        <button
                          type="button"
                          className="track-play-btn"
                          onClick={() => handlePlayItem(item)}
                        >
                          ▶️ Lire
                        </button>
                        <button
                          type="button"
                          className="track-delete-btn"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Retirer de la playlist"
                        >
                          🗑️
                        </button>
                        <div className="reorder-controls">
                          <button
                            type="button"
                            className="reorder-btn"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                          >
                            🔼
                          </button>
                          <button
                            type="button"
                            className="reorder-btn"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === selectedPlaylist.items.length - 1}
                          >
                            🔽
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-playlist-selected-msg">
              Créez une playlist pour commencer à écouter vos podcasts de manière ordonnée.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
