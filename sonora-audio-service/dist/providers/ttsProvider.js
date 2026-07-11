export async function synthesizeSpeech(articleText) {
    return Buffer.from(`Mock audio generated from: ${articleText.slice(0, 120)}`);
}
