import { Schema, model } from 'mongoose';
const audioJobSchema = new Schema({
    articleId: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'processing', 'success', 'error'], default: 'pending' },
    articleText: { type: String, required: true },
    audioUrl: { type: String },
    durationSeconds: { type: Number },
    errorMessage: { type: String },
    providerUsed: { type: String },
}, { timestamps: true });
export const AudioJobModel = model('AudioJob', audioJobSchema);
