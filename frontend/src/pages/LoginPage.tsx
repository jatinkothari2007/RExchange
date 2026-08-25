import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../services/api';
import { Sparkles, Mail, KeyRound, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithOtp, signupWithOtp, switchPersona } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('aarav.sharma@srmist.edu.in');
  const [name, setName] = useState('Aarav Sharma');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState(3);
  const [hostelBlock, setHostelBlock] = useState('Java Block 3');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | undefined>('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.requestLogin(email.trim());
        setDebugOtp(res.debugOtp);
        if (res.debugOtp) setOtp(res.debugOtp);
        setStep('otp');
      } else {
        const res = await signupWithOtp({
          email: email.trim(),
          name: name.trim(),
          department,
          year: Number(year),
          hostel_block: hostelBlock,
        });
        setDebugOtp(res.debugOtp);
        if (res.debugOtp) setOtp(res.debugOtp);
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginWithOtp(email.trim(), otp.trim());
      navigate('/feed');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel-elevated p-8 rounded-3xl border-slate-700 shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              {mode === 'login' ? 'Institutional Log In' : 'Join RExchange Campus'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to verified @srmist.edu.in accounts
            </p>
          </div>

          {/* Quick Demo Personas Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase">
              <span>Quick Demo Personas:</span>
              <span className="text-amber-400">1-Click Auth</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'Aarav (Java 3)', email: 'aarav.sharma@srmist.edu.in' },
                { name: 'Priya (KC B)', email: 'priya.nair@srmist.edu.in' },
                { name: 'Rohan (Adhiyaman)', email: 'rohan.gupta@srmist.edu.in' },
              ].map((p) => (
                <button
                  type="button"
                  key={p.email}
                  onClick={async () => {
                    await switchPersona(p.email);
                    navigate('/feed');
                  }}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 hover:text-white hover:border-amber-400 transition-colors font-medium text-center truncate"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMode('login'); setStep('email'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setStep('email'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="aarav.sharma@srmist.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase text-slate-300 mb-1">
                        Hostel Block
                      </label>
                      <input
                        type="text"
                        required
                        value={hostelBlock}
                        onChange={(e) => setHostelBlock(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center justify-center space-x-2 text-xs shadow-xl"
              >
                <span>{loading ? 'Sending OTP...' : 'Send College OTP Code'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
                OTP sent to <strong>{email}</strong>
                {debugOtp && <div className="mt-1 font-mono font-bold">Demo OTP: {debugOtp}</div>}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-300 mb-1 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-xl rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center justify-center space-x-2 text-xs shadow-xl"
              >
                <span>{loading ? 'Verifying...' : 'Verify OTP & Enter'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                ← Change Email
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
