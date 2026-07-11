import { Schema, model } from 'mongoose';

export type AudioJobStatus = 'pending' | 'processing' | 'success' | 'error';

export interface AudioJobDocument {
  articleId: string;
  userId: string;
  status: AudioJobStatus;
  articleText: string;
  audioUrl?: string;
  durationSeconds?: number;
  errorMessage?: string;
  providerUsed?: string;
  createdAt: Date;
  updatedAt: Date;
}

const audioJobSchema = new Schema<AudioJobDocument>(
  {
    articleId: { type: String, required: true },
    userId: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'processing', 'success', 'error'], default: 'pending' },
    articleText: { type: String, required: true },
    audioUrl: { type: String },
    durationSeconds: { type: Number },
    errorMessage: { type: String },
    providerUsed: { type: String },
  },
  { timestamps: true },
);

export const AudioJobModel = model<AudioJobDocument>('AudioJob', audioJobSchema);
