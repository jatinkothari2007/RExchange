import React from 'react';
import { motion } from 'framer-motion';
import { GhostObjectsCanvas } from '../3d/GhostObjectsCanvas';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section className="relative py-28 border-y border-slate-800/80 bg-surface/40 overflow-hidden">
      <GhostObjectsCanvas />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-400 mb-4">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>The Campus Friction Paradox</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Every semester, thousands of rupees worth of student resources sit idle in hostel cupboards.
          </h2>

          <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed">
            Meanwhile, junior students pay full price for calculators they’ll use for two months, 
            scramble for handwritten exam summaries 3 hours before end-sems, and miss out on peer tutoring. 
            Traditional classifieds fail because students don’t want UPI friction or awkward monetary bargaining with peers.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl glass-panel border-slate-800">
              <div className="flex justify-between items-start">
                <span className="text-2xl font-bold font-mono text-rose-400">₹1,200+</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </div>
              <p className="font-bold text-sm text-white mt-2">Wasted per student on single-semester items</p>
              <p className="text-xs text-slate-400 mt-1">Lab coats, drafting tools, reference books tossed after exams.</p>
            </div>

            <div className="p-5 rounded-2xl glass-panel border-slate-800">
              <div className="flex justify-between items-start">
                <span className="text-2xl font-bold font-mono text-emerald-400">100%</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </div>
              <p className="font-bold text-sm text-white mt-2">Cashless circular economy</p>
              <p className="text-xs text-slate-400 mt-1">Give resources to earn Karma. Spend Karma to request what you need.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
