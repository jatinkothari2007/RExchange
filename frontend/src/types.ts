export type ListingType = 'ITEM' | 'NOTE' | 'TICKET' | 'SKILL' | 'OPPORTUNITY';
export type ListingStatus = 'available' | 'pending' | 'exchanged' | 'expired';

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  year: number;
  hostel_block: string;
  karma_balance: number;
  role: 'student' | 'admin';
  is_verified: boolean;
  avatar_url?: string;
  will_recipient_id?: string | null;
  will_activated?: boolean;
  current_streak?: number;
  last_give_date?: string | null;
  created_at: string;
}

export interface BaseListing {
  id: string;
  owner_id: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  tags: string[];
  karma_value: number;
  status: ListingStatus;
  pickup_point: string;
  image_url?: string;
  willed_from_name?: string;
  created_at: string;
  expires_at: string;
  last_activity_at: string;
  owner?: {
    id: string;
    name: string;
    department: string;
    year: number;
    hostel_block: string;
    avatar_url?: string;
    current_streak?: number;
  };
}

export interface ItemListing extends BaseListing {
  type: 'ITEM';
  condition: 'like_new' | 'good' | 'fair';
  original_price_est?: number;
}

export interface NoteListing extends BaseListing {
  type: 'NOTE';
  subject: string;
  semester: number;
  file_url?: string;
  page_count?: number;
}

export interface TicketListing extends BaseListing {
  type: 'TICKET';
  event_name: string;
  event_date: string;
  venue: string;
}

export interface SkillListing extends BaseListing {
  type: 'SKILL';
  skill_category: string;
  duration_minutes: number;
  session_mode: 'in_person' | 'online';
  voice_note_url?: string;
}

export interface OpportunityListing extends BaseListing {
  type: 'OPPORTUNITY';
  organization: string;
  role_title: string;
  application_deadline?: string;
}

export type Listing = ItemListing | NoteListing | TicketListing | SkillListing | OpportunityListing;

export interface ListingBundle {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  karma_value: number;
  status: 'available' | 'pending' | 'exchanged' | 'cancelled';
  listing_ids: string[];
  items?: Listing[];
  owner?: {
    id: string;
    name: string;
    department: string;
    hostel_block: string;
    current_streak?: number;
  };
  created_at: string;
}

export interface KarmaLoan {
  id: string;
  user_id: string;
  amount: number;
  status: 'active' | 'repaid' | 'defaulted';
  created_at: string;
  repaid_at?: string;
}

export interface SpotlightItem {
  id: string;
  type: 'open_skill' | 'recent_exchange';
  listing_id?: string;
  title: string;
  description: string;
  karma_value: number;
  duration_minutes: number;
  session_mode: string;
  voice_note_url?: string;
  giver_name: string;
  giver_department: string;
  giver_hostel: string;
  giver_streak?: number;
  receiver_name?: string;
  receiver_department?: string;
  badge: string;
}

export interface UrgentNeed {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  max_karma_offered: number;
  target_deadline: string;
  hostel_block: string;
  status: 'open' | 'fulfilled' | 'cancelled' | 'expired';
  urgency_score?: number;
  fulfilled_by?: string;
  fulfilled_at?: string;
  created_at: string;
  requester?: {
    id: string;
    name: string;
    department: string;
    year: number;
    hostel_block: string;
    avatar_url?: string;
  };
}

export type ExchangeStatus = 
  | 'REQUESTED' 
  | 'ACCEPTED' 
  | 'HANDOFF_CONFIRMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'DISPUTED';

export interface Exchange {
  id: string;
  listing_id?: string;
  bundle_id?: string | null;
  giver_id: string;
  receiver_id: string;
  agreed_karma: number;
  status: ExchangeStatus;
  giver_confirmed: boolean;
  receiver_confirmed: boolean;
  handoff_code?: string;
  notes?: string;
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  listing?: Listing;
  bundle?: ListingBundle;
  giver?: {
    id: string;
    name: string;
    department: string;
    hostel_block: string;
    current_streak?: number;
  };
  receiver?: {
    id: string;
    name: string;
    department: string;
    hostel_block: string;
    current_streak?: number;
  };
}


export interface Message {
  id: string;
  exchange_id: string;
  sender_id: string;
  type: 'text' | 'propose_karma';
  content: string;
  proposed_karma?: number;
  proposal_status?: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface UserReputation {
  user_id: string;
  score: number;
  rating_count: number;
  badges: string[];
  feedback_summary: Record<string, number>;
}

export interface ImpactStats {
  money_saved_inr: number;
  waste_diverted_kg: number;
  tutoring_hours: number;
  exchanges_count: number;
  karma_circulated: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface MatchSuggestion {
  listing: Listing;
  match_score: number; // 0 - 100
  similarity_explanation: string;
  proximity_badge: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  department: string;
  hostel_block: string;
  karma_given: number;
  exchanges_count: number;
  avatar_url?: string;
  current_streak?: number;
}

export interface GroupLeaderboardEntry {
  rank: number;
  group_name: string;
  total_karma_shared: number;
  total_exchanges: number;
  active_students: number;
}
