export interface ResolveDisputeDto {
  status: 'RESOLVED' | 'DISMISSED';
  resolution_notes: string;
  refund_karma_to?: string;
  karma_amount?: number;
}

export interface BanUserDto {
  reason: string;
}
