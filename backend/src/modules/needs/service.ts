import { needRepo, userRepo, transactionRepo, notificationRepo, exchangeRepo } from '../../data/repository';
import { UrgentNeed, KarmaTransaction } from '../../types';
import { CreateNeedDto, FulfillNeedDto } from './types';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';

export class NeedService {
  /**
   * Server-side dynamic calculation of Urgency Score (0 - 100).
   * High urgency floats immediately to the top of campus feeds.
   */
  computeUrgencyScore(need: UrgentNeed): number {
    const now = Date.now();
    const deadline = new Date(need.target_deadline).getTime();
    const diffHours = (deadline - now) / (1000 * 60 * 60);

    if (diffHours <= 0) return 0; // Expired

    let timeScore = 0;
    if (diffHours <= 2) {
      timeScore = 95; // Extreme exam/emergency
    } else if (diffHours <= 6) {
      timeScore = 85;
    } else if (diffHours <= 12) {
      timeScore = 70;
    } else if (diffHours <= 24) {
      timeScore = 55;
    } else if (diffHours <= 48) {
      timeScore = 40;
    } else {
      timeScore = Math.max(10, Math.round(30 - (diffHours / 24) * 2));
    }

    // Karma incentive bonus (up to +10 bonus points for generous requests)
    const karmaBonus = Math.min(10, Math.round((need.max_karma_offered / 100) * 10));
    return Math.min(100, timeScore + karmaBonus);
  }

  async createNeed(requesterId: string, dto: CreateNeedDto): Promise<UrgentNeed> {
    const user = await userRepo.findById(requesterId);
    if (!user) throw new NotFoundError('User not found');

    if (user.karma_balance < dto.max_karma_offered) {
      throw new BadRequestError(
        `Insufficient karma balance (${user.karma_balance} available, ${dto.max_karma_offered} offered). Give resources to earn more karma!`
      );
    }

    const deadline = new Date(dto.target_deadline);
    if (deadline.getTime() <= Date.now()) {
      throw new BadRequestError('Target deadline must be in the future.');
    }

    const need: UrgentNeed = {
      id: `ned_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      requester_id: requesterId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      tags: dto.tags.map((t) => t.toLowerCase().trim()),
      max_karma_offered: dto.max_karma_offered,
      target_deadline: dto.target_deadline,
      hostel_block: dto.hostel_block,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    need.urgency_score = this.computeUrgencyScore(need);
    return needRepo.create(need);
  }

  async getNeeds(sortBy: 'urgency' | 'latest' = 'urgency', status: string = 'open'): Promise<(UrgentNeed & { requester?: any })[]> {
    const needs = await needRepo.getAll(status);

    const enriched = await Promise.all(
      needs.map(async (n) => {
        const score = this.computeUrgencyScore(n);
        const requester = await userRepo.findById(n.requester_id);
        return {
          ...n,
          urgency_score: score,
          requester: requester
            ? {
                id: requester.id,
                name: requester.name,
                department: requester.department,
                year: requester.year,
                hostel_block: requester.hostel_block,
              }
            : undefined,
        };
      })
    );

    if (sortBy === 'urgency') {
      return enriched.sort((a, b) => (b.urgency_score || 0) - (a.urgency_score || 0));
    }
    return enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getNeedById(id: string): Promise<UrgentNeed & { requester?: any }> {
    const need = await needRepo.findById(id);
    if (!need) throw new NotFoundError('Urgent need not found');

    const score = this.computeUrgencyScore(need);
    const requester = await userRepo.findById(need.requester_id);
    return {
      ...need,
      urgency_score: score,
      requester: requester
        ? {
            id: requester.id,
            name: requester.name,
            department: requester.department,
            year: requester.year,
            hostel_block: requester.hostel_block,
          }
        : undefined,
    };
  }

  /**
   * Fulfill urgent need.
   * Settles karma transfer with 1.25x emergency fulfillment bonus multiplier!
   */
  async fulfillNeed(needId: string, fulfillerId: string, dto: FulfillNeedDto): Promise<{
    need: UrgentNeed;
    karmaTransferred: number;
    fulfillerBonusEarned: number;
    requesterBonusCashback: number;
  }> {
    const need = await needRepo.findById(needId);
    if (!need) throw new NotFoundError('Need not found');

    if (need.status !== 'open') {
      throw new ConflictError(`This need is already ${need.status}`);
    }

    if (need.requester_id === fulfillerId) {
      throw new BadRequestError('You cannot fulfill your own urgent need');
    }

    const requester = await userRepo.findById(need.requester_id);
    const fulfiller = await userRepo.findById(fulfillerId);
    if (!requester || !fulfiller) throw new NotFoundError('User record missing');

    const baseKarma = need.max_karma_offered;
    if (requester.karma_balance < baseKarma) {
      throw new BadRequestError('Requester no longer has enough karma balance.');
    }

    // 1.25x Emergency multiplier bonus (Platform mints extra incentive for rapid helpers)
    const fulfillerBonus = Math.round(baseKarma * 0.25);
    const requesterCashback = Math.round(baseKarma * 0.1); // 10% gratitude cashback

    // Transfer base karma
    await userRepo.updateKarma(requester.id, -(baseKarma - requesterCashback));
    await userRepo.updateKarma(fulfiller.id, baseKarma + fulfillerBonus);

    // Update need record
    const updatedNeed = (await needRepo.update(need.id, {
      status: 'fulfilled',
      fulfilled_by: fulfiller.id,
      fulfilled_at: new Date().toISOString(),
    }))!;

    // Ledger transactions
    const baseTxn: KarmaTransaction = {
      id: `txn_${Date.now()}_need_base`,
      from_user_id: requester.id,
      to_user_id: fulfiller.id,
      amount: baseKarma,
      type: 'EXCHANGE',
      reference_id: need.id,
      description: `Fulfilled urgent campus need: "${need.title}"`,
      created_at: new Date().toISOString(),
    };
    await transactionRepo.create(baseTxn);

    const bonusTxn: KarmaTransaction = {
      id: `txn_${Date.now()}_bonus`,
      from_user_id: null,
      to_user_id: fulfiller.id,
      amount: fulfillerBonus,
      type: 'BONUS_NEED_FULFILLMENT',
      reference_id: need.id,
      description: `Emergency response bonus (1.25x multiplier) for saving a campus peer in time!`,
      created_at: new Date().toISOString(),
    };
    await transactionRepo.create(bonusTxn);

    // Notifications
    await notificationRepo.create({
      id: `notif_${Date.now()}_req`,
      user_id: requester.id,
      title: 'Urgent Need Fulfilled! 🎉',
      message: `${fulfiller.name} stepped in to fulfill "${need.title}". You received ${requesterCashback} cashback karma!`,
      type: 'NEED_FULFILLED',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    await notificationRepo.create({
      id: `notif_${Date.now()}_ful`,
      user_id: fulfiller.id,
      title: 'Karma Multiplier Bonus Awarded! ⚡',
      message: `You earned ${baseKarma + fulfillerBonus} Karma (+${fulfillerBonus} emergency bonus) for fulfilling "${need.title}".`,
      type: 'KARMA_EARNED',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return {
      need: updatedNeed,
      karmaTransferred: baseKarma,
      fulfillerBonusEarned: fulfillerBonus,
      requesterBonusCashback: requesterCashback,
    };
  }
}

export const needService = new NeedService();
