import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useKarmaAnimation } from '../../context/KarmaAnimationContext';
import { Scroll, Sparkles, UserCheck, ArrowRight, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface KarmaWillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KarmaWillModal: React.FC<KarmaWillModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const { triggerKarmaChange } = useKarmaAnimation();
  const [juniors, setJuniors] = useState<User[]>([]);
  const [selectedJuniorId, setSelectedJuniorId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      api.getJuniors()
        .then((res) => {
          setJuniors(res);
          if (res.length > 0) setSelectedJuniorId(res[0].id);
        })
        .catch(console.error);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleNominate = async () => {
    if (!selectedJuniorId) return;
    setError(null);
    setLoading(true);
    try {
      await api.setKarmaWill(selectedJuniorId);
      const chosen = juniors.find((j) => j.id === selectedJuniorId);
      setSuccessMsg(`Nominated ${chosen?.name || 'Junior'} as your Karma Will heir!`);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to nominate heir');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.executeKarmaWill();
      triggerKarmaChange(-res.transferredKarma, `Passed to ${res.recipientName}`);
      setSuccessMsg(`Legacy executed! Transferred ${res.transferredKarma} Karma and ${res.transferredListingsCount} listings to ${res.recipientName}.`);
      await refreshUser();
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to execute Karma Will');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full glass-panel-elevated p-6 sm:p-8 rounded-3xl border-amber-500/40 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs font-mono uppercase text-amber-400 font-bold mb-2">
          <Scroll className="w-4 h-4" />
          <span>Senior Legacy Protocol • Year {user.year}</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-white">Karma Will Transfer</h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Graduating soon? Pass on your <span className="text-amber-400 font-bold">{user.karma_balance} Karma</span> and active resource listings to a junior before you leave campus.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-300 mb-2">
              Select Junior Heir (Years 1 - {user.year - 1})
            </label>
            <select
              value={selectedJuniorId}
              onChange={(e) => setSelectedJuniorId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
            >
              {juniors.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name} — Year {j.year} ({j.department}, {j.hostel_block})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <span>Karma to be Transferred:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">+{user.karma_balance} Karma</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Active Listings Re-assigned:</span>
              <span className="font-mono font-bold text-white text-sm">All available</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Listings will carry a "Willed from {user.name}" badge.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleNominate}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-amber-500/50 text-amber-300 text-xs font-bold hover:bg-amber-500/10 transition-all flex items-center justify-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Nominate Heir</span>
            </button>

            <button
              onClick={handleExecute}
              disabled={loading || user.will_activated}
              className="flex-1 py-3 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{user.will_activated ? 'Already Executed' : 'Execute Legacy Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
