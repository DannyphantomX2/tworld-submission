import mongoose from 'mongoose';

const conversionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fromToken: { type: String, default: 'TWORLD_TOKEN' },
    toAsset: { type: String, enum: ['MOCK_USDT', 'MOCK_ETH'], required: true },
    amount: { type: Number, required: true, min: 1 },          // tokens spent
    exchangeRate: { type: Number, required: true },            // tokens per 1 unit of asset
    convertedAmount: { type: Number, required: true },         // asset units received
    txHashMock: { type: String, required: true, unique: true },
    withdrawTxHashMock: { type: String },
    // Lifecycle: CONVERTED -> WITHDRAWN
    status: { type: String, enum: ['CONVERTED', 'WITHDRAWN'], default: 'CONVERTED' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ContractConversion = mongoose.model('ContractConversion', conversionSchema, 'contract_conversions');
