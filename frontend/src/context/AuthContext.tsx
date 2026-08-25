import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useKarmaAnimation } from './KarmaAnimationContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithOtp: (email: string, otp: string) => Promise<User>;
  signupWithOtp: (data: { email: string; name: string; department: string; year: number; hostel_block: string }) => Promise<{ debugOtp?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserKarma: (newBalance: number, delta?: number, reason?: string) => void;
  switchPersona: (personaEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rexchange_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { triggerKarmaChange } = useKarmaAnimation();

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('rexchange_token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem('rexchange_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const loginWithOtp = async (email: string, otp: string) => {
    const res = await api.verifyOtp(email, otp);
    localStorage.setItem('rexchange_token', res.tokens.accessToken);
    setToken(res.tokens.accessToken);
    setUser(res.user);
    return res.user;
  };

  const signupWithOtp = async (data: { email: string; name: string; department: string; year: number; hostel_block: string }) => {
    const res = await api.signup(data);
    return { debugOtp: res.debugOtp };
  };

  const logout = () => {
    localStorage.removeItem('rexchange_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (localStorage.getItem('rexchange_token')) {
      const me = await api.getMe();
      setUser(me);
    }
  };

  const updateUserKarma = (newBalance: number, delta?: number, reason?: string) => {
    setUser((prev) => (prev ? { ...prev, karma_balance: newBalance } : null));
    if (delta !== undefined && delta !== 0) {
      triggerKarmaChange(delta, reason);
    }
  };

  // Quick Persona switcher for judging demo
  const switchPersona = async (personaEmail: string) => {
    try {
      const loginReq = await api.requestLogin(personaEmail);
      const otp = loginReq.debugOtp || '123456';
      await loginWithOtp(personaEmail, otp);
    } catch (err) {
      console.error('Failed to switch demo persona:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithOtp,
        signupWithOtp,
        logout,
        refreshUser,
        updateUserKarma,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
