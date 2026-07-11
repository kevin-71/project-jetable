import { AudioJobModel } from '../models/AudioJob.model.js';
import { synthesizeSpeech } from '../providers/ttsProvider.js';
import { storeAudio } from '../storage/audioStorage.js';

export async function processAudioJob(jobId: string) {
  const job = await AudioJobModel.findById(jobId);
  if (!job) {
    return;
  }

  try {
    job.status = 'processing';
    await job.save();

    const audio = await synthesizeSpeech(job.articleText);
    const filePath = await storeAudio(jobId, audio);

    job.status = 'success';
    job.audioUrl = `file://${filePath}`;
    job.durationSeconds = Math.max(1, Math.ceil(job.articleText.length / 120));
    job.providerUsed = process.env.TTS_PROVIDER ?? 'mock';
    await job.save();
  } catch (error) {
    job.status = 'error';
    job.errorMessage = error instanceof Error ? error.message : 'unknown_error';
    await job.save();
  }
}
