import { UserReputation } from '../../types';

export interface RateExchangeDto {
  rating: number; // 1 - 5
  feedback_tags: string[];
  comment?: string;
}

export type { UserReputation };
