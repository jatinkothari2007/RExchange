export interface CreateNeedDto {
  title: string;
  description: string;
  category: string;
  tags: string[];
  max_karma_offered: number;
  target_deadline: string; // ISO string
  hostel_block: string;
}

export interface FulfillNeedDto {
  offering_listing_id?: string;
  notes?: string;
}
