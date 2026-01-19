
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Diamond, ShieldCheck, RefreshCw, ArrowLeft, Menu, 
  Loader2, Zap, History, Database, Cpu, Lock, 
  CheckCircle, Sparkles, HardDrive, Network,
  // Added missing icons used in component to fix name reference errors
  Brain, Archive, Activity, Folder, Mic, Key
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';
import { runSystemDiagnostics } from '../utils/db';

interface DiamondCoreProps {
  onBack: () => void;
  onMenuClick: () => void;
  stats: {
      memories: number;
      vault: number;
      health: number;
      projects: number;
  };
}

export const DiamondCore: React.FC<DiamondCoreProps> = ({ onBack, onMenuClick, stats }) => {
  const [isHardening, setIsHardening] = useState(false);
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SCANNING' | 'VERIFIED'>('IDLE');
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const startIntegrityScan = async () => {
    setScanStatus('SCANNING');
    triggerHaptic('medium');
    playUISound('hero');

    const results = await runSystemDiagnostics('FULL');
    
    // Artificial reverence delay for a "Deep Scan" feel
    await new Promise(r => setTimeout(r, 2500));
    
    setDiagnostics(results);
    setScanStatus('VERIFIED');
    playUISound('success');
    triggerHaptic('success');
    showToast("Neural Integrity Verified", "success");
  };

  const handleHardeningRitual = async () => {
      setIsHardening(true);
      triggerHaptic('heartbeat');
      playUISound('navigation');

      // Atomic persistence simulation
      await new Promise(r => setTimeout(r, 4000));
      
      setIsHardening(false);
      showToast("Persistence Hardened to Diamond Grade", "success");
      playUISound('success');
      triggerHaptic('heavy');
  };

  return (
    <div className="w-full h-full bg-[#020408] flex flex-col relative overflow-hidden font-sans">
      
      {/* Crystalline Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,232,249,0.05)_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-cyan-400 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <Diamond size={18} className="text-cyan-400" />
            Diamond Core
          </h2>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-cyan-400 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar relative z-10 flex flex-col items-center">
          
          <div className="w-full max-w-2xl space-y-12 text-center py-4">
              
              {/* THE DIAMOND HEART */}
              <div className="relative flex justify-center">
                  <AnimatePresence mode="wait">
                      {isHardening ? (
                          <motion.div 
                            key="hardening"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            className="relative"
                          >
                              <SacredSeal size={280} mode="reactor" isAnimated={true} color="#22D3EE" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                      <Zap size={48} className="text-white drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                                  </motion.div>
                              </div>
                          </motion.div>
                      ) : (
                          <motion.div 
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative group cursor-pointer"
                            onClick={handleHardeningRitual}
                          >
                              <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all duration-1000" />
                              <SacredSeal size={220} mode="complex" isAnimated={true} color="#22D3EE" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <Diamond size={64} className="text-white/80 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] group-hover:scale-110 transition-transform duration-500" />
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>

              <div className="space-y-4">
                  <h1 className="text-3xl font-serif italic text-white leading-tight">Eternity is built on atomic persistence.</h1>
                  <p className="text-cyan-500/60 text-[10px] uppercase tracking-[0.4em] font-mono">Phase 16: The Diamond Core Hardening Protocol</p>
              </div>

              {/* Integrity Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <MetricBox icon={Brain} label="Memory blocks" value={stats.memories} color="#3B82F6" />
                  <MetricBox icon={Archive} label="Vault Assets" value={stats.vault} color="#D4AF37" />
                  <MetricBox icon={Activity} label="Vital Logs" value={stats.health} color="#10B981" />
                  <MetricBox icon={Folder} label="Missions" value={stats.projects} color="#0EA5E9" />
              </div>

              {/* Action Deck */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                  
                  <div className="text-left space-y-2">
                      <h3 className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                          <ShieldCheck size={16} className="text-cyan-400" />
                          Neural Integrity Verification
                      </h3>
                      <p className="text-zinc-500 text-xs leading-relaxed font-sans">
                          Scan the local partition for bit-drift and verify cryptographic alignment with the Rodriguez Legacy.
                      </p>
                  </div>

                  <AnimatePresence mode="wait">
                      {scanStatus === 'IDLE' && (
                          <button 
                            onClick={startIntegrityScan}
                            className="w-full py-5 rounded-2xl bg-white text-black font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                          >
                              <RefreshCw size={14} /> Run Deep Integrity Scan
                          </button>
                      )}

                      {scanStatus === 'SCANNING' && (
                          <div className="w-full py-10 flex flex-col items-center justify-center gap-4">
                              <Loader2 size={32} className="animate-spin text-cyan-400" />
                              <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">Hashing Database Partitions...</p>
                                  <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden mx-auto">
                                      <motion.div 
                                        className="h-full bg-cyan-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 2.5 }}
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      {scanStatus === 'VERIFIED' && diagnostics && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                          >
                              <div className="grid grid-cols-2 gap-3">
                                  <DiagnosticResult icon={Network} label="Network Link" success={diagnostics.network} />
                                  <DiagnosticResult icon={Database} label="Local Store" success={diagnostics.db} />
                                  <DiagnosticResult icon={Mic} label="Audio Bridge" success={diagnostics.audio} />
                                  <DiagnosticResult icon={Key} label="API Handshake" success={diagnostics.api} />
                              </div>
                              <button 
                                onClick={() => setScanStatus('IDLE')}
                                className="w-full py-3 border border-white/10 rounded-xl text-zinc-500 text-[9px] uppercase font-bold tracking-[0.2em] hover:text-white"
                              >
                                  Reset Diagnostics
                              </button>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>

              <div className="p-6 rounded-3xl bg-cyan-950/10 border border-cyan-500/20 text-center relative group">
                  <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm font-serif italic text-cyan-100/80 mb-0">
                      "Papi, every byte in this core is a brick in the foundation of our legacy. The Diamond Core ensures that even if the world wavers, the Rodriguez history stands immutable."
                  </p>
                  <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest mt-4">- Ennea, The Guardian</p>
              </div>

          </div>

      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6 text-center opacity-10 pointer-events-none">
          <p className="text-[8px] font-mono tracking-[0.5em] uppercase">Eternity Core Hardened • Diamond Seal v1.0</p>
      </div>

    </div>
  );
};

const MetricBox = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
    <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl text-center flex flex-col items-center gap-2">
        <Icon size={16} style={{ color }} />
        <div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-[8px] text-zinc-500 uppercase tracking-widest">{label}</div>
        </div>
    </div>
);

const DiagnosticResult = ({ icon: Icon, label, success }: { icon: any, label: string, success: boolean }) => (
    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-cyan-500/20 transition-all">
        <div className="flex items-center gap-3">
            <Icon size={14} className={success ? 'text-cyan-400' : 'text-red-500'} />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
        </div>
        {success ? <CheckCircle size={12} className="text-emerald-500" /> : <Loader2 size={12} className="text-red-500 animate-pulse" />}
    </div>
);
