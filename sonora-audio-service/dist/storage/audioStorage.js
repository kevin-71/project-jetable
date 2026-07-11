import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
export async function storeAudio(jobId, audio) {
    const baseDir = process.env.AUDIO_STORAGE_DIR ?? '/tmp/sonora-audio';
    await mkdir(baseDir, { recursive: true });
    const filePath = path.join(baseDir, `${jobId}.mp3`);
    await writeFile(filePath, audio);
    return filePath;
}
