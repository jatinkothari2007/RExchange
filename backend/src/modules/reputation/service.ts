import { reputationRepo, exchangeRepo, userRepo, notificationRepo } from '../../data/repository';
import { ReputationRating, UserReputation } from '../../types';
import { RateExchangeDto } from './types';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../../utils/errors';

export class ReputationService {
  async rateExchange(exchangeId: string, reviewerId: string, dto: RateExchangeDto): Promise<ReputationRating> {
    const exchange = await exchangeRepo.findById(exchangeId);
    if (!exchange) throw new NotFoundError('Exchange not found');

    if (exchange.status !== 'COMPLETED') {
      throw new BadRequestError('Only completed exchanges can be rated');
    }

    if (exchange.giver_id !== reviewerId && exchange.receiver_id !== reviewerId) {
      throw new ForbiddenError('You are not a participant in this exchange');
    }

    const targetUserId = exchange.giver_id === reviewerId ? exchange.receiver_id : exchange.giver_id;

    // Check if reviewer already rated this exchange
    const existingRatings = await reputationRepo.findByExchange(exchangeId);
    if (existingRatings.some((r) => r.reviewer_id === reviewerId)) {
      throw new ConflictError('You have already submitted a rating for this exchange');
    }

    const rating: ReputationRating = {
      id: `rat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exchange_id: exchangeId,
      reviewer_id: reviewerId,
      target_user_id: targetUserId,
      rating: dto.rating,
      feedback_tags: dto.feedback_tags.map((t) => t.toLowerCase().trim()),
      comment: dto.comment,
      created_at: new Date().toISOString(),
    };

    const created = await reputationRepo.createRating(rating);

    const reviewer = await userRepo.findById(reviewerId);
    await notificationRepo.create({
      id: `notif_${Date.now()}`,
      user_id: targetUserId,
      title: 'New Peer Rating Received ⭐',
      message: `${reviewer?.name || 'A peer'} rated your exchange ${dto.rating}/5 stars.`,
      type: 'REMINDER',
      link: `/profile`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return created;
  }

  async getUserReputation(userId: string): Promise<UserReputation> {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const ratings = await reputationRepo.findByTargetUser(userId);
    const userExchanges = await exchangeRepo.findByUser(userId);
    const completedGives = userExchanges.filter((e) => e.giver_id === userId && e.status === 'COMPLETED');

    if (ratings.length === 0) {
      return {
        user_id: userId,
        score: 5.0, // pristine starting trust
        rating_count: 0,
        badges: ['New Member'],
        feedback_summary: {},
      };
    }

    // Weighted average with recency weighting
    const now = Date.now();
    let totalWeight = 0;
    let weightedSum = 0;
    const tagCounts: Record<string, number> = {};

    for (const r of ratings) {
      const ageDays = (now - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const weight = ageDays < 30 ? 1.0 : ageDays < 90 ? 0.85 : 0.7;
      weightedSum += r.rating * weight;
      totalWeight += weight;

      for (const tag of r.feedback_tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    let calculatedScore = weightedSum / totalWeight;

    // Slight inactivity decay if untouched for > 45 days
    const latestRatingDate = Math.max(...ratings.map((r) => new Date(r.created_at).getTime()));
    const daysSinceLatest = (now - latestRatingDate) / (1000 * 60 * 60 * 24);
    if (daysSinceLatest > 45) {
      calculatedScore *= 0.96; // 4% inactivity dampener
    }

    calculatedScore = Math.max(1.0, Math.min(5.0, Math.round(calculatedScore * 10) / 10));

    // Dynamic Badges
    const badges: string[] = [];
    if (completedGives.length >= 2) badges.push('Verified Giver');
    if ((tagCounts['quick response'] || 0) + (tagCounts['on time'] || 0) >= 1) badges.push('Fast Responder');
    if (calculatedScore >= 4.5 && ratings.length >= 1) badges.push('Campus Star');
    if (completedGives.length >= 1) badges.push('Eco Champion');
    if (user.role === 'admin') badges.push('Community Mod');

    if (badges.length === 0) badges.push('Active Contributor');

    return {
      user_id: userId,
      score: calculatedScore,
      rating_count: ratings.length,
      badges,
      feedback_summary: tagCounts,
    };
  }
}

export const reputationService = new ReputationService();
