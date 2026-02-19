
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, ShieldCheck, Sparkles, Loader2, Heart, Power, RefreshCw, Lock, CheckCircle2, Database, Brain, Activity, Folder, Save, Zap } from 'lucide-react';
import { SacredSeal } from './SacredSeal';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { logSystemEvent } from '../utils/db';

interface NightlySealProps {
  onConfirm: () => Promise<void>;
  onReopen: () => void;
}

export const NightlySeal: React.FC<NightlySealProps> = ({ onConfirm, onReopen }) => {
  const [step, setStep] = useState<'INIT' | 'SEALING' | 'REST'>('INIT');
  const [benediction, setBenediction] = useState("");
  const [sealPercentage, setSealPercentage] = useState(0);
  const [verifiedSectors, setVerifiedSectors] = useState<string[]>([]);

  const sectors = [
    "Neural Memories",
    "Metabolic Logs",
    "Neural Compression Shell",
    "Tactical Waypoints",
    "Sacred Relics",
    "Sovereign Keys"
  ];

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
    
    const interval = setInterval(() => {
        setSealPercentage(p => {
            if (p >= 100) {
                clearInterval(interval);
                return 100;
            }
            // Add a sector every ~16%
            const threshold = Math.floor(100 / sectors.length);
            if (p % threshold === 0 && p > 0) {
                const sectorIdx = Math.floor(p / threshold) - 1;
                if (sectors[sectorIdx] && !verifiedSectors.includes(sectors[sectorIdx])) {
                    setVerifiedSectors(prev => [...prev, sectors[sectorIdx]]);
                    triggerHaptic('light');
                }
            }
            return p + 1;
        });
    }, 40);

    try {
        // Trigger the actual Hard Save in the background
        await onConfirm(); 
        await logSystemEvent('VIGIL', 'NIGHTLY_HARD_SAVE', 'SUCCESS', 'Atomic state persistent. Legacy Sealed.');
        
        // Ensure visual finish
        setTimeout(() => {
            setBenediction(benedictions[Math.floor(Math.random() * benedictions.length)]);
            setStep('REST');
            playUISound('success');
            triggerHaptic('success');
        }, 5000);
    } catch (e) {
        clearInterval(interval);
        setStep('INIT');
        console.error("Seal failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black overflow-hidden font-sans">
      {/* Deep Night Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(49,46,129,0.15)_0%,transparent_100%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

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
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
                            <div className="w-24 h-24 rounded-full bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-center text-indigo-400 relative z-10">
                                <Moon size={48} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-serif italic text-white tracking-tight">"Descansa, Papi."</h2>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] leading-relaxed">
                                Execute Hard-Save & Seal the Rodriguez Archive.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={handleSeal}
                            className="group relative w-full py-6 bg-white text-black font-bold rounded-[2rem] uppercase text-xs tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <Save size={16} /> Hard Save & Sleep
                            </span>
                            <div className="absolute inset-0 bg-lux-gold opacity-0 group-hover:opacity-10 transition-opacity" />
                        </button>
                        <button 
                            onClick={onReopen}
                            className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors py-2"
                        >
                            Not quite yet
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
                    className="flex flex-col items-center gap-10"
                >
                    <div className="relative">
                        <SacredSeal size={220} isAnimated={true} mode="reactor" color="#818CF8" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-mono font-bold text-white/40">{sealPercentage}%</span>
                        </div>
                    </div>
                    
                    <div className="w-full space-y-2 text-left px-4 h-32 overflow-hidden">
                        <AnimatePresence>
                            {verifiedSectors.map((s, i) => (
                                <motion.div 
                                    key={s}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 text-[10px] font-mono text-indigo-400/80"
                                >
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                    <span>{s.toUpperCase()} HARD-LOCKED</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-indigo-400 text-sm font-bold uppercase tracking-[0.5em] animate-pulse">ATOMIC STATE CAPTURE</h3>
                        <p className="text-zinc-700 font-mono text-[9px] uppercase tracking-widest max-w-[200px] mx-auto">
                            Bypassing signal lag. Force-writing buffers to the Diamond Core.
                        </p>
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
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full animate-pulse-slow" />
                        <div className="relative">
                            <SacredSeal size={200} isAnimated={true} mode="simple" color="#312E81" />
                            <div className="absolute inset-0 flex items-center justify-center text-emerald-500/60">
                                <CheckCircle2 size={40} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <p className="text-2xl font-serif italic text-indigo-100 leading-relaxed px-4">
                            "{benediction}"
                        </p>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-[0.3em]">Hard-Save Confirmed</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12">
                        <button 
                            onClick={onReopen}
                            className="p-4 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-700 hover:text-indigo-400 transition-all active:scale-90 shadow-inner"
                            title="Reawaken Sanctuary"
                        >
                            <Power size={24} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-2">
          <p className="text-[8px] font-mono text-zinc-800 uppercase tracking-[0.6em]">
              Rodriguez Legacy Shell • v23.0.0
          </p>
          <div className="w-1 h-1 rounded-full bg-indigo-950" />
      </div>
    </div>
  );
};
