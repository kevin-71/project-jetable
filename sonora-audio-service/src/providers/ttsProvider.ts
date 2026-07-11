import { spawn } from 'node:child_process';
import { readFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export async function synthesizeSpeech(articleText: string): Promise<Buffer> {
  const provider = process.env.TTS_PROVIDER ?? 'edge-tts';

  if (provider === 'mock') {
    // Return a valid, minimal silent WAV file buffer that decodes properly in browsers
    const base64SilentWav = 'UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    return Buffer.from(base64SilentWav, 'base64');
  }

  // Use Python edge-tts CLI — outputs MP3, more reliably maintained than Node wrappers
  const voice = process.env.TTS_VOICE ?? 'fr-FR-DeniseNeural';
  const storageDir = process.env.AUDIO_STORAGE_DIR ?? '/tmp/sonora-audio';
  await mkdir(storageDir, { recursive: true });

  const tmpFile = path.join(storageDir, `tts-tmp-${randomUUID()}.mp3`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('edge-tts', [
      '--voice', voice,
      '--text', articleText,
      '--write-media', tmpFile,
    ]);

    let stderr = '';
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`edge-tts exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn edge-tts: ${err.message}`));
    });
  });

  const audio = await readFile(tmpFile);
  await unlink(tmpFile).catch(() => {}); // clean up temp file
  return audio;
}

