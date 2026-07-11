import type { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';
import { generateAudio } from './handlers/generateAudio.js';
import { getJobStatus } from './handlers/getJobStatus.js';
import { listJobs } from './handlers/listJobs.js';

export function createAudioService() {
  return {
    GenerateAudio: (
      call: ServerUnaryCall<{ article_id: string; article_text: string; user_id: string }, unknown>,
      callback: sendUnaryData<unknown>,
    ) => {
      generateAudio(call)
        .then((result) => callback(null, result))
        .catch((error) => callback(error as Error, null));
    },
    GetJobStatus: (
      call: ServerUnaryCall<{ job_id: string }, unknown>,
      callback: sendUnaryData<unknown>,
    ) => {
      getJobStatus(call)
        .then((result) => callback(null, result))
        .catch((error) => callback(error as Error, null));
    },
    ListJobs: (
      call: ServerUnaryCall<{ user_id: string }, unknown>,
      callback: sendUnaryData<unknown>,
    ) => {
      listJobs(call)
        .then((result) => callback(null, result))
        .catch((error) => callback(error as Error, null));
    },
  };
}
