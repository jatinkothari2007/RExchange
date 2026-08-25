import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Flame } from 'lucide-react';
import Strands from '../common/Strands';

interface HeroSectionProps {
  scrollProgress: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ scrollProgress }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-12 pb-24">
      {/* Strands WebGL Background */}
      <div className="absolute inset-0 z-0" style={{ opacity: 0.85 }}>
        <Strands
          colors={["#F59E0B", "#10B981", "#1E293B", "#F97316"]}
          count={4}
          speed={0.35}
          amplitude={1.1}
          waviness={0.9}
          thickness={0.8}
          glow={3.2}
          taper={2.5}
          spread={1.2}
          intensity={0.55}
          saturation={1.4}
          opacity={1}
          scale={1.6}
          glass={false}
        />
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Campus Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-mono text-amber-300 border-amber-500/30 mb-8 shadow-lg shadow-amber-500/5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>SRM University Cashless Economy Protocol</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </motion.div>

        {/* Confident Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-4xl mx-auto font-sans"
        >
          One student's unused stuff becomes{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400">
            value for all.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Exchange textbooks, lab equipment, notes, event tickets, and skills without money.
          Earn and spend non-transferable <span className="text-amber-400 font-semibold">Karma Points</span> across your campus blocks.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-white text-black hover:bg-slate-200 transition-all transform hover:-translate-y-0.5 shadow-xl flex items-center justify-center space-x-2"
          >
            <span>Enter Campus Exchange</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </Link>

          <Link
            to="/feed"
            className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-semibold glass-panel text-slate-200 hover:text-white hover:bg-slate-800/80 transition-all flex items-center justify-center space-x-2 border-slate-700"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Browse Live Feed</span>
          </Link>
        </motion.div>

        {/* Value Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto text-left"
        >
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Zero Cash</p>
              <p className="text-xs text-slate-400">Pure Karma settlement</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Hostel Verified</p>
              <p className="text-xs text-slate-400">Mutual handoff trust</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 col-span-2 sm:col-span-1">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">Urgent Needs</p>
              <p className="text-xs text-slate-400">1.25x emergency bonus</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
