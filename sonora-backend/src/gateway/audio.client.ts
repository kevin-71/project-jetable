import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

type GenerateAudioRequest = {
  article_id: string;
  article_text: string;
  user_id: string;
};

type GenerateAudioResponse = {
  job_id: string;
  status: string;
};

type AudioJobSummary = {
  job_id: string;
  article_id: string;
  user_id: string;
  status: string;
  audio_url: string;
  duration_seconds: number;
  error_message: string;
  article_text: string;
};

type ListJobsResponse = {
  jobs: AudioJobSummary[];
};

type JobStatusResponse = {
  job_id: string;
  status: string;
  audio_url: string;
  duration_seconds: number;
  error_message: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const protoPath = path.resolve(__dirname, '../../proto/audio.proto');

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const loaded = grpc.loadPackageDefinition(packageDefinition) as any;
const AudioService = loaded.sonora.audio.AudioService;

const client = new AudioService(
  `${env.audioServiceHost}:${env.audioServicePort}`,
  grpc.credentials.createInsecure(),
);

function mapJobUrl<T extends { audio_url?: string }>(job: T): T {
  if (job && job.audio_url && job.audio_url.startsWith('file://')) {
    const filename = path.basename(job.audio_url);
    const host = process.env.BACKEND_PUBLIC_URL ?? `http://localhost:${env.port}`;
    job.audio_url = `${host}/audio/${filename}`;
  }
  return job;
}

export function generateAudio(request: GenerateAudioRequest) {
  return new Promise<GenerateAudioResponse>((resolve, reject) => {
    client.GenerateAudio(request, (error: Error | null, response: GenerateAudioResponse) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}

export function getJobStatus(jobId: string) {
  return new Promise<JobStatusResponse>((resolve, reject) => {
    client.GetJobStatus({ job_id: jobId }, (error: Error | null, response: JobStatusResponse) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(mapJobUrl(response));
    });
  });
}

export function listJobs(userId: string) {
  return new Promise<AudioJobSummary[]>((resolve, reject) => {
    client.ListJobs({ user_id: userId }, (error: Error | null, response: ListJobsResponse) => {
      if (error) {
        reject(error);
        return;
      }
      const jobs = response.jobs ?? [];
      resolve(jobs.map((j) => mapJobUrl(j)));
    });
  });
}

export function deleteJob(jobId: string) {
  return new Promise<{ job_id: string; success: boolean }>((resolve, reject) => {
    client.DeleteJob({ job_id: jobId }, (error: Error | null, response: { job_id: string; success: boolean }) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(response);
    });
  });
}
