import { generateAudio } from './handlers/generateAudio.js';
import { getJobStatus } from './handlers/getJobStatus.js';
import { listJobs } from './handlers/listJobs.js';
export function createAudioService() {
    return {
        GenerateAudio: (call, callback) => {
            generateAudio(call)
                .then((result) => callback(null, result))
                .catch((error) => callback(error, null));
        },
        GetJobStatus: (call, callback) => {
            getJobStatus(call)
                .then((result) => callback(null, result))
                .catch((error) => callback(error, null));
        },
        ListJobs: (call, callback) => {
            listJobs(call)
                .then((result) => callback(null, result))
                .catch((error) => callback(error, null));
        },
    };
}
