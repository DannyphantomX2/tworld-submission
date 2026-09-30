import { Router } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { TokenTransaction } from '../models/TokenTransaction.js';
import { ContractConversion } from '../models/ContractConversion.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler } from '../utils/http.js';

const router = Router();

// A believable-looking but clearly-mock tx hash, matching the brief's "0xabc123..." style.
const mockTxHash = () => '0x' + crypto.randomBytes(16).toString('hex');

router.get('/balance', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ tokenBalance: user.tokenBalance });
}));

const historySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get('/history', requireAuth, validate(historySchema, 'query'), asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const filter = { userId: req.user.id };
  const [transactions, total] = await Promise.all([
    TokenTransaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    TokenTransaction.countDocuments(filter),
  ]);
  res.json({ transactions, page, limit, total, totalPages: Math.ceil(total / limit) });
}));

const convertSchema = z.object({
  toAsset: z.enum(['MOCK_USDT', 'MOCK_ETH']),
  amount: z.number().int().positive(),
});

router.post('/convert', requireAuth, validate(convertSchema), asyncHandler(async (req, res) => {
  const { toAsset, amount } = req.body;
  const rate = config.rates[toAsset];
  const convertedAmount = amount / rate.tokensPerUnit;
  const txHashMock = mockTxHash();

  const session = await mongoose.startSession();
  let balanceAfter;
  let conversion;

  try {
    await session.withTransaction(async () => {
      // Atomic guard: only succeeds if the balance can actually cover the spend.
      const user = await User.findOneAndUpdate(
        { _id: req.user.id, tokenBalance: { $gte: amount } },
        { $inc: { tokenBalance: -amount } },
        { new: true, session }
      );
      if (!user) throw new HttpError(400, 'Insufficient token balance');
      balanceAfter = user.tokenBalance;

      const [created] = await ContractConversion.create(
        [{ userId: req.user.id, toAsset, amount, exchangeRate: rate.tokensPerUnit, convertedAmount, txHashMock }],
        { session }
      );
      conversion = created;

      await TokenTransaction.create(
        [{
          userId: req.user.id,
          type: 'CONVERT',
          source: 'MANUAL',
          amount: -amount,
          balanceAfter,
          referenceId: conversion._id,
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    txHashMock,
    convertedAmount: `${convertedAmount} ${toAsset}`,
    totalTokenBalance: balanceAfter,
    conversionId: conversion._id,
  });
}));

const withdrawSchema = z.object({
  conversionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversion id'),
});

router.post('/withdraw', requireAuth, validate(withdrawSchema), asyncHandler(async (req, res) => {
  const conversion = await ContractConversion.findOne({ _id: req.body.conversionId, userId: req.user.id });
  if (!conversion) throw new HttpError(404, 'Conversion not found');
  if (conversion.status === 'WITHDRAWN') throw new HttpError(409, 'Already withdrawn');

  const withdrawTxHashMock = mockTxHash();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      conversion.status = 'WITHDRAWN';
      conversion.withdrawTxHashMock = withdrawTxHashMock;
      await conversion.save({ session });

      // amount 0: no tokens move here, this just records the lifecycle event on the ledger.
      await TokenTransaction.create(
        [{
          userId: req.user.id,
          type: 'WITHDRAW',
          source: 'MANUAL',
          amount: 0,
          balanceAfter: (await User.findById(req.user.id, null, { session })).tokenBalance,
          referenceId: conversion._id,
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  res.json({ status: 'SUCCESS', network: 'Ethereum', txHashMock: withdrawTxHashMock });
}));

export default router;
