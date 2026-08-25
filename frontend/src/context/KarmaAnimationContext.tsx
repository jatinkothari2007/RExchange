import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface KarmaToast {
  id: string;
  delta: number;
  message?: string;
  x?: number;
  y?: number;
}

interface KarmaAnimationContextType {
  triggerKarmaChange: (delta: number, message?: string, position?: { x: number; y: number }) => void;
}

const KarmaAnimationContext = createContext<KarmaAnimationContextType | undefined>(undefined);

export const KarmaAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<KarmaToast[]>([]);

  const triggerKarmaChange = useCallback((delta: number, message?: string, position?: { x: number; y: number }) => {
    const id = `karma_${Date.now()}_${Math.random()}`;
    const newToast: KarmaToast = {
      id,
      delta,
      message,
      x: position?.x ?? (window.innerWidth / 2 + (Math.random() * 80 - 40)),
      y: position?.y ?? (window.innerHeight / 2 - 40),
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  return (
    <KarmaAnimationContext.Provider value={{ triggerKarmaChange }}>
      {children}

      {/* Floating Floating Karma Badges Portal */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isPositive = toast.delta > 0;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: [15, -15, -35, -55],
                  scale: [0.8, 1.1, 1, 0.95],
                }}
                transition={{ duration: 2, times: [0, 0.15, 0.75, 1], ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  left: toast.x,
                  top: toast.y,
                  transform: 'translateX(-50%)',
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold tracking-tight shadow-xl backdrop-blur-md border ${
                  isPositive
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-amber-500/10'
                    : 'bg-rose-500/20 border-rose-400/60 text-rose-300 shadow-rose-500/10'
                }`}
              >
                <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                <span>
                  {isPositive ? `+${toast.delta}` : toast.delta} Karma
                </span>
                {toast.message && (
                  <span className="text-xs font-normal text-slate-300 ml-1">
                    • {toast.message}
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </KarmaAnimationContext.Provider>
  );
};

export const useKarmaAnimation = () => {
  const context = useContext(KarmaAnimationContext);
  if (!context) {
    throw new Error('useKarmaAnimation must be used within a KarmaAnimationProvider');
  }
  return context;
};
