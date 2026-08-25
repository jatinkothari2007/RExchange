import { Router } from 'express';
import { chatService } from './service';
import { validate } from '../../middleware/validate';
import { sendMessageSchema, respondProposalSchema } from './validation';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';

export const chatRouter = Router({ mergeParams: true });

// GET /exchanges/:id/messages
chatRouter.get('/:id/messages', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const messages = await chatService.getMessages(req.params.id, req.user!.id);
    return res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    return next(err);
  }
});

// POST /exchanges/:id/messages
chatRouter.post(
  '/:id/messages',
  authenticate,
  validate(sendMessageSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const message = await chatService.sendMessage(req.params.id, req.user!.id, req.body);
      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /exchanges/:id/messages/:msgId/respond
chatRouter.patch(
  '/:id/messages/:msgId/respond',
  authenticate,
  validate(respondProposalSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await chatService.respondToProposal(
        req.params.id,
        req.params.msgId,
        req.user!.id,
        req.body
      );
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);
