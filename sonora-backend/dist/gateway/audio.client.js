import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
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
const loaded = grpc.loadPackageDefinition(packageDefinition);
const AudioService = loaded.sonora.audio.AudioService;
const client = new AudioService(`${env.audioServiceHost}:${env.audioServicePort}`, grpc.credentials.createInsecure());
function mapJobUrl(job) {
    if (job && job.audio_url && job.audio_url.startsWith('file://')) {
        const filename = path.basename(job.audio_url);
        const host = process.env.BACKEND_PUBLIC_URL ?? `http://localhost:${env.port}`;
        job.audio_url = `${host}/audio/${filename}`;
    }
    return job;
}
export function generateAudio(request) {
    return new Promise((resolve, reject) => {
        client.GenerateAudio(request, (error, response) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(response);
        });
    });
}
export function getJobStatus(jobId) {
    return new Promise((resolve, reject) => {
        client.GetJobStatus({ job_id: jobId }, (error, response) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(mapJobUrl(response));
        });
    });
}
export function listJobs(userId) {
    return new Promise((resolve, reject) => {
        client.ListJobs({ user_id: userId }, (error, response) => {
            if (error) {
                reject(error);
                return;
            }
            const jobs = response.jobs ?? [];
            resolve(jobs.map((j) => mapJobUrl(j)));
        });
    });
}
