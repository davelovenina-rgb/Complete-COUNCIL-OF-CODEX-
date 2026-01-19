import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Check, X, ShieldCheck, Lock } from 'lucide-react';
import { SacredSeal } from './SacredSeal';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';

interface GuardianGateProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  warning?: string;
}

export const GuardianGate: React.FC<GuardianGateProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  description,
  warning 
}) => {
  const handleConfirm = () => {
    triggerHaptic('success');
    playUISound('success');
    onConfirm();
  };

  const handleCancel = () => {
    triggerHaptic('light');
    playUISound('toggle');
    onCancel();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <SacredSeal size={600} color="#FFD36A" isAnimated={true} mode="reactor" />
          </div>

          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-sm bg-zinc-900 border border-amber-500/30 rounded-[2.5rem] p-8 shadow-2xl text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                <ShieldCheck size={32} className="text-amber-500" />
              </div>
            </div>

            <h2 className="text-xs font-bold text-amber-500 uppercase tracking-[0.4em] mb-4">Guardian Protocol</h2>
            <h1 className="text-2xl font-serif italic text-white mb-3">{title}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-sans">
              {description}
            </p>

            {warning && (
              <div className="mb-8 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-start gap-3 text-left">
                <ShieldAlert size={18} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider leading-normal">
                  {warning}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirm}
                className="w-full py-4 bg-amber-500 text-black font-bold rounded-2xl uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-white transition-all active:scale-95"
              >
                Authorize Action
              </button>
              <button 
                onClick={handleCancel}
                className="w-full py-4 bg-zinc-800 text-zinc-500 font-bold rounded-2xl uppercase text-[10px] tracking-[0.3em] hover:text-white transition-all"
              >
                Abort Protocol
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
               <Lock size={12} className="text-amber-500" />
               <span className="text-[8px] font-mono uppercase tracking-[0.2em]">Ennea-Shield: ENGAGED</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
