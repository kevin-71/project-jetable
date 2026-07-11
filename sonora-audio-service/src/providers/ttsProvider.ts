export async function synthesizeSpeech(articleText: string) {
  // Return a valid, minimal silent WAV file buffer that decodes properly in browsers
  const base64SilentWav = 'UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  return Buffer.from(base64SilentWav, 'base64');
}
