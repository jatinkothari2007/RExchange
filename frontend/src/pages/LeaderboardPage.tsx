import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { api } from '../services/api';
import { LeaderboardEntry, GroupLeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Trophy,
  Medal,
  Sparkles,
  Building,
  GraduationCap,
  Users,
  Flame,
  ArrowUp
} from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [scope, setScope] = useState<'week' | 'alltime'>('alltime');
  const [viewMode, setViewMode] = useState<'individual' | 'department' | 'hostel'>('individual');
  const [entries, setEntries] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const groupBy = viewMode === 'individual' ? undefined : viewMode;
    api.getLeaderboard(scope, groupBy)
      .then((res) => {
        setEntries(res.entries);
        if (res.currentUserRank) setMyRank(res.currentUserRank);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [scope, viewMode, user]);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col pb-24">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="pb-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-amber-400 font-bold mb-1">
              <Trophy className="w-4 h-4" />
              <span>Campus Karma Standings</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Inter-Block Leaderboard</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Honoring students and hostel blocks creating the highest circular exchange value on campus.
            </p>
          </div>

          {/* Scope Toggle (Week / All-Time) */}
          <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl shrink-0">
            <button
              onClick={() => setScope('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scope === 'week' ? 'bg-amber-400 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setScope('alltime')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scope === 'alltime' ? 'bg-amber-400 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* View Mode Chips (Individual / Department / Hostel) */}
        <div className="flex items-center space-x-2 my-6">
          {[
            { id: 'individual', label: 'Top Students', icon: Users },
            { id: 'hostel', label: 'Hostel Blocks', icon: Building },
            { id: 'department', label: 'Departments', icon: GraduationCap },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSel = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSel
                    ? 'bg-slate-800 text-white border border-amber-500/50 shadow-md'
                    : 'glass-panel text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="rounded-3xl glass-panel border-slate-800 overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-16 rounded-2xl bg-slate-900/60 animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500 font-mono">
              No leaderboard data yet. Start exchanging to rank!
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {entries.map((entry, idx) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;
                const isCurrentUser = viewMode === 'individual' && user && entry.id === user.id;

                return (
                  <div
                    key={idx}
                    className={`p-4 sm:p-5 flex items-center justify-between transition-colors ${
                      isCurrentUser
                        ? 'bg-amber-500/10 border-l-4 border-l-amber-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank Medal / Number */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-extrabold text-sm shrink-0">
                        {isTop1 ? (
                          <span className="text-amber-400 text-lg">🥇</span>
                        ) : isTop2 ? (
                          <span className="text-slate-300 text-lg">🥈</span>
                        ) : isTop3 ? (
                          <span className="text-amber-600 text-lg">🥉</span>
                        ) : (
                          <span className="text-slate-500 text-xs">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Details */}
                      {viewMode === 'individual' ? (
                        <div className="flex items-center space-x-3">
                          <img
                            src={entry.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={entry.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 hidden sm:block"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-sm text-white">{entry.name}</h4>
                              {isCurrentUser && (
                                <span className="text-[10px] font-mono font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {entry.department} • <span className="text-amber-400/80 font-mono">{entry.hostel_block}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-white">{entry.group_name}</h4>
                          <p className="text-xs text-slate-400">
                            {entry.active_students} active peers • {entry.total_exchanges} exchanges
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Karma Stat */}
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-mono font-extrabold text-amber-400">
                        {viewMode === 'individual' ? entry.karma_given : entry.total_karma_shared} <span className="text-xs font-sans text-slate-400 font-normal">Karma</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {viewMode === 'individual' ? `${entry.exchanges_count} resources given` : 'total volume'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Current User Rank Bar (if scrolled down) */}
        {viewMode === 'individual' && user && myRank && (
          <div className="fixed bottom-4 left-4 right-4 max-w-5xl mx-auto z-30">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border-2 border-amber-400/80 shadow-2xl flex items-center justify-between backdrop-blur-xl">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-extrabold text-amber-400 text-sm">
                  #{myRank.rank}
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Your Campus Position ({user.name})</p>
                  <p className="text-[11px] text-slate-400">{user.hostel_block}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm font-mono font-bold text-amber-400">
                  {myRank.karma_given} Karma Given
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
