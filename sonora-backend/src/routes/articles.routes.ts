import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { generateAudio, getJobStatus, listJobs, deleteJob } from '../gateway/audio.client.js';
import { playlistProxy } from '../gateway/playlist.proxy.js';

export const articlesRouter = Router();

articlesRouter.post('/articles', requireAuth, async (request, response, next) => {
  try {
    const { articleUrl, articleText } = request.body as { articleUrl?: string; articleText?: string };
    const user = request.user as { sub: string };
    const job = await generateAudio({
      article_id: articleUrl ?? crypto.randomUUID(),
      article_text: articleText ?? '',
      user_id: user.sub,
    });

    response.status(202).json(job);
  } catch (error) {
    next(error);
  }
});

articlesRouter.get('/articles', requireAuth, async (request, response, next) => {
  try {
    const user = request.user as { sub: string };
    const jobs = await listJobs(user.sub);
    response.json(jobs);
  } catch (error) {
    next(error);
  }
});

articlesRouter.get('/articles/:jobId/status', requireAuth, async (request, response, next) => {
  try {
    const job = await getJobStatus(request.params.jobId as string);
    response.json(job);
  } catch (error) {
    next(error);
  }
});

articlesRouter.delete('/articles/:jobId', requireAuth, async (request, response, next) => {
  try {
    const jobId = request.params.jobId as string;
    // Clean up any references in user's playlists
    await playlistProxy.deletePlaylistItemsByAudioJobId(jobId);
    // Delete the audio job from audio service
    const result = await deleteJob(jobId);
    response.json(result);
  } catch (error) {
    next(error);
  }
});
