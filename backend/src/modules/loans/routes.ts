import { Router } from 'express';
import { loanService } from './service';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';

export const loanRouter = Router();

// POST /loans/request
loanRouter.post('/request', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, error: { message: 'amount is required' } });
    }
    const result = await loanService.requestLoan(req.user!.id, amount);
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

// GET /loans/me (also mounted on /users/me/loans)
loanRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const loans = await loanService.getUserLoans(req.user!.id);
    const active = await loanService.getActiveLoan(req.user!.id);
    return res.status(200).json({ success: true, data: { loans, active } });
  } catch (err) {
    return next(err);
  }
});
