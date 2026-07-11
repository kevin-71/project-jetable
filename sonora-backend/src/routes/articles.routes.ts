import { Router } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { generateAudio, getJobStatus, listJobs } from '../gateway/audio.client.js';

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
