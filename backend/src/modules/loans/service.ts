import { loanRepo, userRepo, exchangeRepo, transactionRepo, notificationRepo } from '../../data/repository';
import { KarmaLoan, KarmaTransaction } from '../../types';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export const MAX_LOAN_CAP = 15;

export class LoanService {
  async requestLoan(userId: string, amount: number): Promise<{ loan: KarmaLoan; newBalance: number }> {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const loanAmount = Number(amount);
    if (!loanAmount || loanAmount <= 0) {
      throw new BadRequestError('Loan amount must be greater than 0');
    }

    if (loanAmount > MAX_LOAN_CAP) {
      throw new BadRequestError(`Emergency loan cannot exceed ${MAX_LOAN_CAP} Karma Points.`);
    }

    // 1. Check for existing active loan
    const activeLoan = await loanRepo.getActiveLoanByUser(userId);
    if (activeLoan) {
      throw new BadRequestError(`You already have an active emergency loan of ${activeLoan.amount} Karma. Complete a give exchange to auto-repay before borrowing again.`);
    }

    // Anti-abuse check: In production, must have at least 1 completed exchange as a GIVER
    // Skipped in development/test environments to allow bootstrapping
    if (process.env.NODE_ENV === 'production') {
      const userExchanges = await exchangeRepo.findByUser(userId);
      const hasGivenBefore = userExchanges.some(
        (e) => e.giver_id === userId && (e.status || '').toUpperCase() === 'COMPLETED'
      );
      if (!hasGivenBefore) {
        throw new BadRequestError(
          'Emergency Loans require at least 1 prior completed exchange as a Giver to establish campus trust. Share a note or item first!'
        );
      }
    }

    const id = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const loan: KarmaLoan = {
      id,
      user_id: userId,
      amount: loanAmount,
      status: 'active',
      created_at: now,
    };

    const createdLoan = await loanRepo.create(loan);

    // Disburse Karma immediately to user balance
    const newBalance = await userRepo.updateKarma(userId, loanAmount);

    // Ledger transaction
    await transactionRepo.create({
      id: `txn_loan_disburse_${Date.now()}`,
      from_user_id: null,
      to_user_id: userId,
      amount: loanAmount,
      type: 'LOAN_DISBURSEMENT',
      reference_id: createdLoan.id,
      description: `Emergency Karma Loan Disbursed (+${loanAmount} Karma). Auto-repays on your next give.`,
      created_at: now,
    });

    // Notification
    await notificationRepo.create({
      id: `notif_loan_${Date.now()}`,
      user_id: userId,
      title: 'Emergency Karma Loan Approved ⚡',
      message: `+${loanAmount} Karma credited to your account. It will automatically settle from the earnings of your next give.`,
      type: 'LOAN_ALERT',
      link: '/profile',
      is_read: false,
      created_at: now,
    });

    return {
      loan: createdLoan,
      newBalance,
    };
  }

  async getUserLoans(userId: string): Promise<KarmaLoan[]> {
    return loanRepo.findByUser(userId);
  }

  async getActiveLoan(userId: string): Promise<KarmaLoan | null> {
    return loanRepo.getActiveLoanByUser(userId);
  }
}

export const loanService = new LoanService();
