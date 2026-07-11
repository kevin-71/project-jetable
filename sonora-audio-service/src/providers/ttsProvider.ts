import { EdgeTTS } from '@travisvn/edge-tts';

export async function synthesizeSpeech(articleText: string) {
  const provider = process.env.TTS_PROVIDER ?? 'edge-tts';

  if (provider === 'mock') {
    // Return a valid, minimal silent WAV file buffer that decodes properly in browsers
    const base64SilentWav = 'UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    return Buffer.from(base64SilentWav, 'base64');
  }

  // Use French neural voice by default, customizable via environment variable
  const voice = process.env.TTS_VOICE ?? 'fr-FR-DeniseNeural';
  const tts = new EdgeTTS(articleText, voice);
  
  const result = await tts.synthesize();
  const arrayBuffer = await result.audio.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
