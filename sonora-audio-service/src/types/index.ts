export interface AudioJobDTO {
  id: string;
  articleId: string;
  userId: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  audioUrl?: string;
  durationSeconds?: number;
  errorMessage?: string;
  providerUsed?: string;
}
