import { AudioJobModel } from '../../models/AudioJob.model.js';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

export async function deleteJob(call: { request: { job_id: string } }) {
  const { job_id } = call.request;
  const job = await AudioJobModel.findById(job_id);
  if (!job) {
    return {
      job_id,
      success: false,
    };
  }

  // Delete physical file if it exists locally
  if (job.audioUrl) {
    let filePath: string | null = null;
    if (job.audioUrl.startsWith('file://')) {
      filePath = job.audioUrl.replace('file://', '');
    } else {
      // Check if it's just a file path
      filePath = job.audioUrl;
    }

    if (filePath) {
      try {
        await unlink(filePath);
      } catch (err) {
        // If it failed, it might be because the file is not there or permissions
        console.error(`Failed to delete audio file at ${filePath}:`, err);
      }
    }
  }

  await AudioJobModel.findByIdAndDelete(job_id);

  return {
    job_id,
    success: true,
  };
}
