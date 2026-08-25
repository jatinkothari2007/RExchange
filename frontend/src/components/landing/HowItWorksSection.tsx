import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Cpu, ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'List or Request',
      description: 'Post items, notes, skills, tickets, or urgent exam needs. Our system heuristic suggests a fair, capped Karma value.',
      icon: PlusCircle,
      tag: '5 Resource Types',
    },
    {
      step: '02',
      title: 'AI Smart-Match',
      description: 'Vector cosine similarity instantly pairs your need with available peers in nearby hostel blocks.',
      icon: Cpu,
      tag: 'Vector Matcher',
    },
    {
      step: '03',
      title: 'Negotiate & Handoff',
      description: 'Chat in-app, make counter-proposals on Karma, and meet at designated campus pickup points.',
      icon: ArrowRightLeft,
      tag: 'In-Thread Escrow',
    },
    {
      step: '04',
      title: 'Mutual Verify & Earn',
      description: 'Both students independently confirm handoff. Karma transfers instantly and logs to the campus impact score.',
      icon: Sparkles,
      tag: 'Karma Settlement',
    },
  ];

  return (
    <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>The RExchange Protocol</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-sans">
          How value moves on campus
        </h2>
        <p className="mt-4 text-base text-slate-400">
          Four automated steps designed for zero-friction peer exchange.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-6 rounded-2xl glass-panel relative group hover:border-amber-500/50 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-3xl font-extrabold font-mono text-slate-700 group-hover:text-amber-400/80 transition-colors">
                  {s.step}
                </span>
                <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {s.tag}
                </span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
