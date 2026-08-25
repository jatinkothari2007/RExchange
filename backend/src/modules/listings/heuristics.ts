import { ListingType } from '../../types';

export interface KarmaSuggestionInput {
  type: ListingType;
  category?: string;
  condition?: 'like_new' | 'good' | 'fair';
  original_price_est?: number;
  duration_minutes?: number;
  page_count?: number;
  tags?: string[];
}

export interface KarmaSuggestionResult {
  suggestedKarma: number;
  minAllowedKarma: number;
  maxAllowedKarma: number;
  reasoning: string;
}

/**
 * Pure heuristic function to calculate suggested karma value and allowed bounds.
 * Prevents hyperinflation while rewarding high-utility contributions.
 */
export function calculateSuggestedKarma(input: KarmaSuggestionInput): KarmaSuggestionResult {
  let baseKarma = 20;
  let multiplier = 1.0;
  let explanation = 'Standard baseline exchange value.';

  switch (input.type) {
    case 'ITEM': {
      // Items: estimated INR price conversion + condition dampener
      const estPrice = input.original_price_est || 500;
      const conditionMultiplier =
        input.condition === 'like_new' ? 1.0 : input.condition === 'good' ? 0.8 : 0.6;
      
      // Conversion formula: ~2.5% of estimated price in Karma, scaled by condition
      baseKarma = Math.max(10, Math.round((estPrice * 0.025) * conditionMultiplier));
      explanation = `Item heuristic: INR ${estPrice} estimated value with ${input.condition || 'standard'} condition.`;
      break;
    }

    case 'NOTE': {
      // Notes: based on page depth & semester demand
      const pages = input.page_count || 30;
      if (pages > 60) {
        baseKarma = 25;
        explanation = `Comprehensive guide (${pages} pages).`;
      } else if (pages > 25) {
        baseKarma = 15;
        explanation = `Standard chapter summary (${pages} pages).`;
      } else {
        baseKarma = 10;
        explanation = `Quick reference formula sheet (${pages} pages).`;
      }
      break;
    }

    case 'TICKET': {
      baseKarma = 30;
      explanation = 'Campus cultural / tech fest entry pass standard rate.';
      break;
    }

    case 'SKILL': {
      // Skills: 60 mins -> ~40 karma (high value peer tutoring)
      const duration = input.duration_minutes || 60;
      baseKarma = Math.max(15, Math.round((duration / 60) * 40));
      explanation = `Mentorship heuristic: ${duration} minutes dedicated 1-on-1 tutoring/guidance.`;
      break;
    }

    case 'OPPORTUNITY': {
      baseKarma = 15;
      explanation = 'Curated hackathon / research team opening referral.';
      break;
    }
  }

  // Tag keyword bonus (e.g. "exam", "urgent", "lab")
  if (input.tags && input.tags.some((t) => ['exam', 'lab', 'hardware', 'gate'].includes(t.toLowerCase()))) {
    multiplier = 1.15;
    explanation += ' High academic priority bonus applied.';
  }

  const suggestedKarma = Math.round(baseKarma * multiplier);
  const minAllowedKarma = Math.max(5, Math.floor(suggestedKarma * 0.5));
  const maxAllowedKarma = Math.ceil(suggestedKarma * 2.0);

  return {
    suggestedKarma,
    minAllowedKarma,
    maxAllowedKarma,
    reasoning: explanation,
  };
}
