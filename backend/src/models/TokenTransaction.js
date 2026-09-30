import mongoose from 'mongoose';

const txSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['EARN', 'CONVERT', 'WITHDRAW'], required: true },
    source: { type: String, enum: ['AI_USAGE', 'MANUAL', 'SYSTEM'], required: true },
    // Signed: positive for EARN, negative for CONVERT. WITHDRAW moves no tokens, so it is 0.
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    // ai_runs._id for EARN, contract_conversions._id for CONVERT / WITHDRAW
    referenceId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

txSchema.index({ userId: 1, createdAt: -1 });

// One reward per AI run, even if the request is retried.
txSchema.index(
  { type: 1, source: 1, referenceId: 1 },
  { unique: true, partialFilterExpression: { type: 'EARN', source: 'AI_USAGE' } }
);

// The ledger is append-only. Block anything that would rewrite history.
const blocked = [
  'updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne',
  'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndReplace',
];
txSchema.pre(blocked, function () {
  throw new Error('token_transactions is append-only');
});
txSchema.pre('save', function (next) {
  if (!this.isNew) return next(new Error('token_transactions is append-only'));
  next();
});

export const TokenTransaction = mongoose.model('TokenTransaction', txSchema, 'token_transactions');
