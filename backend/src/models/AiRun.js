import mongoose from 'mongoose';

const aiRunSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    promptVersion: { type: String, required: true },
    // TIMEOUT is kept separate from FAILED so it's easy to spot in the admin UI
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'TIMEOUT'], required: true },
    output: { type: String, default: '' },
    fallbackUsed: { type: Boolean, default: false },
    error: { type: String },
    latencyMs: { type: Number, required: true },
    tokensAwarded: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiRunSchema.index({ userId: 1, createdAt: -1 });

export const AiRun = mongoose.model('AiRun', aiRunSchema, 'ai_runs');
