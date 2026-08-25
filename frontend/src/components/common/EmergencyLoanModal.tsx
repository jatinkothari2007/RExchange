import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useKarmaAnimation } from '../../context/KarmaAnimationContext';
import { Zap, ShieldAlert, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface EmergencyLoanModalProps {
  isOpen: boolean;
  requiredKarma: number;
  onClose: () => void;
  onLoanApproved: () => void;
}

export const EmergencyLoanModal: React.FC<EmergencyLoanModalProps> = ({
  isOpen,
  requiredKarma,
  onClose,
  onLoanApproved,
}) => {
  const { user, refreshUser } = useAuth();
  const { triggerKarmaChange } = useKarmaAnimation();
  const [amount, setAmount] = useState<number>(Math.min(15, Math.max(5, requiredKarma - (user?.karma_balance || 0))));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleBorrow = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.requestLoan(amount);
      triggerKarmaChange(amount, 'Emergency Loan Approved');
      await refreshUser();
      onLoanApproved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Loan request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel-elevated p-6 sm:p-8 rounded-3xl border-amber-500/40 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs font-mono uppercase text-amber-400 font-bold mb-2">
          <Zap className="w-4 h-4" />
          <span>Campus Micro-Credit • Instant Liquidity</span>
        </div>

        <h3 className="text-xl font-extrabold text-white">Emergency Karma Loan</h3>
        <p className="text-xs text-slate-400 mt-1">
          Need Karma right now to claim this exchange? Borrow up to <span className="text-amber-400 font-bold">15 Karma</span> instantly with zero interest.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
              <span>Loan Amount</span>
              <span className="font-mono font-bold text-amber-400 text-base">{amount} Karma</span>
            </div>
            <input
              type="range"
              min={5}
              max={15}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>5 Karma (Min)</span>
              <span>15 Karma (Max Cap)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
            <p className="font-bold flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Automatic Repayment Terms:</span>
            </p>
            <p className="text-amber-200/90 leading-relaxed">
              This loan will automatically be deducted from the karma earnings of your next completed exchange as a Giver.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleBorrow}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Disbursing...' : `Borrow +${amount} Karma`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
