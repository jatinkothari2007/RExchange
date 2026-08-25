import React, { useState } from 'react';
import { api } from '../../services/api';
import { useKarmaAnimation } from '../../context/KarmaAnimationContext';
import { QrCode, Scan, CheckCircle2, ArrowRight, X, Sparkles } from 'lucide-react';

interface HandoffQrModalProps {
  isOpen: boolean;
  exchangeId: string;
  handoffCode: string;
  agreedKarma: number;
  isGiver: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HandoffQrModal: React.FC<HandoffQrModalProps> = ({
  isOpen,
  exchangeId,
  handoffCode,
  agreedKarma,
  isGiver,
  onClose,
  onSuccess,
}) => {
  const { triggerKarmaChange } = useKarmaAnimation();
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = async (codeToSubmit?: string) => {
    const code = codeToSubmit || inputCode;
    if (!code) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.scanHandoff(exchangeId, code);
      if (res.completed) {
        if (isGiver) {
          triggerKarmaChange(agreedKarma, 'Handoff Verified! (+Karma)');
        } else {
          triggerKarmaChange(-agreedKarma, 'Handoff Verified! (-Karma)');
        }
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'QR Verification failed. Please check code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel-elevated p-6 sm:p-8 rounded-3xl border-amber-500/40 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase text-amber-400 font-bold mb-2">
          <QrCode className="w-4 h-4" />
          <span>Feature 7 • Instant Physical Handoff</span>
        </div>

        <h3 className="text-xl font-extrabold text-white">QR Code Handoff Verification</h3>
        <p className="text-xs text-slate-400 mt-1">
          {isGiver
            ? 'Show this QR code to the receiver when handing over the resource.'
            : 'Scan or enter the giver’s QR code to verify physical handoff and release Karma.'}
        </p>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* QR Simulation / Display */}
        <div className="my-6 p-6 rounded-3xl bg-white text-black inline-block shadow-2xl mx-auto border-4 border-amber-400">
          <div className="w-44 h-44 flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-2xl p-2 relative bg-slate-50">
            {/* Stylized QR grid representation */}
            <div className="grid grid-cols-4 gap-2 w-full h-full p-2">
              <div className="bg-black rounded-sm" />
              <div className="bg-black rounded-sm" />
              <div className="bg-transparent" />
              <div className="bg-black rounded-sm" />
              <div className="bg-black rounded-sm" />
              <div className="bg-transparent" />
              <div className="bg-black rounded-sm" />
              <div className="bg-black rounded-sm" />
              <div className="bg-transparent" />
              <div className="bg-black rounded-sm" />
              <div className="bg-black rounded-sm" />
              <div className="bg-transparent" />
              <div className="bg-black rounded-sm" />
              <div className="bg-transparent" />
              <div className="bg-black rounded-sm" />
              <div className="bg-black rounded-sm" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-amber-400 text-black px-2 py-1 rounded font-mono font-extrabold text-xs shadow-md">
                {handoffCode}
              </span>
            </div>
          </div>
          <p className="font-mono text-[11px] font-bold mt-2 text-slate-800 tracking-wider">
            TOKEN: {handoffCode}
          </p>
        </div>

        {/* One-click Instant Scan for Demo / Manual Input */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleScan(handoffCode)}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-400 text-black font-bold text-xs hover:bg-amber-300 transition-all shadow-xl flex items-center justify-center space-x-2"
          >
            <Scan className="w-4 h-4" />
            <span>{loading ? 'Verifying...' : 'Instant 1-Click Scan (Live Demo)'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Or enter 6-digit code..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={() => handleScan()}
              disabled={loading || !inputCode}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 disabled:opacity-50"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
