import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/common/Navbar';
import { CountUpNumber } from '../components/common/CountUpNumber';
import { api } from '../services/api';
import { ImpactStats } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Leaf,
  DollarSign,
  Clock,
  Sparkles,
  Award,
  Layers,
  ShieldCheck,
  Building
} from 'lucide-react';

export const ImpactDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [personalImpact, setPersonalImpact] = useState<ImpactStats | null>(null);
  const [campusImpact, setCampusImpact] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      user ? api.getPersonalImpact() : Promise.resolve(null),
      api.getCampusImpact(),
    ])
      .then(([personal, campus]) => {
        setPersonalImpact(personal);
        setCampusImpact(campus);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="pb-6 border-b border-slate-800">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-emerald-400 font-bold mb-1">
            <Leaf className="w-4 h-4" />
            <span>USP #3 • Campus Sustainability & ESG Protocol</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Environmental & Economic Impact</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quantified metric telemetry showing rupees saved, items diverted from landfills, and peer tutoring delivered.
          </p>
        </div>

        {/* 1. Personal Impact Section */}
        {user && personalImpact && (
          <div className="mt-8">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Your Personal Contribution ({user.name})</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-2xl glass-panel-elevated border-amber-500/30">
                <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                  <span>Money Saved</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-mono font-extrabold text-white my-2">
                  <CountUpNumber value={personalImpact.money_saved_inr} prefix="₹" />
                </div>
                <p className="text-[11px] text-slate-400">Avoided purchase costs through exchanges</p>
              </div>

              <div className="p-5 rounded-2xl glass-panel-elevated border-emerald-500/30">
                <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                  <span>Waste Diverted</span>
                  <Leaf className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-mono font-extrabold text-white my-2">
                  <CountUpNumber value={personalImpact.waste_diverted_kg} suffix=" kg" decimals={1} />
                </div>
                <p className="text-[11px] text-slate-400">Lab gear & notes kept in campus circulation</p>
              </div>

              <div className="p-5 rounded-2xl glass-panel-elevated border-sky-500/30">
                <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                  <span>Tutoring Given</span>
                  <Clock className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-3xl font-mono font-extrabold text-white my-2">
                  <CountUpNumber value={personalImpact.tutoring_hours} suffix=" hrs" decimals={1} />
                </div>
                <p className="text-[11px] text-slate-400">1-on-1 mentorship delivered</p>
              </div>

              <div className="p-5 rounded-2xl glass-panel-elevated border-slate-700">
                <div className="flex justify-between items-center text-slate-400 text-xs font-mono">
                  <span>Karma Circulated</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div className="text-3xl font-mono font-extrabold text-white my-2">
                  <CountUpNumber value={personalImpact.karma_circulated} />
                </div>
                <p className="text-[11px] text-slate-400">Across {personalImpact.exchanges_count} completed exchanges</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Campus-wide Aggregate Section */}
        {campusImpact && (
          <div className="mt-12">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="w-4 h-4 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Campus-Wide Aggregate Impact (All Blocks)</h2>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Total Campus Savings
                  </span>
                  <div className="text-4xl font-extrabold text-amber-400 font-mono my-2">
                    <CountUpNumber value={campusImpact.money_saved_inr} prefix="₹" />
                  </div>
                  <p className="text-xs text-slate-400">Saved by SRM students this semester</p>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Total Waste Diverted
                  </span>
                  <div className="text-4xl font-extrabold text-emerald-400 font-mono my-2">
                    <CountUpNumber value={campusImpact.waste_diverted_kg} suffix=" kg" decimals={1} />
                  </div>
                  <p className="text-xs text-slate-400">E-waste, books & lab items prevented from dumping</p>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Peer Mentorship Hours
                  </span>
                  <div className="text-4xl font-extrabold text-sky-400 font-mono my-2">
                    <CountUpNumber value={campusImpact.tutoring_hours} suffix=" hrs" decimals={1} />
                  </div>
                  <p className="text-xs text-slate-400">Tutoring & interview prep shared</p>
                </div>

                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Completed Exchanges
                  </span>
                  <div className="text-4xl font-extrabold text-white font-mono my-2">
                    <CountUpNumber value={campusImpact.exchanges_count} />
                  </div>
                  <p className="text-xs text-slate-400">100% cashless mutual handoffs</p>
                </div>
              </div>

              {/* ESG Campus Methodology note */}
              <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Calculation Methodology:</strong> Item savings benchmarked against standard SRM semester textbook & equipment retail prices. E-waste metrics verified via category weight multipliers.
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
