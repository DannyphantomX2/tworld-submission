import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Short-term location (Cloudinary). Always present after upload.
    cloudinary: {
      publicId: { type: String, required: true },
      url: { type: String, required: true },
    },

    // Long-term location (S3). Only present once promoted.
    s3: {
      key: String,
      url: String,
    },

    status: { type: String, enum: ['UPLOADED', 'PROMOTED'], default: 'UPLOADED' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Media = mongoose.model('Media', mediaSchema, 'media');
