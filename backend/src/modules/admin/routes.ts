import { Router } from 'express';
import { adminService } from './service';
import { validate } from '../../middleware/validate';
import { resolveDisputeSchema, banUserSchema } from './validation';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../../middleware/auth';

export const adminRouter = Router();

// Require auth + admin role on all admin routes
adminRouter.use(authenticate, requireAdmin);

// GET /admin/disputes
adminRouter.get('/disputes', async (req: AuthenticatedRequest, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const disputes = await adminService.getDisputes(status);
    return res.status(200).json({ success: true, count: disputes.length, data: disputes });
  } catch (err) {
    return next(err);
  }
});

// PATCH /admin/disputes/:id
adminRouter.patch(
  '/disputes/:id',
  validate(resolveDisputeSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const resolved = await adminService.resolveDispute(req.params.id, req.user!.id, req.body);
      return res.status(200).json({ success: true, data: resolved });
    } catch (err) {
      return next(err);
    }
  }
);

// GET /admin/flagged-listings
adminRouter.get('/flagged-listings', async (req: AuthenticatedRequest, res, next) => {
  try {
    const flags = await adminService.getFlaggedListings();
    return res.status(200).json({ success: true, count: flags.length, data: flags });
  } catch (err) {
    return next(err);
  }
});

// PATCH /admin/users/:id/ban
adminRouter.patch('/users/:id/ban', validate(banUserSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await adminService.banUser(req.params.id, req.user!.id, req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});
