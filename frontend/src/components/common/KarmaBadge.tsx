import React from 'react';
import { Sparkles } from 'lucide-react';

interface KarmaBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'amber' | 'emerald' | 'subtle';
  className?: string;
  showIcon?: boolean;
}

export const KarmaBadge: React.FC<KarmaBadgeProps> = ({
  points,
  size = 'md',
  variant = 'amber',
  className = '',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-sm px-2.5 py-1 space-x-1.5',
    lg: 'text-base px-3.5 py-1.5 space-x-2 font-bold',
  }[size];

  const variantClasses = {
    amber: 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-semibold',
    emerald: 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold',
    subtle: 'bg-slate-800/80 border border-slate-700 text-slate-200 font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-tight backdrop-blur-md transition-all duration-200 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {showIcon && <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />}
      <span>{points} <span className="text-[0.75em] uppercase font-bold tracking-wider opacity-80">Karma</span></span>
    </span>
  );
};
