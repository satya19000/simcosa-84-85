"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeSpeech = exports.transcribeAudio = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
const elevenLabsApiKey = (0, params_1.defineSecret)('ELEVENLABS_API_KEY');
/**
 * Whisper STT — transcribes base64 audio to text.
 * Phase 2: placeholder schema. Phase 3: live OpenAI Whisper.
 */
exports.transcribeAudio = (0, https_1.onCall)({ secrets: [openaiApiKey], timeoutSeconds: 60, memory: '1GiB' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    if (!request.data.audioBase64) {
        throw new https_1.HttpsError('invalid-argument', 'Audio data is required.');
    }
    const apiKey = openaiApiKey.value();
    if (!apiKey) {
        throw new https_1.HttpsError('failed-precondition', 'OpenAI API key not configured.');
    }
    const buf = Buffer.from(request.data.audioBase64, 'base64');
    const mimeType = request.data.mimeType ?? 'audio/webm';
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const formData = new FormData();
    formData.append('file', new Blob([buf], { type: mimeType }), `audio.${ext}`);
    formData.append('model', 'whisper-1');
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new https_1.HttpsError('internal', `Whisper API error: ${errText.slice(0, 200)}`);
    }
    const json = await res.json();
    return { transcript: json.text ?? '', confidence: 1 };
});
/**
 * ElevenLabs TTS — synthesizes text to ARIA voice.
 * Phase 2: placeholder schema. Phase 3: live ElevenLabs API.
 */
exports.synthesizeSpeech = (0, https_1.onCall)({ secrets: [elevenLabsApiKey], timeoutSeconds: 30, memory: '512MiB' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required.');
    }
    if (!request.data.text) {
        throw new https_1.HttpsError('invalid-argument', 'Text is required.');
    }
    // TODO Phase 3:
    // const voiceId = request.data.voiceId ?? process.env.ELEVENLABS_VOICE_ID
    // const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    //   method: 'POST',
    //   headers: { 'xi-api-key': elevenLabsApiKey.value(), 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text: request.data.text, model_id: 'eleven_multilingual_v2' }),
    // })
    // const buf = Buffer.from(await res.arrayBuffer())
    // return { audioBase64: buf.toString('base64'), mimeType: 'audio/mpeg' }
    return { audioBase64: '', mimeType: 'audio/mpeg' };
});
//# sourceMappingURL=voice.js.map