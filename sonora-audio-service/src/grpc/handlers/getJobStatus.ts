import { AudioJobModel } from '../../models/AudioJob.model.js';

export async function getJobStatus(call: { request: { job_id: string } }) {
  const job = await AudioJobModel.findById(call.request.job_id);
  if (!job) {
    return {
      job_id: call.request.job_id,
      status: 'error',
      audio_url: '',
      duration_seconds: 0,
      error_message: 'job_not_found',
    };
  }

  return {
    job_id: job.id,
    status: job.status,
    audio_url: job.audioUrl ?? '',
    duration_seconds: job.durationSeconds ?? 0,
    error_message: job.errorMessage ?? '',
  };
}
