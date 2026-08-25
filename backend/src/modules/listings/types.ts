import { ListingType } from '../../types';

export interface CreateListingDto {
  type: ListingType;
  title: string;
  description: string;
  category: string;
  tags: string[];
  karma_value?: number; // if not provided, heuristic calculates it
  pickup_point: string;
  image_url?: string;
  expires_in_days?: number;

  // Item specific
  condition?: 'like_new' | 'good' | 'fair';
  original_price_est?: number;

  // Note specific
  subject?: string;
  semester?: number;
  file_url?: string;
  page_count?: number;

  // Ticket specific
  event_name?: string;
  event_date?: string;
  venue?: string;

  // Skill specific
  skill_category?: string;
  duration_minutes?: number;
  session_mode?: 'in_person' | 'online';

  // Opportunity specific
  organization?: string;
  role_title?: string;
  application_deadline?: string;
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  karma_value?: number;
  pickup_point?: string;
  image_url?: string;
  status?: 'available' | 'pending' | 'exchanged' | 'expired';
}

export interface ListingFilterQuery {
  type?: ListingType;
  category?: string;
  tag?: string;
  minKarma?: number;
  maxKarma?: number;
  ownerId?: string;
  status?: string;
  q?: string;
  hostelBlock?: string;
}
