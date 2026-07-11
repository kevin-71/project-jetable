import { AudioJobModel } from '../../models/AudioJob.model.js';
import { processAudioJob } from '../../workers/ttsWorker.js';

export async function generateAudio(call: { request: { article_id: string; article_text: string; user_id: string } }) {
  const job = await AudioJobModel.create({
    articleId: call.request.article_id,
    articleText: call.request.article_text,
    userId: call.request.user_id,
    status: 'pending',
  });

  void processAudioJob(job.id);

  return {
    job_id: job.id,
    status: 'pending',
  };
}
