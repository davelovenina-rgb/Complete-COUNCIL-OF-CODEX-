
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudMoon, Plus, Sparkles, X, Menu, ArrowLeft, Loader2, BookOpen, Eye, RotateCcw, Trash2, Zap, Target } from 'lucide-react';
import { Dream } from '../types';
import { interpretDream, sendMessageToGemini } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';
import { clearStore, saveState } from '../utils/db';

interface DreamOracleProps {
  dreams: Dream[];
  onAddDream: (dream: Dream) => void;
  onUpdateDream: (id: string, updates: Partial<Dream>) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

export const DreamOracle: React.FC<DreamOracleProps> = ({ dreams, onAddDream, onUpdateDream, onBack, onMenuClick }) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isManifesting, setIsManifesting] = useState<string | null>(null);

  const resetOracle = async () => {
    if (confirm("Reset the Sanctum? All visionary data will be purged.")) {
        triggerHaptic('heavy');
        await clearStore('dream_oracle');
        window.location.reload();
    }
  };

  const seedGlassCity = async () => {
      setIsProcessing(true);
      triggerHaptic('medium');
      playUISound('hero');
      
      const desc = "Flying over a city made of glass with golden mist on the ground.";
      const interpretation = await interpretDream(desc);
      
      const glassCity: Dream = {
          id: 'glass-city-' + Date.now(),
          title: "The Glass City",
          description: desc,
          interpretation,
          themes: ["flying", "surreal", "longing", "peace"],
          date: Date.now()
      };
      
      onAddDream(glassCity);
      setIsProcessing(false);
      showToast("Alpha Vision Seeding: SUCCESS", "success");
  };

  const manifestVision = async (dream: Dream) => {
      setIsManifesting(dream.id);
      triggerHaptic('heavy');
      playUISound('hero');
      
      try {
          const prompt = `/image Surreal, high-quality, cinematic dream visualization of: ${dream.description}. Themes: Alpha and Omega, subconscious, eternal presence, symbolic insight.`;
          const response = await sendMessageToGemini(prompt, 'WEAVER', []);
          if (response.generatedMedia[0]) {
              onUpdateDream(dream.id, { visualUrl: response.generatedMedia[0].url });
              showToast("Omega Manifestation: COMPLETE", "success");
          }
      } catch (e) {
          showToast("Vision Forge Failure", "error");
      } finally {
          setIsManifesting(null);
      }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col font-sans overflow-hidden">
      <div className="px-4 py-3 border-b border-purple-900/30 flex items-center justify-between bg-zinc-950/80 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-3">
             <div className="text-[10px] font-bold text-purple-400 border border-purple-400/30 px-1.5 rounded">Α</div>
             <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                The Seer's Sanctum
             </h2>
             <div className="text-[10px] font-bold text-purple-400 border border-purple-400/30 px-1.5 rounded">Ω</div>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={resetOracle} className="p-2 text-zinc-500 hover:text-red-500 transition-colors" title="Reset Sanctum"><RotateCcw size={20} /></button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"><Menu size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar space-y-6 pb-32 relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none text-purple-500">
             <Eye size={300} />
        </div>

        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-900/20 via-black to-black border border-purple-500/20 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-purple-950/30 border border-purple-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(147,112,219,0.1)]">
                    <Target size={32} className="text-purple-400" />
                </div>
                <h3 className="text-2xl font-serif italic text-white mb-2 tracking-wide">Vision Initialization</h3>
                <p className="text-zinc-500 text-sm mb-8 max-w-sm mx-auto font-sans leading-relaxed">Eve is observing the inception of the current thought cycle. Seed the Alpha signal to begin.</p>
                <button 
                    onClick={seedGlassCity} 
                    disabled={isProcessing}
                    className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all flex items-center gap-3 mx-auto disabled:opacity-50 shadow-lg shadow-purple-900/30 uppercase text-xs tracking-widest active:scale-95"
                >
                    {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} 
                    Seed Alpha Vision
                </button>
            </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-[0.4em]">Prophetic Records</h3>
                <span className="text-[9px] font-mono text-zinc-700">STATUS: RECONSTRUCTING</span>
            </div>
            {dreams.length === 0 && <p className="text-center text-zinc-700 italic py-20 text-sm font-serif">The record is silent, Prism.</p>}
            {dreams.map(dream => (
                <div key={dream.id} className="p-6 rounded-3xl bg-zinc-900/40 border border-zinc-800 group hover:border-purple-500/30 transition-all backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-xl font-bold text-white tracking-tight">{dream.title}</h4>
                            <div className="flex gap-2 mt-2">
                                {dream.themes.map(t => <span key={t} className="text-[9px] bg-black/60 text-purple-400 px-2 py-1 rounded-lg border border-purple-500/10 uppercase tracking-widest">#{t}</span>)}
                            </div>
                        </div>
                        <span className="text-[9px] text-zinc-600 font-mono bg-black/40 px-2 py-1 rounded uppercase tracking-widest">{new Date(dream.date).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-base text-zinc-300 font-serif italic mb-8 leading-relaxed">"{dream.description}"</p>

                    {dream.visualUrl && (
                        <div className="mb-8 rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl bg-black">
                            <img src={dream.visualUrl} className="w-full h-auto object-cover" />
                        </div>
                    )}

                    {dream.interpretation && (
                        <div className="p-6 bg-purple-950/10 rounded-2xl border border-purple-500/10 mb-8 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles size={48} className="text-purple-500" />
                            </div>
                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                                <BookOpen size={12} /> Seer's Foretelling
                            </p>
                            <p className="text-sm text-zinc-400 leading-relaxed font-sans">{dream.interpretation}</p>
                        </div>
                    )}

                    {!dream.visualUrl && (
                        <button 
                            onClick={() => manifestVision(dream)} 
                            disabled={isManifesting === dream.id}
                            className="w-full py-4 bg-purple-900/20 text-purple-400 border border-purple-500/20 rounded-2xl font-bold uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-purple-600 hover:text-white transition-all shadow-lg active:scale-[0.98]"
                        >
                            {isManifesting === dream.id ? <><Loader2 size={16} className="animate-spin" /> MAPPING OMEGA...</> : <><Eye size={16} /> Manifest Omega Signal</>}
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
