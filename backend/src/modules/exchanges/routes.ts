import { Router } from 'express';
import { exchangeService } from './service';
import { validate } from '../../middleware/validate';
import {
  createExchangeSchema,
  cancelExchangeSchema,
  disputeExchangeSchema,
} from './validation';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';

export const exchangeRouter = Router();

// GET /exchanges - list exchanges for logged-in user
exchangeRouter.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const list = await exchangeService.getMyExchanges(req.user!.id);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    return next(err);
  }
});

// GET /exchanges/:id
exchangeRouter.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const detail = await exchangeService.getExchangeById(req.params.id, req.user!.id);
    return res.status(200).json({ success: true, data: detail });
  } catch (err) {
    return next(err);
  }
});

// POST /exchanges - request exchange
exchangeRouter.post('/', authenticate, validate(createExchangeSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const created = await exchangeService.createExchange(req.user!.id, req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  }
});

// PATCH /exchanges/:id/accept - listing owner accepts
exchangeRouter.patch('/:id/accept', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const accepted = await exchangeService.acceptExchange(req.params.id, req.user!.id);
    return res.status(200).json({ success: true, data: accepted });
  } catch (err) {
    return next(err);
  }
});

// PATCH /exchanges/:id/confirm-handoff - mutual confirmation
exchangeRouter.patch('/:id/confirm-handoff', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await exchangeService.confirmHandoff(req.params.id, req.user!.id);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

// POST /exchanges/:id/handoff-scan - instant QR verification
exchangeRouter.post('/:id/handoff-scan', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const code = req.body.code;
    if (!code) {
      return res.status(400).json({ success: false, error: { message: 'handoff code is required for QR scan' } });
    }
    const result = await exchangeService.scanHandoff(req.params.id, req.user!.id, code);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

// PATCH /exchanges/:id/cancel
exchangeRouter.patch('/:id/cancel', authenticate, validate(cancelExchangeSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const cancelled = await exchangeService.cancelExchange(req.params.id, req.user!.id, req.body.reason);
    return res.status(200).json({ success: true, data: cancelled });
  } catch (err) {
    return next(err);
  }
});

// PATCH /exchanges/:id/dispute
exchangeRouter.patch('/:id/dispute', authenticate, validate(disputeExchangeSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const disputed = await exchangeService.disputeExchange(req.params.id, req.user!.id, req.body.reason);
    return res.status(200).json({ success: true, data: disputed });
  } catch (err) {
    return next(err);
  }
});
