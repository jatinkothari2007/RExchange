import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { api } from '../services/api';
import { UrgentNeed } from '../types';
import { useAuth } from '../context/AuthContext';
import { useKarmaAnimation } from '../context/KarmaAnimationContext';
import {
  Flame,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';

export const NeedsBoardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { triggerKarmaChange } = useKarmaAnimation();

  const [needs, setNeeds] = useState<UrgentNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fulfillingNeed, setFulfillingNeed] = useState<UrgentNeed | null>(null);
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Need form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics & Lab Equipment');
  const [newTags, setNewTags] = useState('');
  const [newKarmaOffered, setNewKarmaOffered] = useState(25);
  const [deadlineHours, setDeadlineHours] = useState(4);
  const [newHostel, setNewHostel] = useState(user?.hostel_block || 'Java Block 3');

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      const data = await api.getNeeds('urgency');
      setNeeds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeeds();
    const interval = setInterval(fetchNeeds, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleCreateNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const deadline = new Date(Date.now() + Number(deadlineHours) * 3600000).toISOString();
    const tags = newTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tags.length === 0) tags.push('urgent', 'campus');

    try {
      await api.createNeed({
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
        tags,
        max_karma_offered: Number(newKarmaOffered),
        target_deadline: deadline,
        hostel_block: newHostel,
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      fetchNeeds();
    } catch (err: any) {
      setError(err.message || 'Failed to post urgent need');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillingNeed) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await api.fulfillNeed(fulfillingNeed.id, fulfillNotes);
      const totalEarned = res.karmaTransferred + res.fulfillerBonusEarned;
      triggerKarmaChange(totalEarned, `Emergency 1.25x Multiplier for "${fulfillingNeed.title.substring(0, 20)}..."`);
      await refreshUser();
      setFulfillingNeed(null);
      fetchNeeds();
    } catch (err: any) {
      setError(err.message || 'Failed to fulfill need');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRemainingTime = (isoDeadline: string) => {
    const diff = new Date(isoDeadline).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins} mins left`;
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-rose-400 font-bold mb-1">
              <Flame className="w-4 h-4 animate-pulse" />
              <span>USP #1 • Dynamic Urgency Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Campus Urgent Needs Board</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Peers in immediate academic or hostel need. Fulfill critical requests to earn a <strong className="text-amber-400">1.25x Karma bonus multiplier</strong>.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Post an Urgent Need</span>
          </button>
        </div>

        {error && (
          <div className="my-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Needs Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
            ))
          ) : needs.length === 0 ? (
            <div className="col-span-2 text-center py-16 glass-panel rounded-3xl p-8">
              <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No active urgent needs</h3>
              <p className="text-xs text-slate-400 mt-1">All campus requests have been fulfilled!</p>
            </div>
          ) : (
            needs.map((need) => {
              const isUrgent = (need.urgency_score || 0) >= 60;
              const isMyNeed = user?.id === need.requester_id;

              return (
                <div
                  key={need.id}
                  className={`p-6 rounded-3xl glass-panel relative flex flex-col justify-between transition-all duration-200 border-l-4 ${
                    isUrgent
                      ? 'border-l-rose-500 hover:border-rose-500/80 shadow-rose-500/5'
                      : 'border-l-amber-500 hover:border-amber-500/80'
                  }`}
                >
                  <div>
                    {/* Urgency Score & Bounty Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-500 pulse-urgent" />
                          <span>Urgency: {need.urgency_score || 50}/100</span>
                        </span>
                        <span className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatRemainingTime(need.target_deadline)}</span>
                        </span>
                      </div>

                      <span className="text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>+{need.max_karma_offered} (+{Math.round(need.max_karma_offered * 0.25)} Bonus)</span>
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {need.title}
                    </h3>

                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {need.description}
                    </p>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {need.tags.map((t, i) => (
                        <span key={i} className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Requester & Fulfill Action */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white text-xs">{need.requester?.name || 'Campus Student'}</p>
                      <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{need.hostel_block}</span>
                      </p>
                    </div>

                    {isMyNeed ? (
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-3 py-1 rounded-lg">
                        Your Request
                      </span>
                    ) : (
                      <button
                        onClick={() => setFulfillingNeed(need)}
                        className="px-4 py-2 rounded-xl bg-amber-400 text-black font-extrabold text-xs hover:bg-amber-300 transition-all flex items-center space-x-1.5 shadow-md"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" />
                        <span>Fulfill Need (1.25x)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Post Need Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-panel-elevated p-6 sm:p-8 rounded-3xl border-slate-700 shadow-2xl">
              <h3 className="text-xl font-bold text-white">Post an Urgent Need</h3>
              <p className="text-xs text-slate-400 mt-1">
                Floats to the top of campus feeds based on deadline urgency.
              </p>

              <form onSubmit={handleCreateNeed} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    What do you urgently need?
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need scientific calculator for 2 PM exam!"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Details & Location
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Where are you? When do you need it by?"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Karma Bounty Offered
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={user?.karma_balance || 300}
                      value={newKarmaOffered}
                      onChange={(e) => setNewKarmaOffered(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Time to Deadline
                    </label>
                    <select
                      value={deadlineHours}
                      onChange={(e) => setDeadlineHours(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                    >
                      <option value={2}>2 Hours (Critical)</option>
                      <option value={4}>4 Hours (High)</option>
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Hostel Block
                  </label>
                  <input
                    type="text"
                    required
                    value={newHostel}
                    onChange={(e) => setNewHostel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                  >
                    {submitting ? 'Posting...' : 'Publish Need'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fulfill Need Confirmation Modal */}
        {fulfillingNeed && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-panel-elevated p-6 sm:p-8 rounded-3xl border-slate-700 shadow-2xl">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase font-bold mb-2">
                <Zap className="w-4 h-4" />
                <span>1.25x Emergency Multiplier Active</span>
              </div>

              <h3 className="text-xl font-bold text-white">Fulfill Urgent Need</h3>
              <p className="text-xs text-slate-300 mt-1">"{fulfillingNeed.title}"</p>

              <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Karma:</span>
                  <span className="font-bold text-white">+{fulfillingNeed.max_karma_offered} Karma</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Emergency Speed Bonus (25%):</span>
                  <span className="font-bold text-amber-400">+{Math.round(fulfillingNeed.max_karma_offered * 0.25)} Karma</span>
                </div>
                <div className="pt-2 border-t border-amber-500/30 flex justify-between font-bold text-sm text-white">
                  <span>Total You Earn:</span>
                  <span className="text-amber-300">+{fulfillingNeed.max_karma_offered + Math.round(fulfillingNeed.max_karma_offered * 0.25)} Karma</span>
                </div>
              </div>

              <form onSubmit={handleFulfillSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Quick Handover Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. I have it right here in Java 3. Can hand it over in 5 mins."
                    value={fulfillNotes}
                    onChange={(e) => setFulfillNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setFulfillingNeed(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 shadow-xl"
                  >
                    {submitting ? 'Confirming...' : 'Confirm Fulfillment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
