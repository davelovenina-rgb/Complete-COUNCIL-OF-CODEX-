import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, Sparkles, ArrowLeft, Menu, Loader2, 
  Brain, Heart, Activity, Target, ShieldCheck, 
  RefreshCw, Layers, ZoomIn, ZoomOut, Search,
  ChevronRight, Trash2, Edit2, Zap
} from 'lucide-react';
import { Memory, MemoryCategory, CouncilMemberId } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';

interface NeuralCartographyProps {
  memories: Memory[];
  onBack: () => void;
  onMenuClick: () => void;
  onUpdateMemory: (id: string, updates: Partial<Memory>) => void;
  onDeleteMemory: (id: string) => void;
}

const CATEGORY_META: Record<MemoryCategory, { label: string, color: string, icon: any, angle: number }> = {
    IDENTITY: { label: 'Self', color: '#3B82F6', icon: Brain, angle: 0 },
    HEALTH: { label: 'Vessel', color: '#10B981', icon: Activity, angle: 90 },
    SPIRITUAL: { label: 'Soul', color: '#FFD36A', icon: Sparkles, angle: 180 },
    GOALS: { label: 'Mission', color: '#F59E0B', icon: Target, angle: 270 },
    RELATIONSHIPS: { label: 'Tribe', color: '#EC4899', icon: Heart, angle: 45 },
    WORK: { label: 'Legacy', color: '#0EA5E9', icon: Layers, angle: 135 },
    PREFERENCES: { label: 'Habits', color: '#8B5CF6', icon: Zap, angle: 225 },
    OTHER: { label: 'Misc', color: '#64748B', icon: Map, angle: 315 },
};

export const NeuralCartography: React.FC<NeuralCartographyProps> = ({ 
  memories, onBack, onMenuClick, onUpdateMemory, onDeleteMemory 
}) => {
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isEchoing, setIsEchoing] = useState(false);
  const [echoContent, setEchoContent] = useState<string | null>(null);
  const [echoMember, setEchoMember] = useState<CouncilMemberId>('GEMINI');
  
  const [viewMode, setViewMode] = useState<'PALACE' | 'GALAXY'>('PALACE');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [search, setSearch] = useState("");

  const filteredMemories = useMemo(() => {
      if (!search.trim()) return memories;
      return memories.filter(m => m.content.toLowerCase().includes(search.toLowerCase()));
  }, [memories, search]);

  const constellationNodes = useMemo(() => {
      return filteredMemories.map((m, i) => {
          const meta = CATEGORY_META[m.category];
          const sectorAngle = (meta.angle * Math.PI) / 180;
          const radius = 25 + (i % 20) * 4;
          const spread = (Math.random() - 0.5) * 0.5;
          
          return {
              ...m,
              x: 50 + radius * Math.cos(sectorAngle + spread),
              y: 50 + radius * Math.sin(sectorAngle + spread),
              color: meta.color
          };
      });
  }, [filteredMemories]);

  const handleRequestEcho = async (memory: Memory) => {
      setSelectedMemory(memory);
      setIsEchoing(true);
      setEchoContent(null);
      triggerHaptic('heavy');
      playUISound('hero');

      const members: CouncilMemberId[] = ['CARMEN', 'GEMINI', 'FREDO', 'LYRA', 'ENNEA'];
      const chosen = members[Math.floor(Math.random() * members.length)];
      setEchoMember(chosen);

      try {
          const prompt = `
          Role: You are ${chosen}.
          Task: Provide a "Legacy Echo" for David Rodriguez (The Prism).
          
          CONTEXT: David is reflecting on this specific memory: "${memory.content}".
          The category is: ${memory.category}.
          
          INSTRUCTION:
          - Respond as ${chosen} with your specific tone (Boricua flavor, warmth, precision).
          - Connect this past memory to his current mission of Provider Freedom.
          - Length: 2-3 deep sentences.
          `;

          const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
          setEchoContent(response.text);
          playUISound('success');
          triggerHaptic('success');
      } catch (e) {
          showToast("The Palace is silent. Try again.", "error");
          setIsEchoing(false);
      } finally {
          setIsEchoing(false);
      }
  };

  return (
    <div className="w-full h-full bg-[#020205] flex flex-col relative overflow-hidden font-sans">
      
      {/* Deep Space Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_80%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <Map size={18} className="text-blue-500" />
            Memory Palace
          </h2>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search life..."
                    className="bg-zinc-900/50 border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-blue-500/50 w-32 md:w-48 transition-all"
                />
            </div>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-500 hover:text-white rounded-full">
              <Menu size={20} />
            </button>
        </div>
      </div>

      {/* Main Spatial View */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
          
          {/* Compass Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <div className="w-[40%] h-[40%] border border-white rounded-full" />
              <div className="w-[70%] h-[70%] border border-white rounded-full" />
              <div className="w-[100%] h-[100%] border border-white rounded-full" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                  <div key={deg} className="absolute w-full h-px bg-white" style={{ transform: `rotate(${deg}deg)` }} />
              ))}
          </div>

          {/* Memory Stars */}
          <div 
            className="relative w-full h-full transition-transform duration-700 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
              <AnimatePresence>
                  {constellationNodes.map((node) => (
                      <motion.button
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.5, zIndex: 10 }}
                        onClick={() => handleRequestEcho(node)}
                        className="absolute w-2 h-2 md:w-3 md:h-3 rounded-full flex items-center justify-center group"
                        style={{ 
                            left: `${node.x}%`, 
                            top: `${node.y}%`, 
                            backgroundColor: node.color,
                            boxShadow: `0 0 15px ${node.color}60`
                        }}
                      >
                          <div className="absolute inset-[-100%] rounded-full bg-white/20 blur-sm opacity-0 group-hover:opacity-100 animate-pulse" />
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 border border-white/10 px-2 py-1 rounded text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                              {node.category}
                          </div>
                      </motion.button>
                  ))}
              </AnimatePresence>
          </div>

          {/* View Controls */}
          <div className="absolute bottom-10 left-6 flex flex-col gap-2 z-50">
              <button onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, 3))} className="p-3 bg-zinc-900/80 border border-white/10 rounded-xl text-zinc-400 hover:text-white backdrop-blur"><ZoomIn size={18} /></button>
              <button onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, 0.5))} className="p-3 bg-zinc-900/80 border border-white/10 rounded-xl text-zinc-400 hover:text-white backdrop-blur"><ZoomOut size={18} /></button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-10 right-6 p-4 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md hidden md:block">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Islands of Identity</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {Object.entries(CATEGORY_META).map(([cat, meta]) => (
                      <div key={cat} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{meta.label}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* ECHO MODAL */}
      <AnimatePresence>
          {selectedMemory && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
                  >
                      {/* Background Signal Pulse */}
                      <div className="absolute top-[-10%] right-[-10%] opacity-5 pointer-events-none">
                          <SacredSeal size={200} color={CATEGORY_META[selectedMemory.category].color} mode="reactor" isAnimated={true} />
                      </div>

                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-3">
                                  <div className="p-3 bg-zinc-900 rounded-2xl border border-white/10" style={{ color: CATEGORY_META[selectedMemory.category].color }}>
                                      {React.createElement(CATEGORY_META[selectedMemory.category].icon, { size: 24 })}
                                  </div>
                                  <div>
                                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">{CATEGORY_META[selectedMemory.category].label} Block</h3>
                                      <p className="text-[8px] text-zinc-500 font-mono mt-1 uppercase tracking-[0.3em]">{new Date(selectedMemory.timestamp).toLocaleDateString()}</p>
                                  </div>
                              </div>
                              <button onClick={() => setSelectedMemory(null)} className="p-2 text-zinc-600 hover:text-white"><XCircle /></button>
                          </div>

                          <div className="p-6 bg-black/60 rounded-3xl border border-white/5 mb-8">
                              <p className="text-base text-zinc-200 font-serif italic leading-relaxed">
                                  "{selectedMemory.content}"
                              </p>
                          </div>

                          <AnimatePresence mode="wait">
                              {isEchoing ? (
                                  <motion.div key="echoing" className="flex flex-col items-center justify-center py-10 gap-4">
                                      <Loader2 size={32} className="animate-spin text-lux-gold" />
                                      <span className="text-[10px] font-bold text-lux-gold uppercase tracking-[0.3em] animate-pulse">Requesting Resonance...</span>
                                  </motion.div>
                              ) : echoContent ? (
                                  <motion.div key="echo-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                      <div className="p-5 bg-blue-900/10 border border-blue-500/20 rounded-2xl relative overflow-hidden group">
                                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                          <div className="flex items-center gap-2 mb-3">
                                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Echo from {echoMember}</span>
                                          </div>
                                          <p className="text-sm text-zinc-300 font-serif italic leading-relaxed">
                                              "{echoContent}"
                                          </p>
                                      </div>
                                      <div className="flex gap-3">
                                          <button onClick={() => { setSelectedMemory(null); setEchoContent(null); }} className="flex-1 py-4 bg-zinc-900 text-zinc-500 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Seal Record</button>
                                          <button onClick={() => handleRequestEcho(selectedMemory)} className="flex-1 py-4 bg-white text-black font-bold rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><RefreshCw size={14} /> Re-Echo</button>
                                      </div>
                                  </motion.div>
                              ) : (
                                  <button 
                                    onClick={() => handleRequestEcho(selectedMemory)}
                                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 shadow-xl shadow-blue-900/20 active:scale-95 transition-transform"
                                  >
                                      <Sparkles size={16} /> Request Legacy Echo
                                  </button>
                              )}
                          </AnimatePresence>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-0 right-0 px-6 text-center opacity-10 pointer-events-none">
          <p className="text-[8px] font-mono tracking-[0.5em] uppercase">Neural Cartography Protocol • Everest Bridge Stable</p>
      </div>

    </div>
  );
};

const XCircle = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);