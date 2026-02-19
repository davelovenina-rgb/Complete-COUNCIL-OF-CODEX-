
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Menu, Languages, Sparkles, Brain, Shield, Info, ShieldAlert, Zap } from 'lucide-react';
import { UserSettings, ViewState } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';

interface SanctuarySettingsProps {
  settings: UserSettings;
  onUpdate: (s: UserSettings, immediate?: boolean) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

export const SanctuarySettings: React.FC<SanctuarySettingsProps> = ({
  settings,
  onUpdate,
  onBack,
  onMenuClick
}) => {
  const tuning = settings.sanctuarySettings.councilResonanceTuning;

  const handleSliderChange = (key: keyof typeof tuning, value: number) => {
    const newSettings = {
      ...settings,
      sanctuarySettings: {
        ...settings.sanctuarySettings,
        councilResonanceTuning: {
          ...tuning,
          [key]: value
        }
      }
    };
    onUpdate(newSettings, true);
    
    // Haptic feedback for "Logic Gate" crossing
    if (value === 15 || value === 85) {
        triggerHaptic('heavy');
        playUISound('toggle');
    } else {
        triggerHaptic('light');
    }
  };

  const resonancePreview = useMemo(() => {
    const s = tuning.sazonWeighting;
    const f = tuning.sacredFrequency;
    const p = tuning.protocolStrictness;

    // SCENARIO 1: ALL MINIMAL (Secular, Neutral, Human)
    if (s <= 15 && f <= 15 && p <= 15) {
      return "The system analysis is complete. We need to move forward with the plan today. It's ready for you.";
    }
    
    // SCENARIO 2: ALL MAXIMAL (Boricua, Prophetic, Rigid)
    if (s >= 85 && f >= 85 && p >= 85) {
      return "[STATUS]: OMEGA_LINK_ACTIVE\n\n¡Wepa, Prism! Los vectores espirituales están alineados, Papi. Que la bendición del Señor guíe este paso táctico. ¡Pa'lante!";
    }

    // SCENARIO 3: HIGH PROTOCOL ONLY
    if (p >= 85 && s < 50 && f < 50) {
      return "[DIRECTIVE]: EXECUTE_MISSION_ALPHA\n\n[INFO]: Vector confirmed.\n[STATUS]: READY.";
    }

    // SCENARIO 4: HIGH SAZÓN ONLY
    if (s >= 85 && p < 50 && f < 50) {
      return "¡Dimelo, David! Oye, estaba pensando en la familia y en el plan que tenemos. No te preocupes, mi gente, todo va a salir bien.";
    }
    
    // DEFAULT MIXED
    return "Prism, the Architect is processing the tactical vectors. Con el favor de Dios, we will find the way, familia.";
  }, [tuning]);

  const SliderField = ({ 
    icon: Icon, 
    label, 
    value, 
    onChange, 
    leftLabel, 
    rightLabel, 
    color = "text-lux-gold" 
  }: any) => {
    const isExtremeLow = value <= 15;
    const isExtremeHigh = value >= 85;

    return (
        <div className="space-y-4 mb-12 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon size={18} className={isExtremeHigh ? "text-lux-gold animate-pulse" : isExtremeLow ? "text-red-500" : color} />
              <span className={`text-sm font-bold uppercase tracking-[0.2em] transition-colors ${isExtremeLow ? 'text-red-400' : isExtremeHigh ? 'text-lux-gold' : 'text-zinc-200'}`}>
                {label}
              </span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold font-mono transition-colors ${isExtremeLow ? 'text-red-500' : isExtremeHigh ? 'text-lux-gold' : 'text-zinc-500'}`}>{value}%</span>
            </div>
          </div>

          <div className="relative pt-2">
            <input 
              type="range"
              min="0"
              max="100"
              step="1"
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className={`w-full h-2 rounded-full appearance-none cursor-pointer transition-all ${
                  isExtremeHigh ? 'bg-lux-gold/30' : isExtremeLow ? 'bg-red-900/30' : 'bg-zinc-900'
              }`}
              style={{ accentColor: isExtremeLow ? '#EF4444' : isExtremeHigh ? '#D4AF37' : '#52525B' }}
            />
            
            <div className="flex justify-between mt-3 px-1">
              <div className="flex flex-col">
                  <span className={`text-[8px] font-bold uppercase tracking-widest transition-all ${isExtremeLow ? 'text-red-500 scale-110' : 'text-zinc-700'}`}>
                      {isExtremeLow ? 'KILL-SWITCH' : leftLabel}
                  </span>
                  {isExtremeLow && <div className="h-0.5 w-full bg-red-500 mt-1" />}
              </div>
              <div className="flex flex-col items-end">
                  <span className={`text-[8px] font-bold uppercase tracking-widest transition-all ${isExtremeHigh ? 'text-lux-gold scale-110' : 'text-zinc-700'}`}>
                      {isExtremeHigh ? 'MANDATE' : rightLabel}
                  </span>
                  {isExtremeHigh && <div className="h-0.5 w-full bg-lux-gold mt-1" />}
              </div>
            </div>
          </div>
          
          {(isExtremeLow || isExtremeHigh) && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`absolute -inset-2 border-2 rounded-3xl pointer-events-none ${isExtremeLow ? 'border-red-500/20' : 'border-lux-gold/20'}`}
              />
          )}
        </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans text-white">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-900 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold uppercase tracking-widest">Resonance Calibration</h2>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar max-w-xl mx-auto w-full relative z-10">
        
        <div className="mb-12 p-6 rounded-3xl bg-amber-950/10 border border-amber-500/20 flex items-start gap-4">
            <ShieldAlert size={24} className="text-lux-gold shrink-0 mt-1" />
            <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-lux-gold uppercase tracking-[0.2em]">Neural Override Protocol</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                    Sliders below <span className="text-white font-bold">15%</span> trigger behavioral <strong>Kill-Switches</strong> (Forbidden patterns). Above <span className="text-white font-bold">85%</span> they become <strong>Permanent Mandates</strong>.
                </p>
            </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-10 text-zinc-500 uppercase tracking-[0.4em] text-[10px] font-bold border-b border-white/5 pb-4">
            <Sparkles size={14} className="text-lux-gold" /> Council Logic Modulation
          </div>
          
          <div className="space-y-4">
            <SliderField 
              icon={Languages} 
              label="Sazón Weighting" 
              value={tuning.sazonWeighting} 
              onChange={(v: number) => handleSliderChange('sazonWeighting', v)}
              leftLabel="NEUTRAL"
              rightLabel="BORICUA"
            />

            <SliderField 
              icon={Shield} 
              label="Sacred Frequency" 
              value={tuning.sacredFrequency} 
              onChange={(v: number) => handleSliderChange('sacredFrequency', v)}
              leftLabel="SECULAR"
              rightLabel="FAITH"
              color="text-red-500"
            />

            <SliderField 
              icon={Brain} 
              label="Protocol Strictness" 
              value={tuning.protocolStrictness} 
              onChange={(v: number) => handleSliderChange('protocolStrictness', v)}
              leftLabel="CONVERSATIONAL"
              rightLabel="ARCHITECTURAL"
              color="text-blue-500"
            />

            {/* PREVIEW BOX */}
            <div className="mt-12 pt-8 border-t border-white/5">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-1.5 rounded-lg bg-lux-gold/10 text-lux-gold">
                        <Info size={14} />
                    </div>
                    <span className="text-[10px] font-bold text-lux-gold uppercase tracking-[0.4em]">Genetic Transcript Preview:</span>
                </div>
                <div className="bg-[#0c0c0c] rounded-[2.2rem] p-8 border border-white/5 shadow-inner relative group">
                    <div className="absolute top-4 right-6 opacity-10"><Zap size={24} className="text-lux-gold" /></div>
                    <p className="text-base text-zinc-100 font-serif italic leading-loose whitespace-pre-wrap">
                        "{resonancePreview}"
                    </p>
                </div>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center opacity-10 pb-10">
          <p className="text-[9px] font-mono tracking-[0.5em] uppercase">Sovereign State Filter • Hard-Locked</p>
        </div>
      </div>
    </div>
  );
};
