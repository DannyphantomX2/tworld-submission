import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../config/index.js';
import { ContentItem } from '../models/ContentItem.js';
import { AiRun } from '../models/AiRun.js';
import { User } from '../models/User.js';
import { TokenTransaction } from '../models/TokenTransaction.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler } from '../utils/http.js';
import { runSummarize } from '../services/aiProvider.js';

const router = Router();

const summarizeSchema = z.object({
  tone: z.enum(['neutral', 'casual', 'formal']).default('neutral'),
  length: z.enum(['short', 'medium', 'long']).default('short'),
});

router.post('/:id/ai/summarize', requireAuth, validate(summarizeSchema), asyncHandler(async (req, res) => {
  const content = await ContentItem.findById(req.params.id);
  if (!content) throw new HttpError(404, 'Content not found');

  // Runs even on FAILED/TIMEOUT, so there's always a record of the attempt.
  const result = await runSummarize(content.body, req.body);

  const session = await mongoose.startSession();
  let tokensAwarded = 0;
  let totalTokenBalance;

  try {
    await session.withTransaction(async () => {
      const [run] = await AiRun.create(
        [{
          contentId: content._id,
          userId: req.user.id,
          promptVersion: result.promptVersion,
          status: result.status,
          output: result.output,
          fallbackUsed: result.fallbackUsed,
          error: result.error,
          latencyMs: result.latencyMs,
          tokensAwarded: 0, // patched below once we know the real amount
        }],
        { session }
      );

      if (result.status === 'SUCCESS') {
        tokensAwarded = config.ai.tokensPerRun;
        const user = await User.findByIdAndUpdate(
          req.user.id,
          { $inc: { tokenBalance: tokensAwarded } },
          { new: true, session }
        );
        if (!user) throw new HttpError(404, 'User not found');
        totalTokenBalance = user.tokenBalance;

        await TokenTransaction.create(
          [{
            userId: req.user.id,
            type: 'EARN',
            source: 'AI_USAGE',
            amount: tokensAwarded,
            balanceAfter: totalTokenBalance,
            referenceId: run._id,
          }],
          { session }
        );

        run.tokensAwarded = tokensAwarded;
        await run.save({ session });
      } else {
        const user = await User.findById(req.user.id, null, { session });
        totalTokenBalance = user?.tokenBalance ?? 0;
      }
    });
  } finally {
    await session.endSession();
  }

  res.json({
    status: result.status,
    output: result.output,
    fallbackUsed: result.fallbackUsed,
    latencyMs: result.latencyMs,
    tokensAwarded,
    totalTokenBalance,
  });
}));

export default router;
