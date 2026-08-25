import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SpotlightItem } from '../../types';
import { Sparkles, GraduationCap, Flame, ArrowRight, ArrowRightLeft, Clock } from 'lucide-react';
import { KarmaBadge } from '../common/KarmaBadge';

interface SpotlightCarouselProps {
  onSelectSkill?: (item: SpotlightItem) => void;
}

export const SpotlightCarousel: React.FC<SpotlightCarouselProps> = ({ onSelectSkill }) => {
  const [spotlights, setSpotlights] = useState<SpotlightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCrossDepartmentSpotlight()
      .then(setSpotlights)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || spotlights.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="w-4 h-4 text-amber-400" />
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wider font-mono">
            Cross-Department Skill Spotlight
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Inter-Major Learning
          </span>
        </div>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-3 scrollbar-thin">
        {spotlights.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectSkill && onSelectSkill(item)}
            className="w-72 sm:w-80 shrink-0 p-4 rounded-2xl glass-panel-elevated border-slate-700/80 hover:border-amber-500/60 transition-all cursor-pointer group shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                {item.badge}
              </span>
              <KarmaBadge points={item.karma_value} size="sm" />
            </div>

            <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
              {item.title}
            </h4>
            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              {item.description}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-300 truncate max-w-[120px]">
                  {item.giver_name}
                </span>
                {item.giver_streak && item.giver_streak >= 1 && (
                  <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center">
                    🔥 {item.giver_streak}w
                  </span>
                )}
              </div>

              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{item.duration_minutes}m</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
