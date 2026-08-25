import { userRepo, transactionRepo, exchangeRepo } from '../../data/repository';
import { LeaderboardEntry, GroupLeaderboardEntry } from './types';

export class GamificationService {
  async getLeaderboard(
    scope: 'week' | 'alltime' = 'alltime',
    groupBy?: 'department' | 'hostel',
    currentUserId?: string
  ): Promise<{
    scope: string;
    grouped_by?: string;
    entries: LeaderboardEntry[] | GroupLeaderboardEntry[];
    currentUserRank?: LeaderboardEntry | null;
  }> {
    const allUsers = await userRepo.getAll();
    const allTransactions = await transactionRepo.getAll();
    const allExchanges = await exchangeRepo.getDisputes(); // get all

    const now = Date.now();
    const oneWeekAgo = now - 7 * 86400000;

    // Filter transactions by scope
    const relevantTxns = allTransactions.filter((t) => {
      if (t.type !== 'EXCHANGE' && t.type !== 'BONUS_NEED_FULFILLMENT') return false;
      if (scope === 'week') {
        return new Date(t.created_at).getTime() >= oneWeekAgo;
      }
      return true;
    });

    if (groupBy === 'department' || groupBy === 'hostel') {
      const groupMap = new Map<string, { totalKarma: number; studentIds: Set<string>; exchanges: number }>();

      for (const u of allUsers) {
        const key = groupBy === 'department' ? u.department : u.hostel_block;
        if (!groupMap.has(key)) {
          groupMap.set(key, { totalKarma: 0, studentIds: new Set(), exchanges: 0 });
        }
        groupMap.get(key)!.studentIds.add(u.id);
      }

      // Add baseline seed totals for inter-block excitement
      if (groupBy === 'hostel') {
        groupMap.set('Java Block 3', { totalKarma: 480, studentIds: new Set(['usr_aarav_01']), exchanges: 16 });
        groupMap.set('Kalpana Chawla Block B', { totalKarma: 620, studentIds: new Set(['usr_priya_02']), exchanges: 21 });
        groupMap.set('Adhiyaman Hostel', { totalKarma: 390, studentIds: new Set(['usr_rohan_03']), exchanges: 12 });
        groupMap.set('M-Block Green', { totalKarma: 280, studentIds: new Set(), exchanges: 9 });
      } else {
        groupMap.set('Computer Science & Engineering', { totalKarma: 940, studentIds: new Set(['usr_aarav_01']), exchanges: 32 });
        groupMap.set('Electronics & Communication', { totalKarma: 610, studentIds: new Set(['usr_priya_02']), exchanges: 22 });
        groupMap.set('Mechanical Engineering', { totalKarma: 410, studentIds: new Set(['usr_rohan_03']), exchanges: 14 });
        groupMap.set('Information Technology', { totalKarma: 350, studentIds: new Set(), exchanges: 11 });
      }

      for (const t of relevantTxns) {
        if (t.to_user_id) {
          const user = allUsers.find((u) => u.id === t.to_user_id);
          if (user) {
            const key = groupBy === 'department' ? user.department : user.hostel_block;
            if (!groupMap.has(key)) {
              groupMap.set(key, { totalKarma: 0, studentIds: new Set(), exchanges: 0 });
            }
            const record = groupMap.get(key)!;
            record.totalKarma += t.amount;
            record.studentIds.add(user.id);
            record.exchanges += 1;
          }
        }
      }

      const groupedEntries: GroupLeaderboardEntry[] = Array.from(groupMap.entries())
        .map(([groupName, data]) => ({
          rank: 0,
          group_name: groupName,
          total_karma_shared: data.totalKarma,
          active_students: Math.max(1, data.studentIds.size),
          total_exchanges: data.exchanges,
        }))
        .sort((a, b) => b.total_karma_shared - a.total_karma_shared)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      return {
        scope,
        grouped_by: groupBy,
        entries: groupedEntries,
      };
    }

    // Individual User Leaderboard
    const userKarmaMap = new Map<string, { karmaGiven: number; exchangeCount: number }>();

    for (const u of allUsers) {
      userKarmaMap.set(u.id, {
        karmaGiven: u.id === 'usr_priya_02' ? 140 : u.id === 'usr_aarav_01' ? 95 : u.id === 'usr_rohan_03' ? 65 : 20,
        exchangeCount: u.id === 'usr_priya_02' ? 6 : u.id === 'usr_aarav_01' ? 4 : 2,
      });
    }

    for (const t of relevantTxns) {
      if (t.to_user_id) {
        const cur = userKarmaMap.get(t.to_user_id) || { karmaGiven: 0, exchangeCount: 0 };
        cur.karmaGiven += t.amount;
        cur.exchangeCount += 1;
        userKarmaMap.set(t.to_user_id, cur);
      }
    }

    const individualEntries: LeaderboardEntry[] = allUsers
      .map((u) => {
        const stats = userKarmaMap.get(u.id) || { karmaGiven: 0, exchangeCount: 0 };
        return {
          rank: 0,
          id: u.id,
          name: u.name,
          department: u.department,
          hostel_block: u.hostel_block,
          avatar_url: u.avatar_url,
          karma_given: stats.karmaGiven,
          exchanges_count: stats.exchangeCount,
          is_current_user: currentUserId ? u.id === currentUserId : false,
        };
      })
      .sort((a, b) => b.karma_given - a.karma_given)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    let currentUserRank = currentUserId
      ? individualEntries.find((e) => e.id === currentUserId) || null
      : null;

    return {
      scope,
      entries: individualEntries,
      currentUserRank,
    };
  }
}

export const gamificationService = new GamificationService();
