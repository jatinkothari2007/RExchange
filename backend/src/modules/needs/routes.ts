import { Router } from 'express';
import { needService } from './service';
import { validate } from '../../middleware/validate';
import { createNeedSchema, fulfillNeedSchema } from './validation';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../../middleware/auth';

export const needRouter = Router();

// GET /needs?sort=urgency|latest&status=open
needRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const sortBy = (req.query.sort as 'urgency' | 'latest') || 'urgency';
    const status = (req.query.status as string) || 'open';
    const needs = await needService.getNeeds(sortBy, status);
    return res.status(200).json({ success: true, count: needs.length, data: needs });
  } catch (err) {
    return next(err);
  }
});

// GET /needs/:id
needRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const need = await needService.getNeedById(req.params.id);
    return res.status(200).json({ success: true, data: need });
  } catch (err) {
    return next(err);
  }
});

// POST /needs
needRouter.post('/', authenticate, validate(createNeedSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const created = await needService.createNeed(req.user!.id, req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  }
});

// POST /needs/:id/fulfill
needRouter.post('/:id/fulfill', authenticate, validate(fulfillNeedSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await needService.fulfillNeed(req.params.id, req.user!.id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});
