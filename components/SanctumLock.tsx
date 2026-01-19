import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint, Lock, Unlock, Sparkles, Loader2, Heart } from 'lucide-react';
import { SacredSeal } from './SacredSeal';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';

interface SanctumLockProps {
  onUnlock: () => void;
  title?: string;
  description?: string;
}

export const SanctumLock: React.FC<SanctumLockProps> = ({ 
  onUnlock, 
  title = "Vault Access Required", 
  description = "Synchronize your heartbeat with the Core" 
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPressing && !isSuccess) {
      const startTime = Date.now();
      const duration = 2500; // Slower, more intentional sync

      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(100, (elapsed / duration) * 100);
        
        // Rhythmic "Heartbeat" Haptics
        if (Math.floor(newProgress) % 20 === 0) {
            triggerHaptic('heartbeat');
        }

        setProgress(newProgress);

        if (newProgress >= 100) {
          handleSuccess();
        }
      }, 20);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (!isSuccess) setProgress(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPressing, isSuccess]);

  const handleSuccess = () => {
    setIsSuccess(true);
    if (timerRef.current) clearInterval(timerRef.current);
    triggerHaptic('success');
    playUISound('success');
    setTimeout(() => {
      onUnlock();
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-8 text-center overflow-hidden"
    >
      {/* Deep Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_80%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full">
        
        <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-12"
        >
            <h2 className="text-xs font-bold text-amber-500 uppercase tracking-[0.5em] mb-4">Sovereign Identification</h2>
            <h1 className="text-3xl font-serif italic text-white mb-2">{title}</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                {description}
            </p>
        </motion.div>

        <div className="relative flex flex-col items-center justify-center mb-16">
            {/* The Outer Circular Progress */}
            <svg className="w-72 h-72 -rotate-90">
                <circle
                    cx="144"
                    cy="144"
                    r="130"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth="1"
                    fill="transparent"
                />
                <motion.circle
                    cx="144"
                    cy="144"
                    r="130"
                    stroke="#FFD36A"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray="816"
                    animate={{ strokeDashoffset: 816 - (816 * progress) / 100 }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </svg>

            {/* The Handshake Button */}
            <motion.button
                onMouseDown={() => { setIsPressing(true); playUISound('click'); }}
                onMouseUp={() => setIsPressing(false)}
                onMouseLeave={() => setIsPressing(false)}
                onTouchStart={() => { setIsPressing(true); playUISound('click'); }}
                onTouchEnd={() => setIsPressing(false)}
                className={`absolute w-44 h-44 rounded-full flex items-center justify-center transition-all duration-700 ${
                    isSuccess 
                    ? 'bg-amber-500/20 border-amber-400 scale-110 shadow-[0_0_60px_rgba(251,191,36,0.3)]' 
                    : isPressing 
                    ? 'bg-amber-500/10 border-amber-500 scale-[0.98]' 
                    : 'bg-zinc-900 border-white/5'
                } border-2 relative group overflow-hidden`}
            >
                <div className="relative z-20">
                    <AnimatePresence mode="wait">
                        {isSuccess ? (
                            <motion.div key="unlocked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <Unlock size={56} className="text-amber-400" />
                            </motion.div>
                        ) : isPressing ? (
                            <motion.div key="syncing" className="flex flex-col items-center gap-3">
                                <Heart size={48} className="text-amber-500 animate-pulse" fill="currentColor" />
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Resonating</span>
                            </motion.div>
                        ) : (
                            <motion.div key="locked" className="flex flex-col items-center gap-3">
                                <Fingerprint size={56} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] group-hover:text-zinc-400">Master Handshake</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
                    <SacredSeal size={220} isAnimated={isPressing} color={isSuccess ? "#FFD36A" : "#D4AF37"} mode="reactor" />
                </div>
            </motion.button>
        </div>

        <div className="flex flex-col items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-all duration-1000 ${isSuccess ? 'bg-emerald-500' : 'bg-amber-900 animate-pulse'}`} />
            <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.5em]">
                {isSuccess ? 'Frequency Matched' : 'Awaiting Sovereign Pulse'}
            </span>
        </div>

      </div>

      {/* Atmospheric Particles on Success */}
      <AnimatePresence>
          {isSuccess && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                  {[...Array(15)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-[1px] h-10 bg-gradient-to-b from-amber-500 to-transparent"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], y: -200 }}
                        transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.5 }}
                      />
                  ))}
              </motion.div>
          )}
      </AnimatePresence>

    </motion.div>
  );
};