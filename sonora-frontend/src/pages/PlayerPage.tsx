import { useState, useEffect } from 'react';
import { AudioPlayer } from '../components/AudioPlayer';

interface PlayerPageProps {
  jobId?: string;      // Nouveau : pour chercher l'audio s'il est en cours de génération
  audioUrl?: string;   // On le garde : utile si l'audio est déjà prêt (ex: page historique)
  title?: string;
}

export function PlayerPage({ jobId, audioUrl: initialAudioUrl, title }: PlayerPageProps) {
  // On stocke l'URL final ici. On l'initialise avec l'URL passé en prop s'il existe.
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialAudioUrl);
  
  // On gère l'état d'affichage. Si on a déjà une URL, c'est 'completed' direct.
  const [status, setStatus] = useState<'pending' | 'completed' | 'error'>(
    initialAudioUrl ? 'completed' : 'pending'
  );

  useEffect(() => {
    // 1. Si on a déjà l'URL, pas besoin de faire du polling.
    if (audioUrl) return;

    // 2. Si on n'a ni URL ni jobId, on ne peut rien faire.
    if (!jobId) {
       setStatus('error');
       return;
    }

    // 3. Boucle de vérification du statut
    const interval = setInterval(async () => {
      try {
        // ⚠️ Adapte la route de ton fetch selon ton architecture (ton gateway / tes routes frontend)
        const response = await fetch(`/api/job-status/${jobId}`); 
        const data = await response.json();

        // On vérifie le retour de ton backend
        if (data.status === 'completed' && data.audio_url) {
          setAudioUrl(data.audio_url);
          setStatus('completed');
          clearInterval(interval); // C'est prêt, on arrête la boucle !
        } else if (data.status === 'error') {
          setStatus('error');
          clearInterval(interval); // Il y a une erreur, on arrête la boucle.
        }
        // Si c'est 'pending', on ne fait rien, ça refera un tour de boucle.

      } catch (error) {
        console.error("Erreur lors de la vérification du statut", error);
      }
    }, 2000); // On interroge ton backend toutes les 2 secondes

    // Nettoyage au démontage du composant
    return () => clearInterval(interval);
  }, [jobId, audioUrl]);

  console.log("Statut actuel :", status, "| URL de l'audio :", audioUrl);

  return (
    <section className="grid player-page-container">
      <div className="card player-header-card">
        <h2>Lecteur Podcast</h2>
        <p className="muted">Lecture directe depuis le backend gateway.</p>
      </div>

      <div className="card player-card">
        {title ? <h3 className="player-track-title">{title}</h3> : null}
        
        {/* Affichage conditionnel selon le statut */}
        {status === 'pending' && (
          <div className="loading-state">
            <p>⏳ Création de votre podcast en cours... Veuillez patienter.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <p>❌ Une erreur est survenue lors de la génération ou du chargement de l'audio.</p>
          </div>
        )}

        {status === 'completed' && audioUrl && (
          <AudioPlayer audioUrl={audioUrl} />
        )}
      </div>
    </section>
  );
}