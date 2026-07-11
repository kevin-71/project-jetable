export interface ApiAudioJob {
  job_id: string;
  article_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  audio_url: string;
  duration_seconds: number;
  error_message: string;
  article_text: string;
}

export interface ApiJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  audio_url: string;
  duration_seconds: number;
  error_message: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  audioJobId: string;
  position: number;
  title: string | null;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  items: PlaylistItem[];
  createdAt: string;
}
