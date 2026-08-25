import { Listing } from '../../types';

export interface MatchSuggestion {
  listing: Listing;
  match_score: number; // 0.0 to 1.0 (cosine similarity)
  match_reasons: string[];
}

export interface MatchFeedbackDto {
  listing_id: string;
  thumbs_up: boolean;
  notes?: string;
}

export interface IMatchStrategy {
  readonly name: string;
  computeRecommendations(
    userId: string,
    availableListings: Listing[],
    limit?: number
  ): Promise<MatchSuggestion[]>;
}
