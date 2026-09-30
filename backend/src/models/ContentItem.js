import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true },
    tags: { type: [String], default: [], index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Powers the ?q= search on GET /content
contentSchema.index({ title: 'text', body: 'text' });
// Newest-first listing
contentSchema.index({ createdAt: -1 });

export const ContentItem = mongoose.model('ContentItem', contentSchema, 'content_items');
