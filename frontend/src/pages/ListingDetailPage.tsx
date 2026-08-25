import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { KarmaBadge } from '../components/common/KarmaBadge';
import { VoiceNotePlayer } from '../components/common/VoiceNotePlayer';
import { EmergencyLoanModal } from '../components/common/EmergencyLoanModal';
import { api } from '../services/api';
import { Listing, UserReputation } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Clock,
  Award,
  Star,
  CheckCircle,
  ArrowRightLeft,
  ArrowLeft,
  Share2,
  Calendar,
  BookOpen,
  Box,
  Tag,
  AlertTriangle,
  Flame,
  Scroll,
  Zap
} from 'lucide-react';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [ownerReputation, setOwnerReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [requestKarma, setRequestKarma] = useState<number>(20);
  const [notes, setNotes] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      api.getListingById(id)
        .then((data) => {
          setListing(data);
          setRequestKarma(data.karma_value);
          if (data.owner_id) {
            api.getUserReputation(data.owner_id)
              .then((rep) => setOwnerReputation(rep))
              .catch(() => {});
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleRequestExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.karma_balance < requestKarma) {
      setShowLoanModal(true);
      return;
    }

    setRequesting(true);
    setError(null);
    try {
      const exchange = await api.requestExchange(listing.id, requestKarma, notes);
      setShowRequestModal(false);
      navigate(`/exchanges/${exchange.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit exchange request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div>
            <h2 className="text-xl font-bold">Listing not found</h2>
            <Link to="/feed" className="mt-4 inline-block text-amber-400 text-sm hover:underline">
              ← Return to Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.owner_id;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Link */}
        <Link
          to="/feed"
          className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-slate-400 hover:text-amber-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                    {listing.type} • {listing.category}
                  </span>

                  {/* Feature 1: Willed from Senior Tag */}
                  {listing.willed_from_name && (
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                      <Scroll className="w-3.5 h-3.5" />
                      <span>Willed from {listing.willed_from_name}</span>
                    </span>
                  )}
                </div>

                <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  listing.status === 'available' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                }`}>
                  {listing.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {listing.title}
              </h1>

              {/* Feature 3: Voice Note Player for SKILL */}
              {listing.type === 'SKILL' && (listing as any).voice_note_url && (
                <div className="mt-4">
                  <VoiceNotePlayer url={(listing as any).voice_note_url} />
                </div>
              )}

              <div className="mt-6 text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>

              {/* Type-Specific Details Box */}
              <div className="mt-8 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 gap-4 text-xs">
                {listing.type === 'ITEM' && (
                  <>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Condition:</span>
                      <p className="font-bold text-white mt-0.5 capitalize">{(listing as any).condition?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Estimated Price:</span>
                      <p className="font-bold text-emerald-400 mt-0.5">₹{(listing as any).original_price_est || 500} saved</p>
                    </div>
                  </>
                )}

                {listing.type === 'NOTE' && (
                  <>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Subject:</span>
                      <p className="font-bold text-white mt-0.5">{(listing as any).subject}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Semester:</span>
                      <p className="font-bold text-white mt-0.5">Semester {(listing as any).semester}</p>
                    </div>
                  </>
                )}

                {listing.type === 'TICKET' && (
                  <>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Event:</span>
                      <p className="font-bold text-white mt-0.5">{(listing as any).event_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Venue:</span>
                      <p className="font-bold text-white mt-0.5">{(listing as any).venue}</p>
                    </div>
                  </>
                )}

                {listing.type === 'SKILL' && (
                  <>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Duration:</span>
                      <p className="font-bold text-white mt-0.5">{(listing as any).duration_minutes} Minutes</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-mono">Mode:</span>
                      <p className="font-bold text-white mt-0.5 capitalize">{(listing as any).session_mode}</p>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-mono">Campus Pickup:</span>
                  <p className="font-bold text-white mt-0.5 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 inline" />
                    <span>{listing.pickup_point}</span>
                  </p>
                </div>

                <div>
                  <span className="text-slate-500 uppercase tracking-wider font-mono">Expires on:</span>
                  <p className="font-bold text-white mt-0.5">
                    {new Date(listing.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-6 flex flex-wrap gap-1.5">
                {listing.tags.map((t, idx) => (
                  <span key={idx} className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action & Owner Sidebar (1 col) */}
          <div className="space-y-6">
            {/* Exchange Action Card */}
            <div className="p-6 rounded-3xl glass-panel-elevated border-slate-700 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">Required Exchange Value</span>
                <KarmaBadge points={listing.karma_value} size="lg" />
              </div>

              {isOwner ? (
                <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-300 text-center font-medium">
                  This is your listing.
                </div>
              ) : listing.status !== 'available' ? (
                <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-400 text-center font-medium">
                  Listing is currently {listing.status}.
                </div>
              ) : (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="w-full py-4 rounded-2xl font-extrabold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center justify-center space-x-2 text-sm shadow-xl shadow-amber-500/20"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Request Exchange</span>
                </button>
              )}

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Karma settles only after mutual handoff verification. Zero fiat money required.
              </p>
            </div>

            {/* Owner Profile & Reputation Card */}
            {listing.owner && (
              <div className="p-6 rounded-3xl glass-panel border-slate-800 space-y-4">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Listing Owner
                </span>

                <div className="flex items-center space-x-3 pt-1">
                  <img
                    src={listing.owner.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={listing.owner.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-white">{listing.owner.name}</h4>
                      {/* Feature 4: Karma Streak Flame Badge */}
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{listing.owner.current_streak || 1}w</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{listing.owner.department}</p>
                    <p className="text-[11px] text-amber-400 font-mono mt-0.5">{listing.owner.hostel_block}</p>
                  </div>
                </div>

                {ownerReputation && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Campus Trust Rating:</span>
                      <span className="flex items-center space-x-1 font-bold text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{ownerReputation.score.toFixed(1)} / 5.0</span>
                        <span className="text-slate-500 font-normal">({ownerReputation.rating_count})</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ownerReputation.badges.map((b, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center space-x-1"
                        >
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>{b}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Request Exchange Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-panel-elevated p-6 sm:p-8 rounded-3xl border-slate-700 shadow-2xl">
              <h3 className="text-xl font-bold text-white">Request Peer Exchange</h3>
              <p className="text-xs text-slate-400 mt-1">
                Initiate handoff contract for "{listing.title}"
              </p>

              <form onSubmit={handleRequestExchange} className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono uppercase text-slate-300">
                      Offered Karma Points
                    </label>
                    {user && user.karma_balance < requestKarma && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRequestModal(false);
                          setShowLoanModal(true);
                        }}
                        className="text-[10px] font-mono text-amber-400 hover:underline flex items-center space-x-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Borrow {requestKarma - user.karma_balance} Karma</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min={5}
                    value={requestKarma}
                    onChange={(e) => setRequestKarma(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Your balance: <strong>{user?.karma_balance} Karma</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                    Message to Owner
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Can meet at Java block ground floor today around 5 PM."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requesting}
                    className="flex-1 py-3 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300"
                  >
                    {requesting ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Feature 5: Emergency Loan Modal */}
        <EmergencyLoanModal
          isOpen={showLoanModal}
          requiredKarma={requestKarma}
          onClose={() => setShowLoanModal(false)}
          onLoanApproved={() => setShowRequestModal(true)}
        />
      </main>
    </div>
  );
};
