import React from 'react';
import { ListingBundle } from '../../types';
import { KarmaBadge } from '../common/KarmaBadge';
import { Layers, Package, ArrowRight, Building, Flame } from 'lucide-react';

interface BundleCardProps {
  bundle: ListingBundle;
  onRequestExchange: (bundle: ListingBundle) => void;
}

export const BundleCard: React.FC<BundleCardProps> = ({ bundle, onRequestExchange }) => {
  return (
    <div className="rounded-3xl glass-panel-elevated border-slate-700/80 hover:border-amber-500/50 transition-all p-5 shadow-xl flex flex-col justify-between group relative overflow-hidden">
      {/* Bundle Header Ribbon */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
            <Package className="w-3.5 h-3.5" />
            <span>Multi-Item Bundle ({bundle.listing_ids.length} items)</span>
          </div>

          <KarmaBadge points={bundle.karma_value} size="md" />
        </div>

        <h3 className="font-extrabold text-white text-base group-hover:text-amber-400 transition-colors">
          {bundle.title}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {bundle.description}
        </p>

        {/* Stack/Fan of items preview */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Included in this Bundle:</span>
            <span className="text-amber-400 font-bold">1 Combined Price</span>
          </div>

          <div className="space-y-1.5">
            {(bundle.items || []).slice(0, 3).map((item, idx) => (
              <div key={item.id || idx} className="flex items-center space-x-2 text-xs text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate font-medium">{item.title}</span>
                <span className="text-[10px] text-slate-500 font-mono">({item.type})</span>
              </div>
            ))}
            {(bundle.listing_ids.length > 3) && (
              <p className="text-[10px] text-slate-500 pl-3.5">
                +{bundle.listing_ids.length - 3} more items in bundle
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Owner Info & CTA */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300">
            {bundle.owner?.name || 'Senior Peer'}
          </span>
          {bundle.owner?.current_streak && bundle.owner.current_streak >= 1 && (
            <span className="text-[10px] font-mono text-amber-400">
              🔥 {bundle.owner.current_streak}w
            </span>
          )}
        </div>

        <button
          onClick={() => onRequestExchange(bundle)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-all flex items-center space-x-1 shadow-md"
        >
          <span>Claim Bundle</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
