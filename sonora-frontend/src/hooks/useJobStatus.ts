import { useEffect, useState } from 'react';
import { request } from '../api/client';
import type { ApiJobStatus } from '../types';

export function useJobStatus(jobId: string, initialStatus: ApiJobStatus['status']) {
  const [status, setStatus] = useState(initialStatus);
  const [audioUrl, setAudioUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (status !== 'processing' && status !== 'pending') {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const job = await request<ApiJobStatus>(`/articles/${jobId}/status`);
        setStatus(job.status);
        setAudioUrl(job.audio_url);
        setErrorMessage(job.error_message);
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [jobId, status]);

  return { status, audioUrl, errorMessage };
}
