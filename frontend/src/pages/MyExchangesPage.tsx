import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { KarmaBadge } from '../components/common/KarmaBadge';
import { HandoffQrModal } from '../components/common/HandoffQrModal';
import { api } from '../services/api';
import { Exchange, ExchangeStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useKarmaAnimation } from '../context/KarmaAnimationContext';
import {
  ArrowRightLeft,
  MessageSquare,
  CheckCircle2,
  Clock,
  Check,
  AlertTriangle,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Star,
  QrCode,
  Flame,
  Package
} from 'lucide-react';

export const MyExchangesPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { triggerKarmaChange } = useKarmaAnimation();

  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingExchange, setRatingExchange] = useState<Exchange | null>(null);
  const [qrModalExchange, setQrModalExchange] = useState<Exchange | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['on time', 'item as described']);
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const data = await api.getExchanges();
      setExchanges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

  const handleAccept = async (exchangeId: string) => {
    try {
      await api.acceptExchange(exchangeId);
      fetchExchanges();
    } catch (err: any) {
      setError(err.message || 'Failed to accept exchange');
    }
  };

  const handleConfirmHandoff = async (exchangeId: string) => {
    try {
      const res = await api.confirmHandoff(exchangeId);
      if (res.completed && res.karmaTransferred) {
        const isGiver = res.exchange.giver_id === user?.id;
        triggerKarmaChange(
          isGiver ? res.karmaTransferred : -res.karmaTransferred,
          isGiver ? 'Exchange Completed! Karma Earned' : 'Exchange Settled'
        );
        await refreshUser();
      }
      fetchExchanges();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm handoff');
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingExchange) return;

    try {
      await api.rateExchange(ratingExchange.id, ratingVal, selectedTags, reviewComment);
      setRatingExchange(null);
      fetchExchanges();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating');
    }
  };

  const columns: { status: ExchangeStatus; label: string; count: number; color: string }[] = [
    { status: 'REQUESTED', label: 'Requested', count: exchanges.filter((e) => e.status === 'REQUESTED').length, color: 'text-amber-400' },
    { status: 'ACCEPTED', label: 'Accepted / Meetup', count: exchanges.filter((e) => e.status === 'ACCEPTED').length, color: 'text-sky-400' },
    { status: 'HANDOFF_CONFIRMED', label: 'Handoff Pending', count: exchanges.filter((e) => e.status === 'HANDOFF_CONFIRMED').length, color: 'text-indigo-400' },
    { status: 'COMPLETED', label: 'Completed', count: exchanges.filter((e) => e.status === 'COMPLETED').length, color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Resource Exchanges
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Deterministic 4-stage state machine: Requested → Accepted → Handoff Verified → Completed.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              Total: <strong>{exchanges.length}</strong> exchanges
            </span>
          </div>
        </div>

        {error && (
          <div className="my-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4-Stage Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          {columns.map((col) => {
            const colExchanges = exchanges.filter((e) => e.status === col.status);

            return (
              <div
                key={col.status}
                className="p-4 rounded-3xl glass-panel border-slate-800/80 flex flex-col min-h-[480px]"
              >
                {/* Column Title */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                      {col.label}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {col.count}
                  </span>
                </div>

                {/* Cards in this stage */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colExchanges.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-center p-4 text-xs text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                      No exchanges in this stage
                    </div>
                  ) : (
                    colExchanges.map((exc) => {
                      const isGiver = user?.id === exc.giver_id;
                      const peer = isGiver ? exc.receiver : exc.giver;
                      const myConfirmed = isGiver ? exc.giver_confirmed : exc.receiver_confirmed;
                      const peerConfirmed = isGiver ? exc.receiver_confirmed : exc.giver_confirmed;
                      const title = exc.bundle ? `Bundle: ${exc.bundle.title}` : (exc.listing?.title || 'Campus Resource');

                      return (
                        <div
                          key={exc.id}
                          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all text-xs flex flex-col justify-between space-y-3 shadow-md"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                                {isGiver ? 'Giving' : 'Receiving'}
                              </span>
                              <KarmaBadge points={exc.agreed_karma} size="sm" />
                            </div>

                            <h4 className="font-bold text-white text-sm mt-1.5 line-clamp-1">
                              {title}
                            </h4>

                            <div className="mt-2 text-slate-400 flex items-center space-x-1.5 text-[11px]">
                              <span>With:</span>
                              <strong className="text-slate-200">{peer?.name || 'Peer'}</strong>
                              {peer?.current_streak && peer.current_streak >= 1 && (
                                <span className="text-[10px] font-mono text-amber-400">
                                  🔥 {peer.current_streak}w
                                </span>
                              )}
                            </div>

                            {exc.notes && (
                              <p className="mt-2 text-[11px] text-slate-400 bg-slate-950/80 p-2 rounded-lg italic">
                                "{exc.notes}"
                              </p>
                            )}
                          </div>

                          {/* Action Footers per State */}
                          <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            {/* Chat Thread Trigger */}
                            <Link
                              to={`/exchanges/${exc.id}/chat`}
                              className="w-full py-1.5 rounded-lg glass-panel hover:bg-slate-800 text-slate-300 font-semibold flex items-center justify-center space-x-1.5 text-xs transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                              <span>Chat & Negotiate</span>
                            </Link>

                            {/* REQUESTED state: Giver can Accept */}
                            {exc.status === 'REQUESTED' && isGiver && (
                              <button
                                onClick={() => handleAccept(exc.id)}
                                className="w-full py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center justify-center space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Request</span>
                              </button>
                            )}

                            {/* ACCEPTED / HANDOFF state: QR Scan & Confirm button */}
                            {(exc.status === 'ACCEPTED' || exc.status === 'HANDOFF_CONFIRMED') && (
                              <div className="space-y-1.5">
                                {/* Feature 7: QR Code button */}
                                <button
                                  onClick={() => setQrModalExchange(exc)}
                                  className="w-full py-2 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-all flex items-center justify-center space-x-1.5 shadow-md"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>{isGiver ? 'Show Handoff QR' : 'Scan QR Code'}</span>
                                </button>

                                {myConfirmed ? (
                                  <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center font-mono text-[10px]">
                                    ✓ Manual confirmed • Waiting for peer
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleConfirmHandoff(exc.id)}
                                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700"
                                  >
                                    <span>Manual Confirm (Fallback)</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* COMPLETED state: Rate button */}
                            {exc.status === 'COMPLETED' && (
                              <button
                                onClick={() => setRatingExchange(exc)}
                                className="w-full py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 hover:bg-amber-500/30 flex items-center justify-center space-x-1"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>Rate Exchange</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature 7: QR Handoff Modal */}
        {qrModalExchange && (
          <HandoffQrModal
            isOpen={Boolean(qrModalExchange)}
            exchangeId={qrModalExchange.id}
            handoffCode={qrModalExchange.handoff_code || 'REX789'}
            agreedKarma={qrModalExchange.agreed_karma}
            isGiver={user?.id === qrModalExchange.giver_id}
            onClose={() => setQrModalExchange(null)}
            onSuccess={() => {
              fetchExchanges();
              refreshUser();
            }}
          />
        )}

        {/* Rating Modal */}
        {ratingExchange && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-panel-elevated p-6 sm:p-8 rounded-3xl border-slate-700 shadow-2xl">
              <h3 className="text-xl font-bold text-white">Rate Peer Exchange</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your review updates peer reputation and unlocks badges on campus.
              </p>

              <form onSubmit={handleRateSubmit} className="mt-6 space-y-4">
                {/* 5-Star selector */}
                <div className="flex items-center justify-center space-x-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingVal(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratingVal
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Feedback tag pills */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-2">
                    Select Feedback Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['on time', 'item as described', 'quick response', 'polite', 'fair pricing', 'great notes'].map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTags((prev) => prev.filter((t) => t !== tag));
                            } else {
                              setSelectedTags((prev) => [...prev, tag]);
                            }
                          }}
                          className={`text-xs px-3 py-1 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-black border-amber-400 font-bold'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Written Feedback (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe how the exchange went..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRatingExchange(null)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300"
                  >
                    Submit Review
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
