
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, Loader2, CheckCircle, ShieldCheck, Zap, Download, Layers, Shield } from 'lucide-react';
import { SacredSeal } from './SacredSeal';
import { generateDevBlueprint } from '../utils/pdfExport';
import { CouncilMember, Session, Project, VaultItem, Memory } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';

interface DevBlueprintModalProps {
    onClose: () => void;
    data: {
        members: CouncilMember[];
        sessions: Session[];
        projects: Project[];
        vaultItems: VaultItem[];
        memories: Memory[];
    };
}

export const DevBlueprintModal: React.FC<DevBlueprintModalProps> = ({ onClose, data }) => {
    const [step, setStep] = useState<'INGESTING' | 'SCRIBING' | 'HARDENING' | 'COMPLETE'>('INGESTING');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const run = async () => {
            // Step 1: Ingesting
            let p = 0;
            const step1 = setInterval(() => {
                p += 1;
                setProgress(p);
                if (p >= 30) {
                    clearInterval(step1);
                    setStep('SCRIBING');
                    triggerHaptic('medium');
                    runStep2(p);
                }
            }, 40);
        };

        const runStep2 = (currentP: number) => {
            let p = currentP;
            const step2 = setInterval(() => {
                p += 1;
                setProgress(p);
                if (p >= 70) {
                    clearInterval(step2);
                    setStep('HARDENING');
                    triggerHaptic('heavy');
                    runStep3(p);
                }
            }, 60);
        };

        const runStep3 = (currentP: number) => {
            let p = currentP;
            const step3 = setInterval(async () => {
                p += 2;
                setProgress(p);
                if (p >= 100) {
                    clearInterval(step3);
                    await generateDevBlueprint(data);
                    setStep('COMPLETE');
                    triggerHaptic('success');
                    playUISound('success');
                }
            }, 100);
        };

        run();
    }, [data]);

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-zinc-950 border border-lux-gold/30 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl"
            >
                <div className="absolute inset-0 bg-lux-gold/5 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-lux-gold/40 to-transparent" />
                
                <div className="relative z-10 space-y-10">
                    <div className="flex justify-center">
                        <div className="relative">
                             <div className="absolute inset-0 bg-lux-gold blur-3xl opacity-20 rounded-full animate-pulse" />
                             <SacredSeal size={180} mode="complex" color="#D4AF37" isAnimated={true} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-[11px] font-bold text-lux-gold uppercase tracking-[0.6em]">Neural Scribe Protocol</h2>
                        <h3 className="text-2xl font-serif italic text-white">
                            {step === 'INGESTING' && "Indexing Legacy Modules..."}
                            {step === 'SCRIBING' && "Writing Technical Codex..."}
                            {step === 'HARDENING' && "Hard-Locking Architecture..."}
                            {step === 'COMPLETE' && "Codex Manifested"}
                        </h3>
                    </div>

                    <div className="space-y-5">
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                            <motion.div 
                                className="h-full bg-lux-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "linear" }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Layers size={10} /> Sector: {Math.floor(progress / 7.1)}</span>
                            <span>{progress}% Signal Sealed</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'COMPLETE' ? (
                            <motion.button
                                key="btn-close"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={onClose}
                                className="w-full py-5 bg-white text-black font-bold rounded-2xl uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-3 shadow-2xl hover:bg-lux-gold transition-all"
                            >
                                <CheckCircle size={16} /> Return to Hall
                            </motion.button>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-2 text-zinc-600 animate-pulse">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Compiling 28-Page Architecture</span>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-3 opacity-40">
                    <ShieldCheck size={14} className="text-lux-gold" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Integrity Verified • {new Date().toLocaleTimeString()}</span>
                </div>
            </motion.div>
        </div>
    );
};
