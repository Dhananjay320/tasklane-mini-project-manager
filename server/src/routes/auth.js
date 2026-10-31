import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';
import { signupSchema, loginSchema } from '../schemas.js';

export const authRouter = Router();

// Slows down password guessing: 20 attempts per 15 minutes per IP across login and signup.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (_req, res) =>
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes' } }),
});

function sendSession(res, status, user) {
  const token = signToken(user.id);
  setAuthCookie(res, token);
  res.status(status).json({ user, token });
}

authRouter.post('/signup', limiter, validate(signupSchema), async (req, res) => {
  const { name, email, password } = req.valid.body;
  if (await User.exists({ email })) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'This email is already registered', { email: 'This email is already registered' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ name, email, passwordHash });
    sendSession(res, 201, user);
  } catch (err) {
    // Two sign-ups racing past the check above: the unique index decides.
    if (err.code === 11000) throw new HttpError(409, 'EMAIL_TAKEN', 'This email is already registered', { email: 'This email is already registered' });
    throw err;
  }
});

authRouter.post('/login', limiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  // Same message for unknown email and wrong password, so the API doesn't reveal which emails exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Wrong email or password');
  }
  sendSession(res, 200, user);
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Please log in');
  res.json({ user });
});
