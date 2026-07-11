import { useEffect, useState } from 'react';
import { request } from '../api/client';
import { createArticle, deleteArticle } from '../api/articles';
import { listPlaylists, addPlaylistItem } from '../api/playlists';
import type { ApiAudioJob, Playlist } from '../types';

interface LibraryPageProps {
  onPlayTrack: (title: string, audioUrl: string) => void;
}

export function LibraryPage({ onPlayTrack }: LibraryPageProps) {
  const [jobs, setJobs] = useState<ApiAudioJob[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [articleText, setArticleText] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [selectedPlaylists, setSelectedPlaylists] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await request<ApiAudioJob[]>('/articles');
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const data = await request<Playlist[]>('/playlists');
      setPlaylists(data);
      // Select first playlist by default for each job
      if (data.length > 0) {
        setSelectedPlaylists((prev) => {
          const initialSelections: Record<string, string> = { ...prev };
          for (const job of jobs) {
            if (!initialSelections[job.job_id]) {
              initialSelections[job.job_id] = data[0].id;
            }
          }
          return initialSelections;
        });
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchJobs(), fetchPlaylists()]).finally(() => setLoading(false));
  }, []);

  // Poll jobs if any are pending or processing
  const hasActiveJobs = jobs.some((job) => job.status === 'pending' || job.status === 'processing');
  useEffect(() => {
    if (!hasActiveJobs) return;

    const interval = setInterval(async () => {
      try {
        const data = await request<ApiAudioJob[]>('/articles');
        setJobs(data);
      } catch (error) {
        console.error('Error polling jobs:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [hasActiveJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleText.trim() && !articleUrl.trim()) {
      alert('Veuillez fournir du texte ou une URL.');
      return;
    }

    setSubmitting(true);
    try {
      await createArticle({
        articleText: articleText || undefined,
        articleUrl: articleUrl || undefined,
      });
      setArticleText('');
      setArticleUrl('');
      await fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Erreur lors de la création du job audio.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce podcast ?')) {
      return;
    }

    try {
      await deleteArticle(jobId);
      setJobs((prevJobs) => prevJobs.filter((job) => job.job_id !== jobId));
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Erreur lors de la suppression du podcast.');
    }
  };

  const handlePlaylistSelectChange = (jobId: string, playlistId: string) => {
    setSelectedPlaylists((prev) => ({ ...prev, [jobId]: playlistId }));
  };

  const handleAddToPlaylist = async (job: ApiAudioJob) => {
    const playlistId = selectedPlaylists[job.job_id] || (playlists[0]?.id);
    if (!playlistId) {
      alert('Veuillez créer une playlist d’abord.');
      return;
    }

    const title = job.article_text 
      ? (job.article_text.slice(0, 30) + '...') 
      : `Podcast ${job.job_id.slice(0, 6)}`;

    try {
      await addPlaylistItem(playlistId, job.job_id, title);
      alert('Ajouté à la playlist avec succès !');
    } catch (error) {
      console.error('Failed to add item to playlist:', error);
      alert('Erreur lors de l’ajout.');
    }
  };

  const getStatusBadgeClass = (status: ApiAudioJob['status']) => {
    switch (status) {
      case 'success': return 'badge success';
      case 'error': return 'badge error';
      case 'processing': return 'badge processing';
      default: return 'badge pending';
    }
  };

  const getStatusLabel = (status: ApiAudioJob['status']) => {
    switch (status) {
      case 'success': return 'Prêt';
      case 'error': return 'Erreur';
      case 'processing': return 'En cours';
      default: return 'En attente';
    }
  };

  return (
    <section className="grid">
      <div className="card header-card">
        <h2>Bibliothèque de Podcasts</h2>
        <p className="muted">Soumettez des articles techniques ou du texte brut pour générer automatiquement des podcasts audio.</p>
      </div>

      <div className="card form-card">
        <h3>Nouvel Article</h3>
        <form onSubmit={handleSubmit} className="article-form">
          <div className="form-group">
            <label htmlFor="articleUrl">URL de l'article (facultatif)</label>
            <input
              type="url"
              id="articleUrl"
              placeholder="https://example.com/article-technique"
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="articleText">Contenu textuel (requis si pas d'URL)</label>
            <textarea
              id="articleText"
              rows={4}
              placeholder="Collez ici le contenu ou le résumé technique..."
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
            />
          </div>
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Envoi...' : 'Générer le podcast'}
          </button>
        </form>
      </div>

      <div className="jobs-section">
        <h3>Vos podcasts</h3>
        {loading ? (
          <div className="card loading-card">Chargement de votre bibliothèque...</div>
        ) : jobs.length === 0 ? (
          <div className="card empty-card">Aucun podcast généré pour le moment. Soumettez un article ci-dessus.</div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div key={job.job_id} className="card job-card">
                <div className="job-header">
                  <span className={getStatusBadgeClass(job.status)}>
                    {getStatusLabel(job.status)}
                  </span>
                  <div className="job-header-right">
                    <span className="job-date">
                      ID: {job.job_id.slice(0, 8)}...
                    </span>
                    <button
                      type="button"
                      className="delete-job-btn"
                      onClick={() => handleDeleteJob(job.job_id)}
                      title="Supprimer ce podcast"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <p className="job-preview">
                  {job.article_text 
                    ? job.article_text.slice(0, 160) + (job.article_text.length > 160 ? '...' : '') 
                    : <span className="muted italic">Aucun texte extrait</span>
                  }
                </p>

                {job.status === 'error' && job.error_message && (
                  <div className="error-message">❌ {job.error_message}</div>
                )}

                <div className="job-actions">
                  {job.status === 'success' && (
                    <>
                      <button 
                        type="button" 
                        className="play-btn" 
                        onClick={() => onPlayTrack(
                          job.article_text ? job.article_text.slice(0, 40) + '...' : `Podcast ${job.job_id.slice(0, 6)}`,
                          job.audio_url
                        )}
                      >
                        ▶️ Écouter
                      </button>
                      
                      {playlists.length > 0 && (
                        <div className="add-playlist-ctrl">
                          <select 
                            value={selectedPlaylists[job.job_id] || playlists[0].id}
                            onChange={(e) => handlePlaylistSelectChange(job.job_id, e.target.value)}
                          >
                            {playlists.map((pl) => (
                              <option key={pl.id} value={pl.id}>{pl.name}</option>
                            ))}
                          </select>
                          <button 
                            type="button" 
                            className="add-to-pl-btn"
                            onClick={() => handleAddToPlaylist(job)}
                          >
                            ➕ Ajouter
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {(job.status === 'pending' || job.status === 'processing') && (
                    <div className="pulse-loader">Génération en cours...</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
