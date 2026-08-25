import { listingRepo } from '../../data/repository';
import { dataStore } from '../../data/store';
import { IMatchStrategy, MatchSuggestion, MatchFeedbackDto } from './types';
import { TextEmbeddingCosineMatchStrategy } from './strategy';

export class MatchService {
  private strategy: IMatchStrategy;

  constructor(strategy?: IMatchStrategy) {
    this.strategy = strategy || new TextEmbeddingCosineMatchStrategy();
  }

  setStrategy(strategy: IMatchStrategy) {
    this.strategy = strategy;
  }

  async getSuggestionsForUser(userId: string, limit: number = 6): Promise<MatchSuggestion[]> {
    const availableListings = await listingRepo.find({ status: 'available' });
    return this.strategy.computeRecommendations(userId, availableListings, limit);
  }

  async recordFeedback(userId: string, dto: MatchFeedbackDto): Promise<{ message: string }> {
    dataStore.matchFeedback.set(`${userId}_${dto.listing_id}`, {
      user_id: userId,
      listing_id: dto.listing_id,
      thumbs_up: dto.thumbs_up,
      created_at: new Date().toISOString(),
    });

    return {
      message: dto.thumbs_up
        ? 'Thank you! We will prioritize similar campus listings in your feed.'
        : 'Feedback noted. We will adjust future match vectors.',
    };
  }
}

export const matchService = new MatchService();
