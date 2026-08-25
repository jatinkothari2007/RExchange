import { Router } from 'express';
import { z } from 'zod';
import { matchService } from './service';
import { validate } from '../../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';

export const matchRouter = Router();

const feedbackSchema = z.object({
  body: z.object({
    listing_id: z.string().min(1),
    thumbs_up: z.boolean(),
    notes: z.string().optional(),
  }),
});

// GET /match/suggestions
matchRouter.get('/suggestions', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const suggestions = await matchService.getSuggestionsForUser(req.user!.id, limit);
    return res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
  } catch (err) {
    return next(err);
  }
});

// POST /match/feedback
matchRouter.post(
  '/feedback',
  authenticate,
  validate(feedbackSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await matchService.recordFeedback(req.user!.id, req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);
