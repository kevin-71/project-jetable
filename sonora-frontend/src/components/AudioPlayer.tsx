interface AudioPlayerProps {
  audioUrl?: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  if (!audioUrl) {
    return <div className="audio-not-ready">Le fichier audio n’est pas encore prêt.</div>;
  }

  return (
    <div className="audio-player-wrapper">
      <div className="player-disc-animation">
        <div className="disc-dot"></div>
      </div>
      <audio controls src={audioUrl} autoPlay className="custom-html5-audio" />
    </div>
  );
}
