export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  year: number;
  hostel_block: string;
  karma_balance: number;
  role: UserRole;
  is_verified: boolean;
  avatar_url?: string;
  will_recipient_id?: string | null;
  will_activated?: boolean;
  reputation_score?: number;
  current_streak?: number;
  last_give_date?: string | null;
  created_at: string;
  updated_at: string;
}

export type ListingType = 'ITEM' | 'NOTE' | 'TICKET' | 'SKILL' | 'OPPORTUNITY';
export type ListingStatus = 'available' | 'pending' | 'exchanged' | 'expired';

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
  owner?: User;
  created_at: string;
}

export type NeedStatus = 'open' | 'fulfilled' | 'cancelled' | 'expired';

export interface UrgentNeed {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  max_karma_offered: number;
  target_deadline: string; // ISO string
  hostel_block: string;
  status: NeedStatus;
  urgency_score?: number; // dynamically computed
  fulfilled_by?: string;
  fulfilled_at?: string;
  created_at: string;
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
}

export type MessageType = 'text' | 'propose_karma';

export interface Message {
  id: string;
  exchange_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  proposed_karma?: number;
  proposal_status?: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ReputationRating {
  id: string;
  exchange_id: string;
  reviewer_id: string;
  target_user_id: string;
  rating: number; // 1 - 5
  feedback_tags: string[]; // e.g. "on time", "item as described", "quick response"
  comment?: string;
  created_at: string;
}

export interface UserReputation {
  user_id: string;
  score: number; // 0 - 5.0 (with activity decay)
  rating_count: number;
  badges: string[];
  feedback_summary: Record<string, number>;
}

export interface KarmaTransaction {
  id: string;
  from_user_id: string | null; // null if minted / bonus
  to_user_id: string | null;
  amount: number;
  type: 'EXCHANGE' | 'BONUS_NEED_FULFILLMENT' | 'SIGNUP_AIRDROP' | 'ADMIN_ADJUSTMENT' | 'WILL_TRANSFER' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT';
  reference_id?: string;
  description: string;
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

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'MATCH_ALERT' | 'NEED_FULFILLED' | 'EXCHANGE_UPDATE' | 'KARMA_EARNED' | 'REMINDER' | 'WILL_PROMPT' | 'WILL_RECEIVED' | 'LOAN_ALERT';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ImpactStats {
  money_saved_inr: number;
  waste_diverted_kg: number;
  tutoring_hours: number;
  exchanges_count: number;
  karma_circulated: number;
}
