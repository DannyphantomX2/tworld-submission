import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Not in the brief's field list, but login needs it. Never returned by the API.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    // Cached total. The ledger is the source of truth, this is for fast reads.
    tokenBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const User = mongoose.model('User', userSchema);
