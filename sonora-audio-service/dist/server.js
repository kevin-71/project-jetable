import dotenv from 'dotenv';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongo } from './db/mongoose.js';
import { createAudioService } from './grpc/audio.service.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const protoPath = path.resolve(__dirname, '../proto/audio.proto');
async function main() {
    await connectMongo();
    const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    });
    const loaded = grpc.loadPackageDefinition(packageDefinition);
    const audioPackage = loaded.sonora.audio;
    const server = new grpc.Server();
    server.addService(audioPackage.AudioService.service, createAudioService());
    const port = Number(process.env.AUDIO_SERVICE_PORT ?? 50051);
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, boundPort) => {
        if (error) {
            throw error;
        }
        server.start();
        console.log(`sonora-audio-service listening on ${boundPort}`);
    });
}
void main();
