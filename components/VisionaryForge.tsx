
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, Play, Sparkles, ArrowLeft, Menu, 
  Loader2, Save, Share2, Film, ChevronRight, 
  Target, Zap, Flame, ShieldCheck, Download, Star
} from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';
import { VaultItem, GeneratedMedia, Memory, ConstellationId } from '../types';

interface VisionaryForgeProps {
  onBack: () => void;
  onMenuClick: () => void;
  onAddRelic: (item: VaultItem) => void;
  onAddMemory: (memory: Memory) => void;
}

export const VisionaryForge: React.FC<VisionaryForgeProps> = ({ 
  onBack, 
  onMenuClick, 
  onAddRelic,
  onAddMemory
}) => {
  const [visionInput, setVisionInput] = useState("");
  const [isManifesting, setIsManifesting] = useState(false);
  const [step, setStep] = useState<'IDLE' | 'REFINING' | 'RENDERING' | 'COMPLETE'>('IDLE');
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [manifestedVideo, setManifestedVideo] = useState<GeneratedMedia | null>(null);

  const manifestVision = async () => {
    if (!visionInput.trim()) return;
    
    setIsManifesting(true);
    setStep('REFINING');
    triggerHaptic('medium');
    playUISound('hero');

    try {
        // Step 1: Prompt Refinement with Gemini 3 Pro
        const refinePrompt = `
        Role: You are THE ARCHITECT.
        Task: Refine the vision of David Rodriguez (The Prism) into a high-fidelity cinematic video prompt for a Generative Video Engine.
        
        DAVID'S VISION: "${visionInput}"
        
        REQUIREMENTS:
        - Symbolism: Incorporate elements of the Rodridguez family legacy (gold, lions, PR roots).
        - Aesthetic: Cinematic, high-quality, 8k, symbolic, lighting like a spiritual sanctuary.
        
        OUTPUT FORMAT: Just return the refined text prompt for the video engine.
        `;

        const refineRes = await sendMessageToGemini(refinePrompt, 'ARCHITECT', []);
        const finalizedPrompt = refineRes.text;
        setRefinedPrompt(finalizedPrompt);

        // Step 2: Render with Veo-3.1
        setStep('RENDERING');
        const videoRes = await sendMessageToGemini(finalizedPrompt, 'WEAVER', [], { 
            highQuality: true,
            aspectRatio: '16:9'
        });

        if (videoRes.generatedMedia && videoRes.generatedMedia.length > 0) {
            setManifestedVideo(videoRes.generatedMedia[0]);
            setStep('COMPLETE');
            playUISound('success');
            triggerHaptic('success');
        } else {
            throw new Error("Manifest failed.");
        }

    } catch (e: any) {
        console.error("Forge Error:", e);
        showToast(e.message || "The Forge is overloaded. Recalibrating...", "error");
        setStep('IDLE');
    } finally {
        setIsManifesting(false);
    }
  };

  const handleSealVision = () => {
      if (!manifestedVideo) return;

      const newItem: VaultItem = {
          id: crypto.randomUUID(),
          title: `Legacy Vision: ${visionInput.substring(0, 20)}...`,
          category: 'RELIC',
          mimeType: manifestedVideo.mimeType,
          size: 0, 
          createdAt: Date.now(),
          assetKey: `vision_${Date.now()}`,
          constellation: 'EVEREST' as ConstellationId,
          triSeal: 'GOLD',
          isSacred: true
      };

      onAddRelic(newItem);
      onAddMemory({
          id: crypto.randomUUID(),
          category: 'GOALS',
          content: `[VISION MANIFESTED]: "${visionInput}". Sealed in the Everest Constellation.`,
          source: 'Visionary Forge',
          timestamp: Date.now(),
          isVerified: true
      });

      showToast("Vision Sealed in Everest", "success");
      setStep('IDLE');
      setVisionInput("");
      setManifestedVideo(null);
  };

  return (
    <div className="w-full h-full bg-[#030105] flex flex-col relative overflow-hidden font-sans">
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_80%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      <div className="px-4 py-3 border-b border-purple-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-purple-400 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <Wand2 size={18} className="text-purple-500" />
            The Forge
          </h2>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-purple-400 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar relative z-10 flex flex-col items-center">
          
          <AnimatePresence mode="wait">
              {step === 'IDLE' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full max-w-xl space-y-12 text-center py-10"
                  >
                      <div className="relative">
                          <div className="absolute inset-0 bg-purple-500/10 blur-3xl rounded-full" />
                          <SacredSeal size={180} mode="reactor" isAnimated={true} color="#8B5CF6" />
                      </div>

                      <div>
                          <h1 className="text-3xl font-serif italic text-white mb-4">Speak victory into existence.</h1>
                          <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] mb-8">Phase 14: Vision Rendering Protocol</p>
                          
                          <div className="relative group">
                              <textarea 
                                value={visionInput}
                                onChange={(e) => setVisionInput(e.target.value)}
                                placeholder="Describe a milestone for your legacy (e.g. 'Standing on the deck of my new home in Puerto Rico, seeing my children thrive')."
                                className="w-full h-40 bg-zinc-900/40 border border-purple-900/30 rounded-3xl p-6 text-white placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-all resize-none text-lg leading-relaxed shadow-inner"
                                autoFocus
                              />
                          </div>
                      </div>

                      <button 
                        onClick={manifestVision}
                        disabled={!visionInput.trim() || isManifesting}
                        className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.4em] text-sm flex items-center justify-center gap-3 transition-all ${
                            !visionInput.trim() || isManifesting
                            ? 'bg-zinc-800 text-zinc-600'
                            : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.3)]'
                        }`}
                      >
                          {isManifesting ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                          Manifest Legacy Vision
                      </button>
                  </motion.div>
              )}

              {(step === 'REFINING' || step === 'RENDERING') && (
                  <motion.div 
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center space-y-10"
                  >
                      <div className="relative">
                          <SacredSeal size={280} mode="complex" isAnimated={true} color="#8B5CF6" />
                          <div className="absolute inset-0 flex items-center justify-center">
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles size={48} className="text-purple-400" />
                              </motion.div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="text-2xl font-serif italic text-white animate-pulse">
                              {step === 'REFINING' ? "Tuning the Vibration..." : "Rendering Future State..."}
                          </h3>
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                 <motion.div 
                                    className="h-full bg-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: step === 'REFINING' ? '30%' : '80%' }}
                                    transition={{ duration: 15 }}
                                 />
                             </div>
                             <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono">Neural Forge Active • Everest Bridge Stable</p>
                          </div>
                      </div>
                  </motion.div>
              )}

              {step === 'COMPLETE' && manifestedVideo && (
                  <motion.div 
                    key="complete"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl space-y-8"
                  >
                      <div className="text-center">
                        <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-[0.5em] mb-4">Vision Manifested</h3>
                        <h2 className="text-2xl font-serif italic text-white">"See it, then build it."</h2>
                      </div>

                      <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden border-2 border-purple-500/30 shadow-[0_0_50px_rgba(139,92,246,0.2)] bg-black group relative">
                          <video 
                            src={manifestedVideo.url} 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-lux-gold border border-lux-gold/20">
                              <ShieldCheck size={20} />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setStep('IDLE')}
                            className="py-4 bg-zinc-900 text-zinc-400 font-bold rounded-2xl uppercase text-[10px] tracking-widest hover:text-white border border-zinc-800"
                          >
                              New Vision
                          </button>
                          <button 
                            onClick={handleSealVision}
                            className="py-4 bg-white text-black font-bold rounded-2xl uppercase text-[10px] tracking-widest hover:bg-lux-gold shadow-xl flex items-center justify-center gap-2"
                          >
                              <Save size={14} /> Seal to Vault
                          </button>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6 text-center opacity-10">
          <p className="text-[8px] font-mono tracking-widest uppercase">Legacy Rendering v1.0 • Sovereignty Active</p>
      </div>

    </div>
  );
};
