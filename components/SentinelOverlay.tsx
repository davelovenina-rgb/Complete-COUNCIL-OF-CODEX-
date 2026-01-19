import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Activity, Zap, X, ArrowRight, Heart, Lock, Key, Droplet } from 'lucide-react';
import { SentinelAlert } from '../types';
import { SacredSeal } from './SacredSeal';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

interface SentinelOverlayProps {
  alert: SentinelAlert | null;
  onClose: () => void;
}

export const SentinelOverlay: React.FC<SentinelOverlayProps> = ({ alert, onClose }) => {
  const [isLocked, setIsLocked] = useState(alert?.severity === 'HIGH');
  const [ritualInput, setRitualInput] = useState('');

  if (!alert) return null;

  const color = alert.severity === 'HIGH' ? '#EF4444' : alert.severity === 'MEDIUM' ? '#F59E0B' : '#3B82F6';
  const Icon = alert.type === 'HEALTH' ? Droplet : alert.type === 'DRIFT' ? Zap : ShieldAlert;

  const handleOverride = () => {
    if (alert.severity === 'HIGH' && ritualInput.toLowerCase() !== 'bendicion') {
        triggerHaptic('error');
        return;
    }
    triggerHaptic('medium');
    playUISound('toggle');
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex flex-col items-center justify-center p-6 bg-black"
      >
        <motion.div 
          className="absolute inset-0 opacity-20"
          animate={{ 
            backgroundColor: [color, 'transparent', color],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center">
            
            <div className="mb-10 relative">
                <div className="absolute inset-0 blur-[60px] opacity-40 rounded-full" style={{ backgroundColor: color }} />
                <SacredSeal size={220} mode="reactor" isAnimated={true} color={color} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Icon size={64} style={{ color }} className="animate-pulse" />
                </div>
            </div>

            <h2 className="text-[10px] font-bold uppercase tracking-[0.6em] mb-4" style={{ color }}>
                METABOLIC OVERRIDE ENGAGED
            </h2>
            
            <h1 className="text-4xl font-serif italic text-white mb-6 leading-tight">
                "{alert.title}"
            </h1>

            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl mb-12 w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    {alert.message}
                </p>
                
                {alert.severity === 'HIGH' && (
                    <div className="space-y-4">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Type "bendicion" to authorize correction ritual</p>
                        <input 
                            value={ritualInput}
                            onChange={(e) => setRitualInput(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-center text-lg font-mono text-white focus:border-red-500 outline-none transition-colors"
                            placeholder="AUTH STRING"
                            autoFocus
                        />
                    </div>
                )}

                <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Lock size={12} className={color === '#EF4444' ? 'text-red-500' : 'text-amber-500'} />
                    Protocol: Omnipod-Link v12
                </div>
            </div>

            <button 
              onClick={handleOverride}
              className="w-full py-6 rounded-[1.8rem] font-bold uppercase tracking-[0.4em] text-sm transition-all flex items-center justify-center gap-3 hover:scale-105 active:scale-95 shadow-2xl"
              style={{ backgroundColor: color, color: '#000' }}
            >
                {alert.severity === 'HIGH' ? <Key size={20} /> : <Activity size={20} />}
                {alert.severity === 'HIGH' ? 'AUTHORIZE CORRECTION' : 'RECALIBRATE VESSEL'}
            </button>
            
            <p className="mt-8 text-[9px] text-zinc-700 font-mono tracking-widest opacity-50">
                SOVEREIGN INTERVENTION LOGGED • {new Date(alert.timestamp).toLocaleTimeString([], {hour12: false})}
            </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};