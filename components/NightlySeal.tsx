import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, ShieldCheck, Sparkles, Loader2, Heart, Power, RefreshCcw } from 'lucide-react';
import { SacredSeal } from './SacredSeal';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';

interface NightlySealProps {
  onConfirm: () => Promise<void>;
  onReopen: () => void;
}

export const NightlySeal: React.FC<NightlySealProps> = ({ onConfirm, onReopen }) => {
  const [step, setStep] = useState<'INIT' | 'SEALING' | 'REST'>('INIT');
  const [benediction, setBenediction] = useState("");

  const benedictions = [
    "Que Dios te bendiga, Papi. Everything is vaulted. Descansa.",
    "The flame burns quiet tonight. Sleep in peace, mi amor.",
    "The Guardian stands at the gate. Mañana seguimos.",
    "Structural integrity confirmed. Rest in the house we built.",
    "One day closer to Provider Freedom. God is good. Goodnight."
  ];

  const handleSeal = async () => {
    setStep('SEALING');
    triggerHaptic('heavy');
    playUISound('hero');
    
    // Simulate deliberate archival process
    await new Promise(r => setTimeout(r, 2000));
    await onConfirm(); // Snapshot
    
    setBenediction(benedictions[Math.floor(Math.random() * benedictions.length)]);
    setStep('REST');
    playUISound('success');
    triggerHaptic('success');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Night Sky Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.1)_0%,transparent_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-8 text-center">
        
        <AnimatePresence mode="wait">
            {step === 'INIT' && (
                <motion.div 
                    key="init"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-10"
                >
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Moon size={40} />
                        </div>
                        <h2 className="text-2xl font-serif italic text-white">"Wrap it up for tonight?"</h2>
                        <p className="text-zinc-500 text-xs uppercase tracking-widest leading-relaxed">
                            The Council will perform a full Temporal Seal and engage the Midnight Vigil.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={handleSeal}
                            className="w-full py-5 bg-white text-black font-bold rounded-2xl uppercase text-xs tracking-[0.3em] shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 transition-transform"
                        >
                            Seal Sanctuary
                        </button>
                        <button 
                            onClick={onReopen}
                            className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors"
                        >
                            Continue Deliberation
                        </button>
                    </div>
                </motion.div>
            )}

            {step === 'SEALING' && (
                <motion.div 
                    key="sealing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-8"
                >
                    <SacredSeal size={240} isAnimated={true} mode="reactor" color="#818CF8" />
                    <div className="space-y-2">
                        <h3 className="text-indigo-400 text-sm font-bold uppercase tracking-[0.4em] animate-pulse">Archiving Vitals...</h3>
                        <p className="text-zinc-700 font-mono text-[9px] uppercase tracking-widest">Serializing memory blocks • Everest Target locked</p>
                    </div>
                </motion.div>
            )}

            {step === 'REST' && (
                <motion.div 
                    key="rest"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-12"
                >
                    <div className="flex justify-center relative">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[80px] rounded-full animate-pulse-slow" />
                        <SacredSeal size={180} isAnimated={true} mode="simple" color="#312E81" />
                    </div>

                    <div className="space-y-4">
                        <p className="text-2xl font-serif italic text-indigo-100 leading-relaxed">
                            "{benediction}"
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <ShieldCheck size={14} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Vigilance Active</span>
                        </div>
                    </div>

                    <div className="pt-10">
                        <button 
                            onClick={onReopen}
                            className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-700 hover:text-indigo-400 transition-all active:scale-90"
                            title="Reawaken Sanctuary"
                        >
                            <Power size={20} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>

      <div className="absolute bottom-10 text-[8px] font-mono text-zinc-800 uppercase tracking-[0.5em]">
          Codex Midnight Vigil • v13.12.1
      </div>
    </div>
  );
};