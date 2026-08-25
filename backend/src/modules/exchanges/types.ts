import { Exchange } from '../../types';

export interface CreateExchangeDto {
  listing_id: string;
  agreed_karma?: number;
  notes?: string;
}

export interface ConfirmHandoffDto {
  notes?: string;
}

export interface CancelExchangeDto {
  reason: string;
}

export interface DisputeExchangeDto {
  reason: string;
}

export interface ExchangeDetailResponse extends Exchange {
  listing?: any;
  bundle?: any;
  giver?: any;
  receiver?: any;
}

