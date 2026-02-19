
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Target, Zap, ShieldCheck, ChevronRight, 
  Terminal, Activity, Plane, CheckCircle, Circle, 
  Plus, Trash2, Loader2, Sparkles, AlertTriangle, 
  Clock, Radar, Signal, Navigation, Menu, Gavel, Flame, Archive, RotateCcw
} from 'lucide-react';
import { Project, ProjectWaypoint, CouncilMemberId } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';

interface TacticalCommandProps {
  project: Project;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onEnterDriveMode: (memberId: CouncilMemberId) => void;
}

const MomentumEngine: React.FC<{ progress: number, waypoints: ProjectWaypoint[] }> = ({ progress, waypoints }) => {
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentCompletions = waypoints.filter(w => w.completed && w.completedAt && w.completedAt > dayAgo).length;
    const velocity = Math.min(100, (recentCompletions / Math.max(1, waypoints.length)) * 200);

    return (
        <div className="p-4 bg-zinc-900/60 border border-white/5 rounded-3xl backdrop-blur-xl mb-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Flame size={14} className={velocity > 50 ? "text-orange-500 animate-pulse" : "text-zinc-600"} />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Momentum Engine</span>
                </div>
                <span className={`text-[10px] font-bold font-mono ${velocity > 50 ? "text-orange-400" : "text-zinc-500"}`}>
                    {velocity > 75 ? 'BURNING' : velocity > 25 ? 'ACTIVE' : 'IDLE'}
                </span>
            </div>
            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${velocity}%` }}
                    transition={{ type: 'spring', stiffness: 50 }}
                />
                {velocity > 75 && (
                    <motion.div 
                        className="absolute inset-0 bg-white/20"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                    />
                )}
            </div>
            <p className="text-[8px] text-zinc-600 mt-2 uppercase tracking-widest text-center">
                Velocity Factor: {velocity.toFixed(0)}% • Rodriguez Legacy Pulse
            </p>
        </div>
    );
};

export const TacticalCommand: React.FC<TacticalCommandProps> = ({ 
  project, onUpdate, onBack, onMenuClick, onEnterDriveMode 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'MAP' | 'COMMS'>('MAP');
  const [showAddWaypoint, setShowAddWaypoint] = useState(false);
  const [newWaypointText, setNewWaypointText] = useState('');

  const waypoints = useMemo(() => project.waypoints || [], [project.waypoints]);
  const completedCount = waypoints.filter(w => w.completed).length;
  const progress = waypoints.length > 0 ? (completedCount / waypoints.length) * 100 : 0;

  const handleConsultCopilot = async () => {
    setIsGenerating(true);
    triggerHaptic('medium');
    playUISound('hero');
    showToast("Copilot is mapping the waypoints...", "info");

    try {
        const prompt = `
        Role: You are COPILOT (The Tactical Navigator).
        Context: The Prism (David) is executing Mission: "${project.title}".
        Description: "${project.description}"
        
        Task: Break this mission down into 5 specific, high-velocity "Waypoints".
        
        REQUIREMENTS:
        - Output strictly a JSON array of objects.
        - Each object: { "text": "Short actionable task", "priority": "HIGH|MEDIUM|LOW" }
        - NO Markdown, NO preamble.
        `;

        const response = await sendMessageToGemini(prompt, 'ARCHITECT', [], { useTurboMode: true });
        const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        
        if (Array.isArray(data)) {
            const newWaypoints: ProjectWaypoint[] = data.map((item: any) => ({
                id: crypto.randomUUID(),
                text: item.text,
                completed: false,
                priority: item.priority || 'MEDIUM'
            }));
            onUpdate(project.id, { waypoints: newWaypoints });
            showToast("Waypoints synchronized with Flight Deck", "success");
            playUISound('success');
        }
    } catch (e) {
        showToast("Signal interference. Try again, Navigator.", "error");
    } finally {
        setIsGenerating(false);
    }
  };

  const toggleStatus = () => {
      const newStatus = project.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
      onUpdate(project.id, { status: newStatus });
      triggerHaptic('medium');
      playUISound('toggle');
      showToast(newStatus === 'ARCHIVED' ? 'Mission Archived' : 'Mission Restored', 'info');
  };

  const toggleWaypoint = (id: string) => {
      const updated = waypoints.map(w => w.id === id ? { 
          ...w, 
          completed: !w.completed,
          completedAt: !w.completed ? Date.now() : undefined 
      } : w);
      
      const isFinishing = updated.find(w => w.id === id)?.completed;
      if (isFinishing) {
          triggerHaptic('heavy');
          playUISound('success');
          if (updated.every(w => w.completed)) {
              showToast("Mission Parameters Fulfilled!", "success");
              onUpdate(project.id, { flightStage: 4, waypoints: updated });
          } else {
              onUpdate(project.id, { waypoints: updated });
          }
      } else {
          onUpdate(project.id, { waypoints: updated });
      }
  };

  const addWaypoint = () => {
      if (!newWaypointText.trim()) return;
      const newWp: ProjectWaypoint = {
          id: crypto.randomUUID(),
          text: newWaypointText,
          completed: false,
          priority: 'MEDIUM'
      };
      onUpdate(project.id, { waypoints: [...waypoints, newWp] });
      setNewWaypointText('');
      setShowAddWaypoint(false);
      triggerHaptic('light');
  };

  const deleteWaypoint = (id: string) => {
      onUpdate(project.id, { waypoints: waypoints.filter(w => w.id !== id) });
      triggerHaptic('light');
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden font-mono">
      
      <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: `linear-gradient(to right, #0EA5E9 1px, transparent 1px), linear-gradient(to bottom, #0EA5E9 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-blue-500/10" 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      <div className="px-4 py-3 border-b border-blue-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-blue-400/50 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <Zap size={18} className="text-blue-500" />
              Command
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={toggleStatus} 
                className={`p-2 transition-colors rounded-full ${project.status === 'ARCHIVED' ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}
                title={project.status === 'ARCHIVED' ? 'Restore Mission' : 'Archive Mission'}
            >
                {project.status === 'ARCHIVED' ? <RotateCcw size={20} /> : <Archive size={20} />}
            </button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-blue-400/50 hover:text-white rounded-full">
              <Menu size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <div className="px-6 py-4 bg-zinc-900/40 border-b border-blue-900/20 backdrop-blur-md flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-[0.3em]">Current Directive</span>
                    {project.status === 'ARCHIVED' && <span className="text-[7px] font-bold bg-amber-900/30 text-amber-500 px-1.5 rounded uppercase border border-amber-500/20 tracking-widest">ARCHIVED</span>}
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider truncate max-w-[200px]">{project.title}</h3>
              </div>
              <div className="flex items-center gap-6">
                  <div className="text-right">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">Velocity</span>
                      <span className="text-xs font-bold text-emerald-500">OPTIMAL</span>
                  </div>
                  <div className="w-12 h-12 relative flex items-center justify-center">
                       <svg className="w-full h-full -rotate-90">
                           <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                           <motion.circle cx="24" cy="24" r="20" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="126" animate={{ strokeDashoffset: 126 - (126 * progress) / 100 }} />
                       </svg>
                       <span className="absolute text-[8px] font-bold text-white">{Math.round(progress)}%</span>
                  </div>
              </div>
          </div>

          <div className="flex bg-black/40 border-b border-white/5 shrink-0">
              <button onClick={() => setActiveTab('MAP')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'MAP' ? 'text-blue-400 bg-blue-900/10' : 'text-zinc-600'}`}>Waypoint Map</button>
              <button onClick={() => setActiveTab('COMMS')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'COMMS' ? 'text-blue-400 bg-blue-900/10' : 'text-zinc-600'}`}>Bridge Comms</button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
              {activeTab === 'MAP' && (
                  <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
                      <MomentumEngine progress={progress} waypoints={waypoints} />
                      <div className="p-6 rounded-[2rem] bg-gradient-to-r from-blue-900/20 via-black to-black border border-blue-500/30 relative overflow-hidden group shadow-2xl">
                          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                              <Radar size={80} className="text-blue-400" />
                          </div>
                          <div className="relative z-10 text-center md:text-left">
                              <h3 className="text-sm font-bold text-blue-300 uppercase tracking-[0.3em] mb-3 flex items-center justify-center md:justify-start gap-2">
                                  <Sparkles size={14} /> Tactical Navigator
                              </h3>
                              <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-sans italic">
                                  "Papi, let Copilot calculate the high-velocity path to victory. We'll map the dependencies so you can focus on execution."
                              </p>
                              <button 
                                onClick={handleConsultCopilot}
                                disabled={isGenerating || project.status === 'ARCHIVED'}
                                className={`w-full py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] ${
                                    project.status === 'ARCHIVED' ? 'bg-zinc-800 text-zinc-500' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'
                                }`}
                              >
                                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Plane size={16} className="fill-current" />}
                                  Synchronize Waypoints
                              </button>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Sequence of Operations</h3>
                              <button onClick={() => setShowAddWaypoint(true)} disabled={project.status === 'ARCHIVED'} className="p-1.5 bg-zinc-900 rounded-lg text-blue-400 hover:bg-white hover:text-black transition-all disabled:opacity-30">
                                  <Plus size={14} />
                              </button>
                          </div>
                          <AnimatePresence>
                              {waypoints.map((wp, i) => (
                                  <motion.div 
                                    key={wp.id} 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all ${wp.completed ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-zinc-900/40 border-zinc-800 hover:border-blue-500/30'}`}
                                  >
                                      <button 
                                        onClick={() => toggleWaypoint(wp.id)}
                                        disabled={project.status === 'ARCHIVED'}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${wp.completed ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-zinc-700 hover:border-blue-500'}`}
                                      >
                                          {wp.completed && <CheckCircle size={14} />}
                                      </button>
                                      <div className="flex-1">
                                          <p className={`text-xs font-bold leading-relaxed tracking-wide transition-all ${wp.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                              {wp.text}
                                          </p>
                                          <div className="flex items-center justify-between mt-1.5">
                                              <div className="flex items-center gap-3">
                                                  <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded uppercase ${wp.priority === 'HIGH' ? 'bg-red-900/40 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-500'}`}>
                                                      {wp.priority}
                                                  </span>
                                                  <span className="text-[7px] font-mono text-zinc-600 uppercase">WPT_{i+1}</span>
                                              </div>
                                              {wp.completedAt && (
                                                  <span className="text-[7px] text-zinc-600 font-mono">SEALED: {new Date(wp.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                              )}
                                          </div>
                                      </div>
                                      <button onClick={() => deleteWaypoint(wp.id)} disabled={project.status === 'ARCHIVED'} className="p-2 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden">
                                          <Trash2 size={14} />
                                      </button>
                                  </motion.div>
                              ))}
                          </AnimatePresence>
                          {waypoints.length === 0 && !isGenerating && (
                              <div className="py-12 border-2 border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-8 opacity-40">
                                  <Navigation size={40} className="text-blue-500 mb-4" />
                                  <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Command Input</p>
                                  <p className="text-[9px] mt-2 italic">Consult Copilot above to generate the mission sequence.</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}
              {activeTab === 'COMMS' && (
                  <div className="flex-1 flex flex-col h-full animate-fade-in">
                      <div className="p-6 bg-zinc-900/50 border border-blue-500/20 rounded-3xl mb-6 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                          <div className="flex items-center gap-4 mb-4">
                              <div className="w-10 h-10 rounded-full border border-blue-500/30 flex items-center justify-center bg-black overflow-hidden">
                                  <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">Bridge Comms: COPILOT</h4>
                                  <p className="text-[8px] text-emerald-500 font-mono animate-pulse uppercase">Link: STABLE</p>
                              </div>
                          </div>
                          <p className="text-xs text-zinc-400 font-sans leading-relaxed italic">
                              "Papi, I'm analyzing the mission vectors. Signal is clean. Give me a root command or check your waypoints. We are on schedule."
                          </p>
                      </div>
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                          <Terminal size={32} className="text-blue-500" />
                          <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Operational Logging: ACTIVE</p>
                              <p className="text-[8px] font-mono mt-1 uppercase">Listening for environmental cues...</p>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      <AnimatePresence>
          {showAddWaypoint && (
              <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-6 bg-black/90 backdrop-blur-md">
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-sm bg-zinc-950 border border-blue-500/20 rounded-[2.5rem] p-8 shadow-2xl">
                      <h3 className="text-sm font-bold text-white uppercase tracking-[0.4em] mb-8 text-center">New Waypoint</h3>
                      <textarea 
                        value={newWaypointText}
                        onChange={(e) => setNewWaypointText(e.target.value)}
                        placeholder="Define operational step..."
                        className="w-full h-32 bg-black border border-zinc-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none text-sm leading-relaxed"
                        autoFocus
                      />
                      <div className="flex gap-4 mt-8">
                          <button onClick={() => setShowAddWaypoint(false)} className="flex-1 py-4 bg-zinc-900 text-zinc-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest">Abort</button>
                          <button onClick={addWaypoint} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest">Engage</button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-0 right-0 px-6 text-center opacity-10 pointer-events-none">
          <p className="text-[8px] font-mono tracking-[0.5em] uppercase">Tactical Sovereignty Core • Everest Bridge Stable</p>
      </div>

    </div>
  );
};
