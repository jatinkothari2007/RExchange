export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  department?: string;
  hostel_block?: string;
  avatar_url?: string;
  karma_given: number;
  exchanges_count: number;
  is_current_user?: boolean;
}

export interface GroupLeaderboardEntry {
  rank: number;
  group_name: string;
  total_karma_shared: number;
  active_students: number;
  total_exchanges: number;
}
