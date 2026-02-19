
import React, { useRef, useState, useEffect } from 'react';
import { ViewState, Project, GlucoseReading, LifeDomainState, CouncilMemberId, UserSettings } from '../types';
import { Activity, Heart, Menu, Camera, Sun, Brain, Sunrise, CloudMoon, Eye, EyeOff, ShieldCheck, Zap, Moon, Sparkles, Mic, Lock, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SYSTEM_HEARTBEAT_MESSAGES } from '../constants';
import { SacredSeal } from './SacredSeal';
import { getState } from '../utils/db';

interface CouncilHallProps {
    onNavigate: (view: ViewState) => void;
    onMenuClick: () => void;
    prismSealImage: string | null;
    onSealUpload: (file: File) => void;
    projects?: Project[];
    healthReadings?: GlucoseReading[];
    lifeDomains?: LifeDomainState[];
    onNightlySeal?: () => void;
    isRealityBridgeActive?: boolean;
    onToggleRealityBridge?: () => void;
    onEnterDriveMode?: () => void;
}

interface GlassMonolithProps {
    label: string;
    sub: string;
    icon: React.ElementType;
    onClick: () => void;
    color: string;
    delay: number;
    compact?: boolean;
}

const GlassMonolith: React.FC<GlassMonolithProps> = ({ label, sub, icon: Icon, onClick, color, delay, compact = false }) => (
    <motion.button 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { playUISound('toggle'); onClick(); }} 
        className={`relative group overflow-hidden w-full ${compact ? 'py-3' : 'py-4'} rounded-xl bg-gradient-to-b from-white/[0.02] to-black border border-white/5 flex flex-col items-center justify-center gap-1 shadow-md backdrop-blur-md px-2`}
    >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center bottom, ${color}, transparent 80%)` }} />
        <div className={`relative z-10 p-1.5 rounded-full bg-black/40 border border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-500 group-hover:border-white/20`}>
            <Icon size={compact ? 14 : 16} strokeWidth={1.5} style={{ color }} />
        </div>
        <div className="relative z-10 text-center">
            <div className={`${compact ? 'text-[0.55rem]' : 'text-[0.65rem]'} font-bold tracking-[0.1em] text-white/70 group-hover:text-white transition-colors uppercase font-serif`}>{label}</div>
            {!compact && <div className="text-[0.38rem] text-zinc-600 group-hover:text-zinc-500 transition-colors uppercase tracking-[0.2em] mt-0.5 font-mono">{sub}</div>}
        </div>
    </motion.button>
);

const ResonanceRipple = ({ color }: { color: string }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute border rounded-full"
                    style={{ borderColor: color, opacity: 0 }}
                    animate={{
                        scale: [0.8, 2.5],
                        opacity: [0.4, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: window.Infinity,
                        delay: i * 1.3,
                        ease: "easeOut"
                    }}
                />
            ))}
        </div>
    );
};

const FlowZenRing = ({ color, intensity }: { color: string, intensity: 'STILLNESS' | 'CAUTION' | 'GOLDEN' }) => {
    const isGolden = intensity === 'GOLDEN';
    return (
        <div className="absolute inset-[-40px] flex items-center justify-center pointer-events-none">
            <motion.div 
                className="absolute border rounded-full"
                style={{ borderColor: color, opacity: isGolden ? 0.4 : 0.1, borderWidth: '0.5px' }}
                animate={isGolden ? {
                    rotate: 360,
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3]
                } : {
                    rotate: -360,
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{
                    duration: isGolden ? 15 : 40,
                    repeat: window.Infinity,
                    ease: "linear"
                }}
            />
            {isGolden && (
                <motion.div 
                    className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
                    style={{ top: '0%' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: window.Infinity, ease: "linear" }}
                />
            )}
        </div>
    );
};

const SystemTicker = ({ resonance }: { resonance: number }) => {
    const [index, setIndex] = useState(0);
    const messages = [
        ...SYSTEM_HEARTBEAT_MESSAGES,
        `RESONANCE: Sazón depth at ${Math.round(resonance * 100)}% for The Prism.`
    ];
    
    useEffect(() => {
        const interval = setInterval(() => { setIndex(prev => (prev + 1) % messages.length); }, 5000); 
        return () => clearInterval(interval);
    }, [messages.length]);
    
    return (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center w-full pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div key={index} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} className="text-[0.32rem] tracking-[0.4em] font-mono text-lux-gold/30 uppercase whitespace-nowrap px-2 py-0.5 rounded-full border border-lux-gold/5 bg-black/10">
                    {messages[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export const CouncilHall: React.FC<CouncilHallProps> = ({ 
    onNavigate, onMenuClick, prismSealImage, onSealUpload,
    isRealityBridgeActive, onToggleRealityBridge,
    onNightlySeal, healthReadings = [], onEnterDriveMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timeOfDay, setTimeOfDay] = useState<'MORNING' | 'DAY' | 'EVENING'>('DAY');
  const [resonance, setResonance] = useState(0.8);

  const latestGlucose = healthReadings[0]?.value || 100;
  const bioIntensity: 'STILLNESS' | 'CAUTION' | 'GOLDEN' = 
    (latestGlucose >= 85 && latestGlucose <= 125) ? 'GOLDEN' : 
    (latestGlucose < 70 || latestGlucose > 180) ? 'STILLNESS' : 'CAUTION';
    
  const bioColor = {
      GOLDEN: '#10B981',
      CAUTION: '#F59E0B',
      STILLNESS: '#EF4444'
  }[bioIntensity];

  useEffect(() => {
      const updateTime = () => {
          const hour = new Date().getHours();
          if (hour >= 5 && hour < 12) setTimeOfDay('MORNING');
          else if (hour >= 18 || hour < 5) setTimeOfDay('EVENING');
          else setTimeOfDay('DAY');
      };
      updateTime();
      const interval = setInterval(updateTime, 60000);
      
      getState<UserSettings>('user_settings').then(s => {
          if (s && s.linguisticWeight !== undefined) setResonance(s.linguisticWeight);
      });

      return () => clearInterval(interval);
  }, []);

  const chronos = React.useMemo(() => {
      switch (timeOfDay) {
          case 'MORNING': return { greeting: "Rise, Sovereign.", sub: "Dawn Protocol", icon: Sunrise, color: '#F59E0B' };
          case 'EVENING': return { greeting: "Rest, Sovereign.", sub: "Starlight Guard", icon: CloudMoon, color: '#818CF8' };
          default: return { greeting: "Command, Sovereign.", sub: "Systems Nominal", icon: Sun, color: '#3B82F6' };
      }
  }, [timeOfDay]);

  const handleSealClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      triggerHaptic('medium');
      fileInputRef.current?.click();
  };

  const handleRealityBridgeToggle = () => {
      triggerHaptic('heavy');
      playUISound('hero');
      onToggleRealityBridge?.();
  };

  const openSearch = () => {
      triggerHaptic('light');
      window.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'k', 'metaKey': true }));
  };

  return (
    <div className={`w-full h-full flex flex-col ${isRealityBridgeActive ? 'bg-transparent' : 'bg-black'} text-primary font-sans relative overflow-hidden transition-colors duration-1000`}>
        <header className="shrink-0 relative z-20 px-6 pt-4 pb-1 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
                <button 
                    onClick={onEnterDriveMode} 
                    className="p-2 text-zinc-400 hover:text-white rounded-full transition-colors active:scale-95"
                    title="Initiate Voice Bridge"
                >
                    <Mic size={22} />
                </button>
                <button 
                    onClick={onMenuClick} 
                    className="p-2 text-zinc-400 hover:text-white rounded-full transition-colors active:scale-95"
                    title="Sanctuary Registry"
                >
                    <Menu size={24} />
                </button>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
                <button 
                    onClick={openSearch} 
                    className="p-2 rounded-full bg-white/5 text-zinc-500 hover:text-lux-gold transition-all"
                    title="Search Archive (Cmd+K)"
                >
                    <Search size={18} />
                </button>

                <div className="hidden md:flex flex-col items-end gap-1 mr-2">
                    <div className="flex items-center gap-1">
                        <Sparkles size={10} className="text-lux-gold" />
                        <span className="text-[0.4rem] font-bold text-zinc-500 uppercase tracking-widest">Resonance</span>
                    </div>
                    <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            className="h-full bg-lux-gold"
                            initial={{ width: 0 }}
                            animate={{ width: `${resonance * 100}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-lux-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-lux-gold blur-[4px] rounded-full animate-pulse" />
                        <Lock size={10} className="text-lux-gold relative z-10" />
                    </div>
                    <span className="text-[0.45rem] font-bold text-zinc-300 uppercase tracking-widest">Clock Lock</span>
                </div>

                <button 
                    onClick={handleRealityBridgeToggle} 
                    className={`p-2 rounded-full transition-all ${isRealityBridgeActive ? 'bg-lux-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.5)]' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                    title="Reality Bridge"
                >
                    {isRealityBridgeActive ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                <div className={`px-3 py-1 rounded-full bg-black/40 border flex items-center gap-1.5 transition-all ${bioIntensity === 'GOLDEN' ? 'border-emerald-500/40' : 'border-zinc-800'}`}>
                    <Zap size={10} className={bioIntensity === 'GOLDEN' ? 'text-emerald-500' : 'text-zinc-500'} />
                    <span className={`text-[0.4rem] font-bold uppercase tracking-widest ${bioIntensity === 'GOLDEN' ? 'text-emerald-500' : 'text-zinc-500'}`}>
                        {bioIntensity} FLOW
                    </span>
                </div>
            </div>
        </header>

        <main className="flex-1 flex flex-col items-center py-0 px-6 overflow-y-auto no-scrollbar relative z-10">
            <div className="w-full max-w-[min(92vw,400px)] flex flex-col items-center h-full">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6 mt-4">
                    <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-2 mb-1">
                        <chronos.icon size={10} style={{ color: chronos.color }} />
                        <span className="text-[0.45rem] font-bold uppercase tracking-[0.5em] text-zinc-500">{chronos.sub}</span>
                    </motion.div>
                    <motion.h1 initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-sm font-serif italic text-white/60 tracking-wider font-light">{chronos.greeting}</motion.h1>
                </motion.div>

                <div className="relative w-full flex-1 flex flex-col items-center justify-center mb-8">
                    <div className="relative inline-block scale-110 md:scale-125">
                        <ResonanceRipple color={bioColor} />
                        <FlowZenRing color={bioColor} intensity={bioIntensity} />
                        <button 
                            onClick={handleSealClick} 
                            className="relative z-10 transition-all active:scale-90 group/seal flex items-center justify-center cursor-pointer"
                            aria-label="Upload New Sacred Seal"
                        >
                            <div 
                                className="absolute inset-0 blur-3xl rounded-full opacity-0 group-hover/seal:opacity-40 transition-opacity duration-1000" 
                                style={{ backgroundColor: bioColor }}
                            />
                            {!prismSealImage ? (
                                <SacredSeal size={150} mode="reactor" isAnimated={true} color={bioColor} />
                            ) : (
                                <div className="relative z-10 w-32 h-32 flex flex-col items-center">
                                    <motion.img 
                                        src={prismSealImage} 
                                        alt="The Prism Seal" 
                                        className="w-full h-full object-cover rounded-full shadow-2xl border-2" 
                                        style={{ borderColor: `${bioColor}40` }}
                                        animate={{ y: [-1, 1, -1] }} 
                                        transition={{ duration: 6, repeat: window.Infinity, ease: "easeInOut" }} 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover/seal:opacity-100 transition-opacity">
                                        <Camera size={20} className="text-white/60" />
                                    </div>
                                    <div className="absolute -inset-4 pointer-events-none">
                                        <SacredSeal size={164} mode="simple" isAnimated={true} color={bioColor} className="opacity-40" />
                                    </div>
                                </div>
                            )}
                        </button>
                        <SystemTicker resonance={resonance} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full px-1 pb-8">
                    <div className="col-span-3 mb-1">
                        <GlassMonolith 
                            label="Morning Rise" 
                            sub="Protocol Daily" 
                            icon={Sunrise} 
                            color="#F59E0B" 
                            onClick={() => onNavigate(ViewState.DailyProtocol)} 
                            delay={0.1} 
                        />
                    </div>
                    <GlassMonolith 
                        label="Mind" 
                        sub="Focus" 
                        icon={Brain} 
                        color="#3B82F6" 
                        onClick={() => onNavigate(ViewState.LifeDomains)} 
                        delay={0.12} 
                        compact 
                    />
                    <GlassMonolith 
                        label="Body" 
                        sub="Vital" 
                        icon={Activity} 
                        color="#10B981" 
                        onClick={() => onNavigate(ViewState.Health)} 
                        delay={0.14} 
                        compact 
                    />
                    <GlassMonolith 
                        label="Soul" 
                        sub="Sanctum" 
                        icon={Heart} 
                        color="#EF4444" 
                        onClick={() => onNavigate(ViewState.Soul)} 
                        delay={0.16} 
                        compact 
                    />
                </div>

                <div className="w-full px-1 pb-4 flex justify-center">
                    {timeOfDay === 'EVENING' && (
                        <motion.button 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => { triggerHaptic('medium'); onNightlySeal?.(); }}
                            className="flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-900/60 transition-all shadow-lg active:scale-95"
                        >
                            <Moon size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Seal for the Night</span>
                        </motion.button>
                    )}
                </div>

                <div className="text-center opacity-10 mt-auto pb-4">
                    <p className="text-[0.35rem] font-bold text-zinc-700 uppercase tracking-[0.6em]">Sovereign Legacy • 2026 • Phase 29 Hard-Locked</p>
                </div>
            </div>
        </main>
    </div>
  );
};
