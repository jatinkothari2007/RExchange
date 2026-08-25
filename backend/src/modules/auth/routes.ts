import { Router } from 'express';
import { authService } from './service';
import { userRepo } from '../../data/repository';
import { User } from '../../types';
import { validate } from '../../middleware/validate';
import {
  signupSchema,
  verifyOtpSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
} from './validation';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';

export const authRouter = Router();
export const userRouter = Router();

// ==================== AUTH ROUTES ====================
authRouter.post('/signup', authRateLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/login', authRateLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.requestLoginOtp(req.body.email);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), async (req, res, next) => {
  try {
    const result = await authService.verifyOtp(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

authRouter.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refreshToken);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

// ==================== USER PROFILE ROUTES ====================
userRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await authService.getMe(req.user!.id);
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
});

userRouter.patch('/me', authenticate, validate(updateProfileSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const updated = await authService.updateMe(req.user!.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
});

userRouter.get('/juniors', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const currentUser = await authService.getMe(req.user!.id);
    const allUsers = await userRepo.getAll();
    const juniors = allUsers.filter((u) => u.id !== currentUser.id && u.year < currentUser.year);
    return res.status(200).json({ success: true, data: juniors });
  } catch (err) {
    return next(err);
  }
});

userRouter.post('/me/will', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { recipient_id } = req.body;
    if (!recipient_id) {
      return res.status(400).json({ success: false, error: { message: 'recipient_id is required' } });
    }
    const result = await authService.setKarmaWill(req.user!.id, recipient_id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

userRouter.post('/me/will/execute', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await authService.executeKarmaWill(req.user!.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});
