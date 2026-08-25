import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { VoiceNoteRecorder } from '../components/common/VoiceNoteRecorder';
import { api } from '../services/api';
import { ListingType, Listing } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  BookOpen,
  Ticket,
  GraduationCap,
  Briefcase,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calculator,
  CheckCircle,
  AlertCircle,
  Package,
  Layers,
  Check
} from 'lucide-react';

export const CreateListingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode: 'single' | 'bundle'
  const [createMode, setCreateMode] = useState<'single' | 'bundle'>('single');

  // Single listing state
  const [type, setType] = useState<ListingType>('ITEM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics & Lab Equipment');
  const [tagsInput, setTagsInput] = useState('');
  const [pickupPoint, setPickupPoint] = useState(user?.hostel_block ? `${user.hostel_block} or Central Library` : '');
  const [karmaValue, setKarmaValue] = useState<number>(25);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string | undefined>(undefined);

  // Type specific fields
  const [condition, setCondition] = useState<'like_new' | 'good' | 'fair'>('good');
  const [originalPriceEst, setOriginalPriceEst] = useState<number>(800);
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState<number>(3);
  const [pageCount, setPageCount] = useState<number>(45);
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [sessionMode, setSessionMode] = useState<'in_person' | 'online'>('in_person');
  const [organization, setOrganization] = useState('');
  const [roleTitle, setRoleTitle] = useState('');

  // Heuristic suggestion state
  const [suggestedKarma, setSuggestedKarma] = useState<number>(25);
  const [minKarma, setMinKarma] = useState<number>(10);
  const [maxKarma, setMaxKarma] = useState<number>(50);
  const [heuristicReasoning, setHeuristicReasoning] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bundle creation state
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [selectedBundleListingIds, setSelectedBundleListingIds] = useState<string[]>([]);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDesc, setBundleDesc] = useState('');
  const [bundleKarma, setBundleKarma] = useState<number>(35);

  useEffect(() => {
    if (user && createMode === 'bundle') {
      api.getListings({ status: 'available' })
        .then((res) => {
          const mine = res.filter((l) => l.owner_id === user.id);
          setMyListings(mine);
          if (mine.length >= 2) {
            setSelectedBundleListingIds([mine[0].id, mine[1].id]);
          }
        })
        .catch(console.error);
    }
  }, [user, createMode]);

  // Recalculate auto-suggest heuristic whenever parameters change
  useEffect(() => {
    if (createMode === 'single') {
      const fetchSuggestion = async () => {
        try {
          const res = await api.suggestKarma({
            type,
            category,
            condition,
            original_price_est: Number(originalPriceEst),
            duration_minutes: Number(durationMinutes),
            page_count: Number(pageCount),
            tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          });
          setSuggestedKarma(res.suggestedKarma);
          setMinKarma(res.minAllowedKarma);
          setMaxKarma(res.maxAllowedKarma);
          setHeuristicReasoning(res.reasoning);
          setKarmaValue(res.suggestedKarma);
        } catch {}
      };

      fetchSuggestion();
    }
  }, [type, category, condition, originalPriceEst, durationMinutes, pageCount, tagsInput, createMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (createMode === 'bundle') {
      if (selectedBundleListingIds.length < 2) {
        setError('Please select at least 2 listings to create a bundle');
        setLoading(false);
        return;
      }

      try {
        await api.createBundle({
          title: bundleTitle.trim() || 'Custom Multi-Item Bundle',
          description: bundleDesc.trim() || 'Multi-item resource pack',
          karma_value: Number(bundleKarma),
          listing_ids: selectedBundleListingIds,
        });
        navigate('/feed');
      } catch (err: any) {
        setError(err.message || 'Failed to create bundle');
      } finally {
        setLoading(false);
      }
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (tags.length === 0) tags.push('campus');

    try {
      const payload: any = {
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        karma_value: Number(karmaValue),
        pickup_point: pickupPoint.trim() || 'Java Block / Campus Gate',
      };

      if (type === 'ITEM') {
        payload.condition = condition;
        payload.original_price_est = Number(originalPriceEst);
      } else if (type === 'NOTE') {
        payload.subject = subject.trim() || 'Academics';
        payload.semester = Number(semester);
        payload.page_count = Number(pageCount);
      } else if (type === 'TICKET') {
        payload.event_name = eventName.trim() || 'Campus Event';
        payload.event_date = new Date(Date.now() + 7 * 86400000).toISOString();
        payload.venue = venue.trim() || 'TP Ganesan Auditorium';
      } else if (type === 'SKILL') {
        payload.skill_category = category;
        payload.duration_minutes = Number(durationMinutes);
        payload.session_mode = sessionMode;
        if (voiceNoteUrl) payload.voice_note_url = voiceNoteUrl;
      } else if (type === 'OPPORTUNITY') {
        payload.organization = organization.trim() || 'SRM Club';
        payload.role_title = roleTitle.trim() || 'Contributor';
        payload.application_deadline = new Date(Date.now() + 14 * 86400000).toISOString();
      }

      const created = await api.createListing(payload);

      // If voice note was recorded, attach via dedicated endpoint
      if (type === 'SKILL' && voiceNoteUrl) {
        try {
          await api.uploadVoiceNote(created.id, voiceNoteUrl);
        } catch {}
      }

      navigate(`/listings/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const typeCards = [
    { type: 'ITEM' as const, label: 'Physical Item', desc: 'Calculators, lab coats, drafters, IoT kits', icon: Box },
    { type: 'NOTE' as const, label: 'Study Notes', desc: 'Handwritten notes, solved papers, lab manuals', icon: BookOpen },
    { type: 'TICKET' as const, label: 'Event Pass', desc: 'Milan, Aarush, TEDx passes & pro-nite wristbands', icon: Ticket },
    { type: 'SKILL' as const, label: 'Skill / Tutoring', desc: '1-on-1 tutoring, mock interviews, coding help', icon: GraduationCap },
    { type: 'OPPORTUNITY' as const, label: 'Hackathon Role', desc: 'Hackathon team slots, club recruitment', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/feed" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Explore</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Post on Campus Exchange</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Give resources to peers in exchange for Karma Points. No real money required.
            </p>
          </div>

          {/* Create Mode Switcher */}
          <div className="p-1 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setCreateMode('single')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                createMode === 'single' ? 'bg-amber-400 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Resource
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('bundle')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                createMode === 'bundle' ? 'bg-amber-400 text-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Bundle Pack (Feature 2)</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {createMode === 'bundle' ? (
            /* ================= FEATURE 2: BUNDLE CREATION FLOW ================= */
            <div className="space-y-6">
              <div className="p-6 rounded-3xl glass-panel border-amber-500/30 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 font-bold uppercase">
                  <Package className="w-4 h-4" />
                  <span>Combine Multiple Active Listings into 1 Bundle</span>
                </div>
                <h3 className="text-lg font-bold text-white">Select Listings to Bundle</h3>
                <p className="text-xs text-slate-400">
                  Pick 2 or more of your active listings. They will be bundled under a single attractive combined Karma value.
                </p>

                {myListings.length < 2 ? (
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                    You currently have {myListings.length} active listings. Create at least 2 single listings first, or switch to Single Resource mode above.
                  </div>
                ) : (
                  <div className="space-y-2 mt-3">
                    {myListings.map((l) => {
                      const isSel = selectedBundleListingIds.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            if (isSel) {
                              setSelectedBundleListingIds((prev) => prev.filter((id) => id !== l.id));
                            } else {
                              setSelectedBundleListingIds((prev) => [...prev, l.id]);
                            }
                          }}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isSel
                              ? 'bg-amber-500/15 border-amber-500/60 text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSel ? 'bg-amber-400 border-amber-400 text-black' : 'border-slate-600'}`}>
                              {isSel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{l.title}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{l.type} • Original {l.karma_value} Karma</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 rounded-3xl glass-panel border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Bundle Package Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5th Sem ECE Complete Exam Pack (Breadboard + DSP Notes)"
                    value={bundleTitle}
                    onChange={(e) => setBundleTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Bundle Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain what is included and why taking them together is beneficial..."
                    value={bundleDesc}
                    onChange={(e) => setBundleDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Combined Bundle Karma Value</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    required
                    value={bundleKarma}
                    onChange={(e) => setBundleKarma(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-lg focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ================= SINGLE LISTING FLOW ================= */
            <>
              {/* 1. Category / Type Picker */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-3">
                  Select Resource Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {typeCards.map((card) => {
                    const Icon = card.icon;
                    const isSelected = type === card.type;
                    return (
                      <button
                        type="button"
                        key={card.type}
                        onClick={() => {
                          setType(card.type);
                          if (card.type === 'ITEM') setCategory('Electronics & Lab Equipment');
                          if (card.type === 'NOTE') setCategory('Study Notes & Academics');
                          if (card.type === 'TICKET') setCategory('Campus Event Passes');
                          if (card.type === 'SKILL') setCategory('Peer Mentoring');
                          if (card.type === 'OPPORTUNITY') setCategory('Hackathon Teams');
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                            : 'glass-panel border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          {isSelected && <CheckCircle className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{card.label}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">{card.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. General Details */}
              <div className="p-6 rounded-3xl glass-panel border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white">General Information</h3>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Listing Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Casio Scientific Calculator fx-991EX ClassWiz"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe condition, working status, or session details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  />
                </div>

                {/* Feature 3: Voice Note Recorder for SKILL Listings */}
                {type === 'SKILL' && (
                  <VoiceNoteRecorder
                    onRecorded={(url) => setVoiceNoteUrl(url)}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Pickup / Meeting Point</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Java Block 3 entrance"
                      value={pickupPoint}
                      onChange={(e) => setPickupPoint(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Search Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. casio, calculator, maths, exam"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Type Specific Field Inputs */}
              <div className="p-6 rounded-3xl glass-panel border-slate-800 space-y-4">
                <h3 className="text-base font-bold text-white">Specific Parameters ({type})</h3>

                {type === 'ITEM' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Item Condition</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      >
                        <option value="like_new">Like New (Mint)</option>
                        <option value="good">Good (Fully Functional)</option>
                        <option value="fair">Fair (Visible Wear)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Original Price (₹ INR Estimate)</label>
                      <input
                        type="number"
                        min={0}
                        value={originalPriceEst}
                        onChange={(e) => setOriginalPriceEst(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {type === 'NOTE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Subject Code / Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Operating Systems (18CSC302J)"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Semester</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={semester}
                        onChange={(e) => setSemester(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Page Count</label>
                      <input
                        type="number"
                        min={1}
                        value={pageCount}
                        onChange={(e) => setPageCount(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {type === 'TICKET' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Event Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Milan 2026 Pro-Nite VIP Pass"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Venue</label>
                      <input
                        type="text"
                        placeholder="e.g. TP Ganesan Auditorium Arena"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {type === 'SKILL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min={15}
                        max={360}
                        step={15}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Session Mode</label>
                      <select
                        value={sessionMode}
                        onChange={(e) => setSessionMode(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      >
                        <option value="in_person">In-Person (Campus Library / Lab)</option>
                        <option value="online">Online (Google Meet / Discord)</option>
                      </select>
                    </div>
                  </div>
                )}

                {type === 'OPPORTUNITY' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Organization / Club</label>
                      <input
                        type="text"
                        placeholder="e.g. SRM Smart India Hackathon Hub"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Role Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Embedded IoT / Firmware Developer"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Algorithmic Karma Valuation & Override */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                      Algorithmic Karma Valuation
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Suggested: {suggestedKarma} Karma
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {heuristicReasoning}
                </p>

                <div className="pt-2">
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-slate-400">Allowed range: {minKarma} - {maxKarma} Karma</span>
                    <span className="text-amber-300 font-bold">{karmaValue} Karma</span>
                  </div>
                  <input
                    type="range"
                    min={minKarma}
                    max={maxKarma}
                    value={karmaValue}
                    onChange={(e) => setKarmaValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-extrabold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center justify-center space-x-2 text-sm shadow-xl shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Publishing...' : createMode === 'bundle' ? 'Publish Multi-Item Bundle' : 'Publish Campus Listing'}</span>
          </button>
        </form>
      </main>
    </div>
  );
};
