import {
  exchangeRepo,
  listingRepo,
  bundleRepo,
  loanRepo,
  userRepo,
  transactionRepo,
  notificationRepo
} from '../../data/repository';
import { Exchange, KarmaTransaction, ExchangeStatus } from '../../types';
import { CreateExchangeDto, ExchangeDetailResponse } from './types';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../utils/errors';

export class ExchangeService {
  private generateHandoffCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createExchange(receiverId: string, dto: CreateExchangeDto): Promise<Exchange> {
    const listing = await listingRepo.findById(dto.listing_id);
    if (!listing) throw new NotFoundError('Listing not found');

    if (listing.status !== 'available') {
      throw new ConflictError(`Listing is not available for exchange (current status: ${listing.status})`);
    }

    if (listing.owner_id === receiverId) {
      throw new BadRequestError('You cannot request an exchange for your own listing');
    }

    const receiver = await userRepo.findById(receiverId);
    if (!receiver) throw new NotFoundError('Receiver not found');

    const agreedKarma = dto.agreed_karma || listing.karma_value;
    if (receiver.karma_balance < agreedKarma) {
      throw new BadRequestError(
        `Insufficient karma balance (${receiver.karma_balance} available, ${agreedKarma} required). Use an Emergency Karma Loan or share items to earn karma first!`
      );
    }

    const id = `exc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const handoffCode = this.generateHandoffCode();

    const exchange: Exchange = {
      id,
      listing_id: listing.id,
      giver_id: listing.owner_id,
      receiver_id: receiverId,
      agreed_karma: agreedKarma,
      status: 'REQUESTED',
      giver_confirmed: false,
      receiver_confirmed: false,
      handoff_code: handoffCode,
      notes: dto.notes,
      created_at: now,
      updated_at: now,
    };

    const created = await exchangeRepo.create(exchange);

    // Notify listing owner
    await notificationRepo.create({
      id: `notif_${Date.now()}`,
      user_id: listing.owner_id,
      title: 'New Exchange Request 🤝',
      message: `${receiver.name} requested "${listing.title}" for ${agreedKarma} Karma.`,
      type: 'EXCHANGE_UPDATE',
      link: `/exchanges/${created.id}`,
      is_read: false,
      created_at: now,
    });

    return created;
  }

  async acceptExchange(exchangeId: string, giverId: string): Promise<Exchange> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    // Allow giver OR receiver to accept (in case giver_id comes from Supabase as owner)
    const normalizedGiverId = exchange.giver_id;
    const isParticipant = normalizedGiverId === giverId || exchange.receiver_id === giverId;
    if (!isParticipant) {
      throw new ForbiddenError('Only a participant can accept this exchange request');
    }

    const normalizedStatus = (exchange.status || '').toUpperCase();
    if (normalizedStatus !== 'REQUESTED') {
      throw new ConflictError(`Exchange cannot be accepted from current status: ${exchange.status}`);
    }

    const now = new Date().toISOString();
    const handoffCode = exchange.handoff_code || this.generateHandoffCode();

    const updated = await exchangeRepo.update(exchangeId, {
      status: 'ACCEPTED',
      handoff_code: handoffCode,
      updated_at: now,
    });

    // Ensure in-memory result always has handoff_code
    if (updated && !updated.handoff_code) {
      (updated as any).handoff_code = handoffCode;
    }

    // Mark listing as pending if single listing
    if (exchange.listing_id) {
      await listingRepo.update(exchange.listing_id, { status: 'pending' });
    } else if (exchange.bundle_id) {
      const bundle = await bundleRepo.findById(exchange.bundle_id);
      if (bundle) {
        await bundleRepo.update(bundle.id, { status: 'pending' });
        for (const lId of bundle.listing_ids) {
          await listingRepo.update(lId, { status: 'pending' });
        }
      }
    }

    // Notify receiver
    await notificationRepo.create({
      id: `notif_${Date.now()}`,
      user_id: exchange.receiver_id,
      title: 'Exchange Accepted! 🚀',
      message: `Your exchange was accepted. Show your QR Code or coordinate pickup to complete handoff.`,
      type: 'EXCHANGE_UPDATE',
      link: `/exchanges/${exchange.id}`,
      is_read: false,
      created_at: now,
    });

    return updated!;
  }

  private async executeCompletion(
    exchange: Exchange
  ): Promise<{ exchange: Exchange; completed: boolean; karmaTransferred: number; streakBonusEarned: number; loanRepaidAmount: number }> {
    const receiver = await userRepo.findById(exchange.receiver_id);
    const giver = await userRepo.findById(exchange.giver_id);

    if (!receiver || !giver) throw new NotFoundError('Participants not found');

    if (receiver.karma_balance < exchange.agreed_karma) {
      throw new BadRequestError('Receiver lacks enough karma to complete transaction');
    }

    const now = new Date().toISOString();

    // 1. Calculate Streak & Streak Multiplier Bonus (+10% if streak >= 3)
    const lastGive = giver.last_give_date ? new Date(giver.last_give_date).getTime() : 0;
    const daysSinceLastGive = lastGive ? (Date.now() - lastGive) / (1000 * 60 * 60 * 24) : 999;
    let newStreak = giver.current_streak || 0;

    if (daysSinceLastGive >= 6 && daysSinceLastGive <= 8) {
      newStreak += 1;
    } else if (daysSinceLastGive > 8) {
      newStreak = 1;
    } else if (newStreak === 0) {
      newStreak = 1;
    }

    let streakBonus = 0;
    if (newStreak >= 3) {
      streakBonus = Math.max(1, Math.round(exchange.agreed_karma * 0.10));
    }

    // 2. Check Emergency Karma Loan Auto-Repayment
    const activeLoan = await loanRepo.getActiveLoanByUser(giver.id);
    let loanRepaid = 0;
    let totalGiverEarned = exchange.agreed_karma + streakBonus;

    if (activeLoan && activeLoan.status === 'active') {
      loanRepaid = Math.min(totalGiverEarned, activeLoan.amount);
      await loanRepo.update(activeLoan.id, {
        status: 'repaid',
        repaid_at: now,
      });

      await transactionRepo.create({
        id: `txn_repay_${Date.now()}`,
        from_user_id: giver.id,
        to_user_id: null,
        amount: loanRepaid,
        type: 'LOAN_REPAYMENT',
        reference_id: activeLoan.id,
        description: `Emergency Karma Loan Auto-Repayment on Completed Give`,
        created_at: now,
      });

      await notificationRepo.create({
        id: `notif_${Date.now()}_loan`,
        user_id: giver.id,
        title: 'Emergency Loan Repaid ✅',
        message: `${loanRepaid} Karma from this exchange was automatically applied to clear your active loan.`,
        type: 'LOAN_ALERT',
        link: '/profile',
        is_read: false,
        created_at: now,
      });
    }

    const netGiverPayout = totalGiverEarned - loanRepaid;

    // 3. Update Balances
    await userRepo.updateKarma(receiver.id, -exchange.agreed_karma);
    if (netGiverPayout !== 0) {
      await userRepo.updateKarma(giver.id, netGiverPayout);
    }

    // Update Giver's streak & last give date
    await userRepo.update(giver.id, {
      current_streak: newStreak,
      last_give_date: now,
    });

    // 4. Ledger entry for exchange
    let resourceTitle = 'Resource';
    if (exchange.listing_id) {
      const listing = await listingRepo.findById(exchange.listing_id);
      resourceTitle = listing?.title || 'Resource';
      await listingRepo.update(exchange.listing_id, { status: 'exchanged' });
    } else if (exchange.bundle_id) {
      const bundle = await bundleRepo.findById(exchange.bundle_id);
      resourceTitle = bundle?.title ? `Bundle: ${bundle.title}` : 'Bundle';
      if (bundle) {
        await bundleRepo.update(bundle.id, { status: 'exchanged' });
        for (const lId of bundle.listing_ids) {
          await listingRepo.update(lId, { status: 'exchanged' });
        }
      }
    }

    const txn: KarmaTransaction = {
      id: `txn_${Date.now()}_exc`,
      from_user_id: receiver.id,
      to_user_id: giver.id,
      amount: exchange.agreed_karma,
      type: 'EXCHANGE',
      reference_id: exchange.id,
      description: `Completed peer exchange for: "${resourceTitle}"`,
      created_at: now,
    };
    await transactionRepo.create(txn);

    if (streakBonus > 0) {
      await transactionRepo.create({
        id: `txn_streak_${Date.now()}`,
        from_user_id: null,
        to_user_id: giver.id,
        amount: streakBonus,
        type: 'SIGNUP_AIRDROP',
        reference_id: exchange.id,
        description: `🔥 ${newStreak}-Week Karma Streak Bonus (+10%)`,
        created_at: now,
      });
    }

    // 5. Update exchange state to COMPLETED
    const completedExchange = await exchangeRepo.update(exchange.id, {
      status: 'COMPLETED',
      giver_confirmed: true,
      receiver_confirmed: true,
      completed_at: now,
      updated_at: now,
    });

    // 6. Notifications
    await notificationRepo.create({
      id: `notif_${Date.now()}_g`,
      user_id: giver.id,
      title: 'Karma Earned! 🌟',
      message: `Exchange completed! You received +${netGiverPayout} Karma (${streakBonus > 0 ? `+${streakBonus} streak bonus included, ` : ''}${loanRepaid > 0 ? `${loanRepaid} loan repaid, ` : ''}🔥 Streak: ${newStreak} weeks).`,
      type: 'KARMA_EARNED',
      link: `/exchanges/${exchange.id}`,
      is_read: false,
      created_at: now,
    });

    await notificationRepo.create({
      id: `notif_${Date.now()}_r`,
      user_id: receiver.id,
      title: 'Exchange Completed! ✨',
      message: `Handoff verified. -${exchange.agreed_karma} Karma settled. Rate your peer exchange!`,
      type: 'EXCHANGE_UPDATE',
      link: `/exchanges/${exchange.id}`,
      is_read: false,
      created_at: now,
    });

    return {
      exchange: completedExchange!,
      completed: true,
      karmaTransferred: exchange.agreed_karma,
      streakBonusEarned: streakBonus,
      loanRepaidAmount: loanRepaid,
    };
  }

  async confirmHandoff(
    exchangeId: string,
    userId: string
  ): Promise<{ exchange: Exchange; completed: boolean; karmaTransferred?: number }> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.status !== 'ACCEPTED' && exchange.status !== 'HANDOFF_CONFIRMED') {
      throw new ConflictError(`Cannot confirm handoff in status: ${exchange.status}`);
    }

    if (exchange.giver_id !== userId && exchange.receiver_id !== userId) {
      throw new ForbiddenError('You are not a participant in this exchange');
    }

    const isGiver = exchange.giver_id === userId;
    const isReceiver = exchange.receiver_id === userId;

    let giverConfirmed = exchange.giver_confirmed || isGiver;
    let receiverConfirmed = exchange.receiver_confirmed || isReceiver;

    const now = new Date().toISOString();

    if (giverConfirmed && receiverConfirmed) {
      return this.executeCompletion(exchange);
    } else {
      // Partial confirmation
      const partialUpdate = await exchangeRepo.update(exchangeId, {
        status: 'HANDOFF_CONFIRMED',
        giver_confirmed: giverConfirmed,
        receiver_confirmed: receiverConfirmed,
        updated_at: now,
      });

      const otherUserId = isGiver ? exchange.receiver_id : exchange.giver_id;
      await notificationRepo.create({
        id: `notif_${Date.now()}`,
        user_id: otherUserId,
        title: 'Handoff Confirmation Pending',
        message: 'Your peer has confirmed handoff. Scan QR or tap confirm on your end to release karma.',
        type: 'EXCHANGE_UPDATE',
        link: `/exchanges/${exchange.id}`,
        is_read: false,
        created_at: now,
      });

      return {
        exchange: partialUpdate!,
        completed: false,
      };
    }
  }

  async scanHandoff(
    exchangeId: string,
    userId: string,
    code: string
  ): Promise<{ exchange: Exchange; completed: boolean; karmaTransferred?: number }> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.giver_id !== userId && exchange.receiver_id !== userId) {
      throw new ForbiddenError('You are not a participant in this exchange');
    }

    if (exchange.status !== 'ACCEPTED' && exchange.status !== 'HANDOFF_CONFIRMED') {
      throw new ConflictError(`Cannot scan QR in status: ${exchange.status}`);
    }

    if (!exchange.handoff_code || exchange.handoff_code.toUpperCase() !== code.trim().toUpperCase()) {
      throw new BadRequestError('Invalid handoff verification code or QR token');
    }

    // QR scan instantly completes the mutual handoff!
    return this.executeCompletion(exchange);
  }

  async cancelExchange(exchangeId: string, userId: string, reason: string): Promise<Exchange> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.giver_id !== userId && exchange.receiver_id !== userId) {
      throw new ForbiddenError('Only participants can cancel this exchange');
    }

    if (exchange.status === 'COMPLETED') {
      throw new BadRequestError('Completed exchanges cannot be cancelled.');
    }

    const now = new Date().toISOString();
    const updated = await exchangeRepo.update(exchangeId, {
      status: 'CANCELLED',
      dispute_reason: `Cancelled: ${reason}`,
      updated_at: now,
    });

    if (exchange.listing_id) {
      await listingRepo.update(exchange.listing_id, { status: 'available' });
    } else if (exchange.bundle_id) {
      const bundle = await bundleRepo.findById(exchange.bundle_id);
      if (bundle) {
        await bundleRepo.update(bundle.id, { status: 'available' });
        for (const lId of bundle.listing_ids) {
          await listingRepo.update(lId, { status: 'available' });
        }
      }
    }

    return updated!;
  }

  async disputeExchange(exchangeId: string, userId: string, reason: string): Promise<Exchange> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.giver_id !== userId && exchange.receiver_id !== userId) {
      throw new ForbiddenError('Only participants can dispute this exchange');
    }

    const now = new Date().toISOString();
    const updated = await exchangeRepo.update(exchangeId, {
      status: 'DISPUTED',
      dispute_reason: reason,
      updated_at: now,
    });

    await exchangeRepo.createDispute({
      id: `dsp_${Date.now()}`,
      exchange_id: exchangeId,
      raised_by: userId,
      reason,
      status: 'OPEN',
      created_at: now,
    });

    return updated!;
  }

  async getMyExchanges(userId: string): Promise<ExchangeDetailResponse[]> {
    const list = await exchangeRepo.findByUser(userId);
    const results: ExchangeDetailResponse[] = [];

    for (const exc of list) {
      const giver = await userRepo.findById(exc.giver_id);
      const receiver = await userRepo.findById(exc.receiver_id);
      let listing = undefined;
      let bundle = undefined;

      if (exc.listing_id) {
        listing = (await listingRepo.findById(exc.listing_id)) || undefined;
      } else if (exc.bundle_id) {
        bundle = (await bundleRepo.findById(exc.bundle_id)) || undefined;
      }

      results.push({
        ...exc,
        listing,
        bundle,
        giver: giver ? { id: giver.id, name: giver.name, department: giver.department, hostel_block: giver.hostel_block, current_streak: giver.current_streak } : undefined,
        receiver: receiver ? { id: receiver.id, name: receiver.name, department: receiver.department, hostel_block: receiver.hostel_block } : undefined,
      });
    }

    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getExchangeById(exchangeId: string, userId: string): Promise<ExchangeDetailResponse> {
    const exc = await exchangeRepo.findById(exchangeId);
    if (!exc) throw new NotFoundError('Exchange not found');

    if (exc.giver_id !== userId && exc.receiver_id !== userId) {
      throw new ForbiddenError('You do not have permission to view this exchange');
    }

    const giver = await userRepo.findById(exc.giver_id);
    const receiver = await userRepo.findById(exc.receiver_id);
    let listing = undefined;
    let bundle = undefined;

    if (exc.listing_id) {
      listing = (await listingRepo.findById(exc.listing_id)) || undefined;
    } else if (exc.bundle_id) {
      bundle = (await bundleRepo.findById(exc.bundle_id)) || undefined;
    }

    return {
      ...exc,
      listing,
      bundle,
      giver: giver ? { id: giver.id, name: giver.name, department: giver.department, hostel_block: giver.hostel_block, current_streak: giver.current_streak } : undefined,
      receiver: receiver ? { id: receiver.id, name: receiver.name, department: receiver.department, hostel_block: receiver.hostel_block } : undefined,
    };
  }
}

export const exchangeService = new ExchangeService();
