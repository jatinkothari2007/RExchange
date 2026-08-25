import { Router } from 'express';
import { reputationService } from './service';
import { validate } from '../../middleware/validate';
import { rateExchangeSchema } from './validation';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

export const reputationRouter = Router();

// POST /exchanges/:id/rate
reputationRouter.post(
  '/exchanges/:id/rate',
  authenticate,
  validate(rateExchangeSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const rating = await reputationService.rateExchange(req.params.id, req.user!.id, req.body);
      return res.status(201).json({ success: true, data: rating });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /users/:id/reputation
reputationRouter.get('/users/:id/reputation', optionalAuth, async (req, res, next) => {
  try {
    const rep = await reputationService.getUserReputation(req.params.id);
    return res.status(200).json({ success: true, data: rep });
  } catch (err) {
    return next(err);
  }
});
