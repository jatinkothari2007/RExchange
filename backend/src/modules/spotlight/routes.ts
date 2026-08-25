import { Router } from 'express';
import { spotlightService } from './service';
import { optionalAuth } from '../../middleware/auth';

export const spotlightRouter = Router();

// GET /spotlight/cross-department
spotlightRouter.get('/cross-department', optionalAuth, async (req, res, next) => {
  try {
    const items = await spotlightService.getCrossDepartmentSpotlight();
    return res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    return next(err);
  }
});
