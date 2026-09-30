import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/http.js';

const router = Router();

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  // bcrypt only reads the first 72 bytes, so cap it there
  password: z.string().min(8).max(72),
});

const signToken = (user) =>
  jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: String(user._id),
    expiresIn: config.jwtExpiresIn,
  });

const publicUser = (u) => ({ id: u._id, email: u.email, role: u.role, tokenBalance: u.tokenBalance });

router.post('/register', validate(credentials), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ email, passwordHash });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Email already registered');
    throw err;
  }
}));

router.post('/login', validate(credentials), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  // Same message either way so it doesn't reveal which emails exist
  if (!ok) throw new HttpError(401, 'Invalid email or password');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(404, 'User not found');
  res.json({ user: publicUser(user) });
}));

export default router;
