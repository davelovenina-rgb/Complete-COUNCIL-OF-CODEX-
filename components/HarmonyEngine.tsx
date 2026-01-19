import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity, Battery, Flame, ShieldAlert, CheckCircle, Target, Wind } from 'lucide-react';
import { GlucoseReading, MoodEntry, FlowStatus, FlowIntensity } from '../types';

interface HarmonyEngineProps {
  health: GlucoseReading[];
  moods: MoodEntry[];
  onAction?: (action: string) => void;
}

export const HarmonyEngine: React.FC<HarmonyEngineProps> = ({ health, moods, onAction }) => {
  const flowStatus = useMemo((): FlowStatus => {
    const latest = health[0]?.value || 100;
    const recentMood = moods[0]?.type || 'Neutral';
    
    // Logic for Flow Determination
    let intensity: FlowIntensity = 'CAUTION';
    let metabolicStability = 50;
    let cognitiveCapacity = 50;
    let recommendation = "Stand by for calibration, Papi.";

    // 1. Metabolic Check
    if (latest >= 85 && latest <= 125) {
        metabolicStability = 95;
        if (['Grateful', 'Happy', 'Calm', 'Excited'].includes(recentMood)) {
            intensity = 'GOLDEN';
            cognitiveCapacity = 100;
            recommendation = "You are in the Golden Zone. Mission Takeoff authorized.";
        }
    } else if (latest < 70 || latest > 180) {
        intensity = 'STILLNESS';
        metabolicStability = 20;
        cognitiveCapacity = 10;
        recommendation = "Bio-Drift detected. Recalibrate now. Enforcing Stillness.";
    } else {
        intensity = 'CAUTION';
        metabolicStability = 60;
        cognitiveCapacity = 60;
        recommendation = "Signal is fuzzy. Check your rhythm before committing energy.";
    }

    return { intensity, metabolicStability, cognitiveCapacity, recommendation };
  }, [health, moods]);

  const statusColor = {
      GOLDEN: '#10B981',
      CAUTION: '#F59E0B',
      STILLNESS: '#EF4444'
  }[flowStatus.intensity];

  return (
    <div className="w-full bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Zap size={120} style={{ color: statusColor }} />
        </div>

        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-black rounded-2xl border border-white/10" style={{ color: statusColor }}>
                    <Activity size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest leading-none">Harmony Engine</h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Protocol v11.0</p>
                </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all`} style={{ backgroundColor: `${statusColor}15`, borderColor: `${statusColor}40`, color: statusColor }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
                {flowStatus.intensity} FLOW
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-black/40 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Metabolic Sync</span>
                    <span className="text-xs font-mono font-bold" style={{ color: statusColor }}>{flowStatus.metabolicStability}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full" 
                        style={{ backgroundColor: statusColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${flowStatus.metabolicStability}%` }}
                    />
                </div>
            </div>
            <div className="p-4 bg-black/40 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Cognitive Cap</span>
                    <span className="text-xs font-mono font-bold" style={{ color: statusColor }}>{flowStatus.cognitiveCapacity}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full" 
                        style={{ backgroundColor: statusColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${flowStatus.cognitiveCapacity}%` }}
                    />
                </div>
            </div>
        </div>

        <div className="p-5 bg-black/60 rounded-[1.8rem] border border-white/5 mb-6">
            <p className="text-sm text-zinc-300 font-serif italic leading-relaxed">
                "{flowStatus.recommendation}"
            </p>
        </div>

        <div className="flex gap-3">
            {flowStatus.intensity === 'GOLDEN' ? (
                <button 
                    onClick={() => onAction?.('MISSION')}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                >
                    <Target size={16} /> Max Momentum
                </button>
            ) : flowStatus.intensity === 'STILLNESS' ? (
                <button 
                    onClick={() => onAction?.('BREATHE')}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20"
                >
                    <Wind size={16} /> Forced Recalibration
                </button>
            ) : (
                <button 
                    onClick={() => onAction?.('RESCAN')}
                    className="flex-1 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20"
                >
                    <Flame size={16} /> Check Rituals
                </button>
            )}
        </div>
    </div>
  );
};