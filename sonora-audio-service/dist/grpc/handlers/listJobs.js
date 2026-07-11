import { AudioJobModel } from '../../models/AudioJob.model.js';
export async function listJobs(call) {
    const jobs = await AudioJobModel.find({ userId: call.request.user_id }).sort({ createdAt: -1 });
    return {
        jobs: jobs.map((job) => ({
            job_id: job.id,
            article_id: job.articleId,
            user_id: job.userId,
            status: job.status,
            audio_url: job.audioUrl ?? '',
            duration_seconds: job.durationSeconds ?? 0,
            error_message: job.errorMessage ?? '',
            article_text: job.articleText ?? '',
        })),
    };
}
