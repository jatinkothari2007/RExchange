import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, CheckCircle, Mail, Sparkles } from 'lucide-react';

export const SignupCTASection: React.FC = () => {
  const { signupWithOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState(3);
  const [hostelBlock, setHostelBlock] = useState('Java Block 3');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signupWithOtp({
        email: email.trim(),
        name: name.trim(),
        department,
        year: Number(year),
        hostel_block: hostelBlock,
      });
      setDebugOtp(res.debugOtp);
      setStep('otp');
      if (res.debugOtp) setOtp(res.debugOtp);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
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
    <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="p-8 sm:p-12 rounded-3xl glass-panel-elevated border-slate-700 relative overflow-hidden shadow-2xl">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Your Campus Network</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Claim your 50 welcome Karma points
          </h2>

          <p className="mt-3 text-sm text-slate-400">
            Restricted exclusively to authorized students with an institutional email.
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSignup} className="mt-8 space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    College Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="you@srmist.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Year of Study
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Hostel Block / Day Scholar
                  </label>
                  <input
                    type="text"
                    required
                    value={hostelBlock}
                    onChange={(e) => setHostelBlock(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-4 rounded-xl font-bold bg-white text-black hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 text-sm shadow-xl"
              >
                <span>{loading ? 'Sending OTP...' : 'Send College Verification Code'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4 max-w-md mx-auto text-left">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
                OTP sent to <strong>{email}</strong>
                {debugOtp && <div className="mt-1 font-mono font-bold text-sm">Demo Auto-Fill OTP: {debugOtp}</div>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 text-center tracking-[0.5em] font-mono text-xl rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all flex items-center justify-center space-x-2 text-sm shadow-xl"
              >
                <span>{loading ? 'Verifying...' : 'Verify OTP & Enter Campus'}</span>
                <CheckCircle className="w-4 h-4 text-black" />
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-center text-xs text-slate-400 hover:text-white"
              >
                ← Back to signup details
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
