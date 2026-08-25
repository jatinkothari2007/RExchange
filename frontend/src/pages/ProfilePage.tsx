import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { KarmaBadge } from '../components/common/KarmaBadge';
import { KarmaWillModal } from '../components/common/KarmaWillModal';
import { api } from '../services/api';
import { UserReputation, KarmaLoan } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Star,
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  TrendingUp,
  History,
  Flame,
  Scroll,
  Zap,
  ArrowRight
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loans, setLoans] = useState<KarmaLoan[]>([]);
  const [activeLoan, setActiveLoan] = useState<KarmaLoan | null>(null);
  const [showWillModal, setShowWillModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        api.getUserReputation(user.id).catch(() => null),
        api.getMyLoans().catch(() => ({ loans: [], active: null })),
      ])
        .then(([rep, loanData]) => {
          if (rep) setReputation(rep);
          if (loanData) {
            setLoans(loanData.loans);
            setActiveLoan(loanData.active);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return null;

  const streak = user.current_streak || 1;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Profile Card Banner */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel-elevated border-slate-700 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center space-x-5">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-amber-400/80 shadow-lg shadow-amber-500/20"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Verified Student
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{user.email}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                  <span className="flex items-center space-x-1 font-mono text-amber-400">
                    <Building className="w-3.5 h-3.5" />
                    <span>{user.hostel_block}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.department} (Year {user.year})</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Karma Balance Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center sm:text-right shrink-0">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Available Balance
              </span>
              <div className="mt-1 flex items-center justify-center sm:justify-end">
                <KarmaBadge points={user.karma_balance} size="lg" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Non-transferable in-app currency</p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 4: Karma Streak Card */}
          <div className="p-6 rounded-3xl glass-panel border-amber-500/30 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Karma Streak (Feature 4)</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                  {streak}w Streak
                </span>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold font-mono text-amber-400">
                  {streak}
                </span>
                <span className="text-sm text-slate-400">consecutive weeks</span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {streak >= 3
                  ? '🔥 3+ Week Streak Active! You earn a +10% Karma Multiplier Bonus on every completed give.'
                  : 'Give items or tutor weekly to reach a 3-week streak and unlock a +10% Karma Multiplier bonus!'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Status:</span>
              <span className="text-emerald-400 font-mono font-bold">Active Giver</span>
            </div>
          </div>

          {/* Feature 1: Senior Karma Will Protocol */}
          <div className="p-6 rounded-3xl glass-panel border-slate-800 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center space-x-1.5">
                  <Scroll className="w-4 h-4 text-amber-400" />
                  <span>Karma Will (Feature 1)</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Year {user.year}
                </span>
              </div>

              <h4 className="font-bold text-white text-base">Senior Legacy Transfer</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {user.will_activated
                  ? 'Your Karma Will has been executed! Your legacy was passed to your nominated junior.'
                  : user.year >= 4
                  ? 'As a final-year student, you can bequeath your remaining Karma & listings to a junior heir.'
                  : 'Available to graduating seniors to pass on campus wealth to juniors.'}
              </p>
            </div>

            <button
              onClick={() => setShowWillModal(true)}
              className="mt-4 w-full py-2.5 rounded-xl border border-amber-500/50 text-amber-300 text-xs font-bold hover:bg-amber-500/10 transition-all flex items-center justify-center space-x-1.5"
            >
              <span>{user.will_activated ? 'View Will Details' : 'Manage Karma Will'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 5: Emergency Karma Loans Tracker */}
          <div className="p-6 rounded-3xl glass-panel border-slate-800 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Micro-Loans (Feature 5)</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  activeLoan
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {activeLoan ? 'Active Loan' : 'Clean Slate'}
                </span>
              </div>

              <h4 className="font-bold text-white text-base">Emergency Karma Loan</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {activeLoan
                  ? `You have an active loan of ${activeLoan.amount} Karma. It will auto-settle on your next completed give.`
                  : 'Zero active loans. You are eligible to borrow up to 15 Karma when requesting urgent resources.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Active Balance:</span>
              <span className="font-mono font-bold text-white">{activeLoan ? `${activeLoan.amount} Karma` : '0 Karma'}</span>
            </div>
          </div>
        </div>

        {/* Reputation & Badges Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trust Score Card */}
          <div className="p-6 rounded-3xl glass-panel border-slate-800">
            <span className="text-xs font-mono uppercase text-slate-500 font-bold">
              Campus Trust Rating
            </span>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold font-mono text-amber-400">
                {reputation?.score.toFixed(1) || '5.0'}
              </span>
              <span className="text-sm text-slate-500">/ 5.0</span>
            </div>
            <div className="flex items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
              <span className="text-xs text-slate-400 ml-2">({reputation?.rating_count || 0} reviews)</span>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Weighted by exchange timeliness, description accuracy, and activity decay.
            </p>
          </div>

          {/* Dynamic Badges Card */}
          <div className="p-6 rounded-3xl glass-panel border-slate-800 md:col-span-2">
            <span className="text-xs font-mono uppercase text-slate-500 font-bold">
              Earned Reputation Badges
            </span>

            <div className="mt-4 flex flex-wrap gap-3">
              {(reputation?.badges || ['New Member', 'Active Contributor']).map((badge, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700 flex items-center space-x-2.5 shadow-sm"
                >
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">{badge}</p>
                    <p className="text-[10px] text-slate-400">Peer verified</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Endorsements breakdown */}
            {reputation?.feedback_summary && Object.keys(reputation.feedback_summary).length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Top Peer Tags</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(reputation.feedback_summary).map(([tag, count]) => (
                    <span
                      key={tag}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {tag} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Karma Will Modal */}
        <KarmaWillModal
          isOpen={showWillModal}
          onClose={() => setShowWillModal(false)}
        />
      </main>
    </div>
  );
};
