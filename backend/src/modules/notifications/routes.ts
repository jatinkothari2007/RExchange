import { Router } from 'express';
import { notificationService } from './service';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';

export const notificationRouter = Router();

// GET /notifications
notificationRouter.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const list = await notificationService.getUserNotifications(req.user!.id);
    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    return next(err);
  }
});

// PATCH /notifications/:id/read
notificationRouter.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const updated = await notificationService.markAsRead(req.params.id, req.user!.id);
    return res.status(200).json({ success: true, data: { updated } });
  } catch (err) {
    return next(err);
  }
});

// PATCH /notifications/read-all
notificationRouter.patch('/read-all', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return next(err);
  }
});
