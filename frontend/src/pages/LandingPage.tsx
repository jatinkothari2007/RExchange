import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ImpactCounterSection } from '../components/landing/ImpactCounterSection';
import { SignupCTASection } from '../components/landing/SignupCTASection';
import { Navbar } from '../components/common/Navbar';

export const LandingPage: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      <Navbar />

      <main className="flex-1">
        <HeroSection scrollProgress={scrollProgress} />
        <ProblemSection />
        <HowItWorksSection />
        <ImpactCounterSection />
        <SignupCTASection />
      </main>

      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 RExchange Platform — Designed for SRM Campus Hackathon.</p>
          <div className="flex items-center space-x-6 text-slate-400">
            <span>Non-monetary Circular Economy</span>
            <span>•</span>
            <span>Zero Cash Protocol</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
