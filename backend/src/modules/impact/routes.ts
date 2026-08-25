import { Router } from 'express';
import { impactService } from './service';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

export const impactRouter = Router();

// GET /impact/me - personal impact metrics
impactRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const impact = await impactService.getPersonalImpact(req.user!.id);
    return res.status(200).json({ success: true, data: impact });
  } catch (err) {
    return next(err);
  }
});

// GET /impact/campus - live aggregate campus impact metrics
impactRouter.get('/campus', optionalAuth, async (req, res, next) => {
  try {
    const impact = await impactService.getCampusImpact();
    return res.status(200).json({ success: true, data: impact });
  } catch (err) {
    return next(err);
  }
});
