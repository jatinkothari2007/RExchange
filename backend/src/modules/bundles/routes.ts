import { Router } from 'express';
import { bundleService } from './service';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';

export const bundleRouter = Router();

// GET /bundles
bundleRouter.get('/', async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : 'available';
    const bundles = await bundleService.getAllBundles(status);
    return res.status(200).json({ success: true, data: bundles });
  } catch (err) {
    return next(err);
  }
});

// GET /bundles/:id
bundleRouter.get('/:id', async (req, res, next) => {
  try {
    const bundle = await bundleService.getBundleById(req.params.id);
    return res.status(200).json({ success: true, data: bundle });
  } catch (err) {
    return next(err);
  }
});

// POST /bundles
bundleRouter.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const bundle = await bundleService.createBundle(req.user!.id, req.body);
    return res.status(201).json({ success: true, data: bundle });
  } catch (err) {
    return next(err);
  }
});

// POST /bundles/:id/exchange
bundleRouter.post('/:id/exchange', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const exchange = await bundleService.requestBundleExchange(
      req.params.id,
      req.user!.id,
      req.body.notes
    );
    return res.status(201).json({ success: true, data: exchange });
  } catch (err) {
    return next(err);
  }
});
