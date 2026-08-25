import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { KarmaBadge } from '../components/common/KarmaBadge';
import { SpotlightCarousel } from '../components/feed/SpotlightCarousel';
import { BundleCard } from '../components/feed/BundleCard';
import { KarmaWillModal } from '../components/common/KarmaWillModal';
import { api } from '../services/api';
import { Listing, ListingBundle, UrgentNeed, MatchSuggestion } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Flame,
  Sparkles,
  MapPin,
  BookOpen,
  Box,
  Ticket,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Plus,
  Package,
  Scroll,
  ArrowRight
} from 'lucide-react';

export const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bundles, setBundles] = useState<ListingBundle[]>([]);
  const [urgentNeeds, setUrgentNeeds] = useState<UrgentNeed[]>([]);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [showWillModal, setShowWillModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFeedData = async () => {
    setLoading(true);
    try {
      const [listData, bundleData, needsData, matchData] = await Promise.all([
        api.getListings({ type: activeType !== 'ALL' && activeType !== 'BUNDLE' ? activeType : undefined, q: searchQuery }),
        api.getBundles('available'),
        api.getNeeds('urgency'),
        user ? api.getSuggestions(3) : Promise.resolve([]),
      ]);

      setListings(listData);
      setBundles(bundleData);
      setUrgentNeeds(needsData.slice(0, 3));
      setSuggestions(matchData);
    } catch (err) {
      console.error('Error fetching feed data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedData();
  }, [activeType, searchQuery, user]);

  const handleFeedback = async (listingId: string, thumbsUp: boolean) => {
    try {
      await api.sendMatchFeedback(listingId, thumbsUp);
      setSuggestions((prev) => prev.filter((s) => s.listing.id !== listingId));
    } catch {}
  };

  const handleClaimBundle = async (bundle: ListingBundle) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const exc = await api.requestBundleExchange(bundle.id);
      navigate(`/exchanges/${exc.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to claim bundle');
    }
  };

  const typeChips = [
    { type: 'ALL', label: 'All Resources', icon: Sparkles },
    { type: 'BUNDLE', label: 'Bundle Packs 📦', icon: Package },
    { type: 'ITEM', label: 'Items & Lab Gear', icon: Box },
    { type: 'NOTE', label: 'Study Notes', icon: BookOpen },
    { type: 'TICKET', label: 'Fest Tickets', icon: Ticket },
    { type: 'SKILL', label: 'Skills & Tutoring', icon: GraduationCap },
    { type: 'OPPORTUNITY', label: 'Opportunities', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Feature 1: Final-Year Senior Karma Will Prompt Banner */}
        {user && user.year >= 4 && !user.will_activated && (
          <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-sm sm:text-base">
                  Graduating Senior? Pass on your Karma Legacy
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Nominate a junior heir to inherit your {user.karma_balance} Karma and unclaimed listings.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWillModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-all flex items-center justify-center space-x-1.5 shrink-0 shadow-md"
            >
              <span>Set Karma Will</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Campus Resource Exchange
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live peer listings from Java Block, KC Block, Adhiyaman, and SRM Tech Park.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search calculator, OS notes, Milan pass..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <Link
              to="/create"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Post</span>
            </Link>
          </div>
        </div>

        {/* Feature 6: Cross-Department Skill Spotlight Carousel */}
        <div className="mt-6">
          <SpotlightCarousel
            onSelectSkill={(skill) => {
              if (skill.listing_id) navigate(`/listings/${skill.listing_id}`);
            }}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto py-2 scrollbar-none">
          {typeChips.map((chip) => {
            const Icon = chip.icon;
            const isSelected = activeType === chip.type;
            return (
              <button
                key={chip.type}
                onClick={() => setActiveType(chip.type)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                    : 'glass-panel text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* AI Smart Match "Suggested for You" Highlight Bar */}
        {suggestions.length > 0 && activeType !== 'BUNDLE' && (
          <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900 border border-amber-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  AI Smart-Match Suggestions for You
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Vector Cosine Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestions.map((item) => (
                <div
                  key={item.listing.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {Math.round(item.match_score * 100)}% Match
                      </span>
                      <KarmaBadge points={item.listing.karma_value} size="sm" />
                    </div>
                    <Link to={`/listings/${item.listing.id}`}>
                      <h4 className="font-bold text-sm text-white mt-2 line-clamp-1 hover:text-amber-400 transition-colors">
                        {item.listing.title}
                      </h4>
                    </Link>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{item.listing.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.similarity_explanation}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                    <Link
                      to={`/listings/${item.listing.id}`}
                      className="text-xs text-amber-400 font-semibold flex items-center space-x-1 hover:underline"
                    >
                      <span>Request</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleFeedback(item.listing.id, true)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Relevant match"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(item.listing.id, false)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Not relevant"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature 2: Multi-Item Bundles Section / Filter */}
        {activeType === 'BUNDLE' ? (
          <div className="my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                  Multi-Item Bundle Deals (Feature 2)
                </h3>
              </div>
              <span className="text-xs text-slate-400">{bundles.length} bundle packs</span>
            </div>

            {bundles.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-3xl p-8">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No active bundle deals</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Combine 2 or more of your active listings into a single discounted bundle to exchange together!
                </p>
                <Link
                  to="/create"
                  className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Bundle Pack</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {bundles.map((bundle) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    onRequestExchange={handleClaimBundle}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          activeType === 'ALL' && bundles.length > 0 && (
            <div className="my-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                    Multi-Item Bundle Deals (Feature 2)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">{bundles.length} bundle packs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {bundles.map((bundle) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    onRequestExchange={handleClaimBundle}
                  />
                ))}
              </div>
            </div>
          )
        )}


        {/* Main Listings Grid */}
        {activeType !== 'BUNDLE' && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Available Peer Resources ({listings.length})</h3>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-64 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-3xl p-8">
                <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No listings found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Be the first to list an item or note for this category to earn Karma points!
                </p>
                <Link
                  to="/create"
                  className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-400 text-black font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Listing</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((item) => (
                  <Link
                    key={item.id}
                    to={`/listings/${item.id}`}
                    className="group rounded-2xl glass-panel p-5 flex flex-col justify-between hover:border-amber-500/40 hover:bg-slate-800/60 transition-all duration-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Header: Type Tag & Karma Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.type}
                          </span>
                          {/* Feature 1: Willed Tag */}
                          {item.willed_from_name && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              📜 Willed
                            </span>
                          )}
                          {/* Feature 3: Voice Note indicator */}
                          {item.type === 'SKILL' && item.voice_note_url && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              🎙️ Voice
                            </span>
                          )}
                        </div>
                        <KarmaBadge points={item.karma_value} size="sm" />
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {item.title}
                      </h4>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Pickup location & Owner */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center space-x-1 text-[11px] truncate max-w-[180px]">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{item.pickup_point}</span>
                      </span>

                      <span className="text-amber-400 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
                        View →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Karma Will Modal */}
        <KarmaWillModal
          isOpen={showWillModal}
          onClose={() => setShowWillModal(false)}
        />
      </main>
    </div>
  );
};
