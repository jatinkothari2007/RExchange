import { Router } from 'express';
import { gamificationService } from './service';
import { optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

export const gamificationRouter = Router();

// GET /leaderboard?scope=week|alltime&groupBy=department|hostel
gamificationRouter.get('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const scope = (req.query.scope as 'week' | 'alltime') || 'alltime';
    const groupBy = req.query.groupBy as 'department' | 'hostel' | undefined;
    const currentUserId = req.user?.id;

    const result = await gamificationService.getLeaderboard(scope, groupBy, currentUserId);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});
