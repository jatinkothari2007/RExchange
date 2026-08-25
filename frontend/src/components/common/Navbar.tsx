import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Layers,
  TrendingUp,
  Award,
  PlusCircle,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ArrowRightLeft,
  X,
  Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { KarmaBadge } from './KarmaBadge';
import { api } from '../../services/api';
import { Notification } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout, switchPersona } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((res) => setNotifications(res))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const navItems = [
    { label: 'Explore Feed', path: '/feed', icon: Compass },
    { label: 'Urgent Needs', path: '/needs', icon: Flame, badge: 'Live' },
    { label: 'My Exchanges', path: '/exchanges', icon: ArrowRightLeft },
    { label: 'Campus Impact', path: '/impact', icon: TrendingUp },
    { label: 'Leaderboard', path: '/leaderboard', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border/60 bg-background/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-8">
          <Link to={user ? '/feed' : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-amber-400/80 transition-all duration-300 shadow-md group-hover:shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="text-xl font-extrabold tracking-tight font-sans text-white">
              RE<span className="text-amber-400">xchange</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              SRM Campus
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Action Stack */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Demo Persona Quick-Switcher (Crucial for SIH judging flow!) */}
              <div className="relative">
                <button
                  onClick={() => setShowPersonaPicker(!showPersonaPicker)}
                  className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-amber-500/50 transition-colors"
                  title="Switch Persona for Demoing"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Demo: {user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showPersonaPicker && (
                  <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl p-2 shadow-2xl z-50">
                    <div className="px-2 py-1.5 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 flex justify-between items-center">
                      <span>Switch Demo Student</span>
                      <X className="w-3.5 h-3.5 cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowPersonaPicker(false)} />
                    </div>
                    <div className="mt-1 space-y-1">
                      {[
                        { name: 'Aarav Sharma (Java 3)', email: 'aarav.sharma@srmist.edu.in' },
                        { name: 'Priya Nair (KC Block B)', email: 'priya.nair@srmist.edu.in' },
                        { name: 'Rohan Gupta (Adhiyaman)', email: 'rohan.gupta@srmist.edu.in' },
                      ].map((p) => (
                        <button
                          key={p.email}
                          onClick={async () => {
                            await switchPersona(p.email);
                            setShowPersonaPicker(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors ${
                            user.email === p.email
                              ? 'bg-amber-500/20 text-amber-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{p.name}</span>
                          {user.email === p.email && <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold">Active</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Karma Streak Badge (Feature 4) */}
              <div
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-mono font-bold text-amber-400"
                title={`${user.current_streak || 1} consecutive weeks active giver streak!`}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{user.current_streak || 1}w</span>
              </div>

              {/* Karma Balance Badge */}
              <Link to="/profile" className="hover:scale-105 transition-transform duration-200">
                <KarmaBadge points={user.karma_balance} size="md" variant="amber" />
              </Link>


              {/* Post Resource Button */}
              <Link
                to="/create"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold bg-white text-black hover:bg-slate-200 transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Give / List</span>
              </Link>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl p-4 shadow-2xl z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">Campus Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-500">No notifications yet</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl border text-xs transition-colors ${
                              n.is_read
                                ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                                : 'bg-slate-800/80 border-amber-500/30 text-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <p className="font-bold text-white mb-0.5">{n.title}</p>
                              <span className="text-[10px] text-slate-500">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                >
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-700"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 shadow-2xl z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="font-bold text-sm text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <p className="text-[11px] font-mono text-amber-400 mt-1">{user.hostel_block}</p>
                    </div>
                    <div className="mt-1 space-y-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile & Badges</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-slate-200 transition-colors shadow-md"
              >
                College Signup
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
