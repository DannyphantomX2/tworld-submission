import { Router } from 'express';
import { z } from 'zod';
import { ContentItem } from '../models/ContentItem.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError, asyncHandler } from '../utils/http.js';

const router = Router();

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  tags: z.array(z.string().trim().toLowerCase()).default([]),
});

// Query params arrive as strings, so this coerces page/limit to numbers
// and gives them sane bounds before the handler ever sees them.
const listSchema = z.object({
  tag: z.string().trim().toLowerCase().optional(),
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

router.post('/', requireAuth, validate(createSchema), asyncHandler(async (req, res) => {
  const item = await ContentItem.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ content: item });
}));

router.get('/', requireAuth, validate(listSchema, 'query'), asyncHandler(async (req, res) => {
  const { tag, q, page, limit } = req.query;
  const filter = {};
  if (tag) filter.tags = tag;
  if (q) filter.$text = { $search: q };

  const [items, total] = await Promise.all([
    ContentItem.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContentItem.countDocuments(filter),
  ]);

  res.json({ content: items, page, limit, total, totalPages: Math.ceil(total / limit) });
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  if (!objectId.safeParse(req.params.id).success) throw new HttpError(400, 'Invalid content id');
  const item = await ContentItem.findById(req.params.id);
  if (!item) throw new HttpError(404, 'Content not found');
  res.json({ content: item });
}));

export default router;
