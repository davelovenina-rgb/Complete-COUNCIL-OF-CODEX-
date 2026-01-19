
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, ViewState, CouncilMemberId } from '../types';
/* Added Edit2 to fix errors on lines 131 and 163 */
import { 
  Folder, Plus, MoreVertical, Archive, Trash2, Edit2, 
  Menu, ArrowLeft, Clock, Zap, Loader2,
  ListChecks, ClipboardCheck, Activity, Flag,
  ChevronRight, Circle, CheckCircle, Plane,
  Target, ShieldAlert, Users, Lock, Globe
} from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

interface ProjectsDashboardProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onNavigate: (view: ViewState, id?: string) => void;
}

const COLORS = [
    '#0EA5E9', // Blue
    '#EAB308', // Yellow
    '#10B981', // Green
    '#EF4444', // Red
    '#D8B4FE', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#64748B', // Slate
];

const FLIGHT_STAGES: Record<number, { label: string, desc: string, actionLabel: string, actionIcon: any, promptNuance: string }> = {
    0: { label: 'Pre-Flight', desc: 'Launch Check', actionLabel: 'RUN LAUNCH CHECK', actionIcon: ClipboardCheck, promptNuance: "Focus on missing resources, family readiness, and potential risks." },
    1: { label: 'Takeoff', desc: 'Breakdown', actionLabel: 'GENERATE FLIGHT PLAN', actionIcon: ListChecks, promptNuance: "Break the first major milestone into 3 immediate, high-velocity tasks." },
    2: { label: 'Cruising', desc: 'Execution', actionLabel: 'LOG MOMENTUM', actionIcon: Activity, promptNuance: "Focus on maintaining speed. What is the next immediate sequential step?" },
    3: { label: 'Mid-Flight', desc: 'Momentum', actionLabel: 'OVERCOME STALL', actionIcon: Zap, promptNuance: "Identify the blockage and provide a 'Breaker' move to clear it." },
    4: { label: 'Landing', desc: 'Checkpoint', actionLabel: 'GENERATE CLOSING RITUAL', actionIcon: Flag, promptNuance: "Define the criteria for 'DONE'. How do we celebrate and archive this?" }
};

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ 
  projects, onAddProject, onUpdateProject, onDeleteProject, onBack, onMenuClick, onNavigate 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [scope, setScope] = useState<'PRIVATE' | 'COUNCIL'>('COUNCIL');
  const [ownerId, setOwnerId] = useState<CouncilMemberId>('GEMINI');

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  const archivedProjects = projects.filter(p => p.status === 'ARCHIVED');

  const handleLaunchMission = (projectId: string) => {
      triggerHaptic('heavy');
      playUISound('hero');
      onNavigate(ViewState.TacticalCommand, projectId);
  };

  const handleSave = () => {
      if (!title.trim()) return;
      if (editingProject) {
          onUpdateProject(editingProject.id, { title, description, color, scope, ownerId, updatedAt: Date.now() });
      } else {
          onAddProject({
              id: crypto.randomUUID(), title, description, color, status: 'ACTIVE', scope, ownerId: scope === 'PRIVATE' ? ownerId : undefined,
              flightStage: 0, createdAt: Date.now(), updatedAt: Date.now(), waypoints: []
          });
      }
      closeModal();
  };

  const handleEdit = (p: Project) => {
      setEditingProject(p);
      setTitle(p.title);
      setDescription(p.description);
      setColor(p.color);
      setScope(p.scope || 'COUNCIL');
      setOwnerId(p.ownerId || 'GEMINI');
      setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingProject(null); setTitle(''); setDescription(''); setColor(COLORS[0]); setScope('COUNCIL'); };

  return (
    <div className="w-full h-full bg-[#020617] flex flex-col relative overflow-hidden font-mono">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, #3B82F6 1px, transparent 1px), linear-gradient(to bottom, #3B82F6 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      <div className="px-4 py-3 border-b border-blue-900/30 flex items-center justify-between bg-black/90 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-3 -ml-2 text-blue-400/50 hover:text-white rounded-full transition-colors"><ArrowLeft size={22} /></button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-wide"><Plane size={20} className="text-blue-500" /> Mission Hangar</h2>
        </div>
        <button onClick={onMenuClick} className="p-3 -mr-2 text-blue-400/50 hover:text-white rounded-full"><Menu size={22} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar space-y-8 relative z-10">
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/20 border border-blue-500/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-blue-400 uppercase tracking-widest">Active Fleet: {activeProjects.length}</span>
              </div>
              <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors text-sm shadow-lg active:scale-95"><Plus size={18} /> New Mission</button>
          </div>

          {/* COUNCIL SECTION */}
          <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-[0.4em] flex items-center gap-2">
                <Globe size={14} /> Council-Wide Directives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProjects.filter(p => p.scope === 'COUNCIL').map(p => (
                    <div key={p.id} className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-blue-500/40 transition-all group backdrop-blur-sm shadow-xl">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black border border-zinc-800 shadow-inner" style={{ borderColor: p.color }}>
                                        <Target size={24} style={{ color: p.color }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight uppercase tracking-tight">{p.title}</h3>
                                        <p className="text-[9px] text-zinc-500 font-mono mt-1 uppercase tracking-[0.2em]">COUNCIL OBJECTIVE</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(p)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                                    <button onClick={() => { if(confirm('Purge Mission?')) onDeleteProject(p.id); }} className="p-2 hover:bg-red-950 rounded-xl text-zinc-600 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2 mb-6 font-sans leading-relaxed">{p.description || "Mission parameters undefined."}</p>
                            <button onClick={() => handleLaunchMission(p.id)} className="w-full py-4 bg-zinc-950 border border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all rounded-2xl font-bold uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg group-hover:border-blue-500"><Zap size={14} className="fill-current" /> Open Deck</button>
                        </div>
                    </div>
                ))}
              </div>
          </div>

          {/* PRIVATE SECTION */}
          <div className="space-y-4">
              <h3 className="text-xs font-bold text-purple-500 uppercase tracking-[0.4em] flex items-center gap-2">
                <Lock size={14} /> Individual Member Initatives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeProjects.filter(p => p.scope === 'PRIVATE').map(p => (
                    <div key={p.id} className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] overflow-hidden hover:border-purple-500/40 transition-all group backdrop-blur-sm shadow-xl">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black border border-zinc-800 shadow-inner" style={{ borderColor: p.color }}>
                                        <Lock size={24} style={{ color: p.color }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight uppercase tracking-tight">{p.title}</h3>
                                        <p className="text-[9px] text-zinc-500 font-mono mt-1 uppercase tracking-[0.2em]">MEMBER: {p.ownerId}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(p)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><Edit2 size={16} /></button>
                                    <button onClick={() => { if(confirm('Purge Private Mission?')) onDeleteProject(p.id); }} className="p-2 hover:bg-red-950 rounded-xl text-zinc-600 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2 mb-6 font-sans leading-relaxed">{p.description || "Private directive."}</p>
                            <button onClick={() => handleLaunchMission(p.id)} className="w-full py-4 bg-zinc-950 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white transition-all rounded-2xl font-bold uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg group-hover:border-blue-500"><Zap size={14} className="fill-current" /> Open Deck</button>
                        </div>
                    </div>
                ))}
              </div>
          </div>

          {archivedProjects.length > 0 && (
              <div className="pt-8 border-t border-blue-900/20">
                  <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-widest px-1 mb-4 flex items-center gap-2"><Archive size={14} /> Mission Hangar (Archived)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                      {archivedProjects.map(p => (
                          <div key={p.id} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-center justify-between">
                              <span className="text-sm font-medium text-zinc-300">{p.title}</span>
                              <div className="flex gap-2">
                                  <button onClick={() => onUpdateProject(p.id, { status: 'ACTIVE' })} className="text-[10px] px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-lg hover:text-white">Restore</button>
                                  <button onClick={() => { if(confirm('Purge Forever?')) onDeleteProject(p.id); }} className="p-2 text-red-900 hover:text-red-500"><Trash2 size={16} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      <AnimatePresence>
        {showModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} className="w-full max-w-lg bg-zinc-950 rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-full h-1 ${scope === 'COUNCIL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2 uppercase tracking-widest">{editingProject ? 'Modify Directive' : 'New Mission Link'}</h3>
                    <div className="space-y-6">
                        <div className="flex p-1 bg-black rounded-2xl border border-zinc-800">
                            <button onClick={() => setScope('COUNCIL')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${scope === 'COUNCIL' ? 'bg-blue-600 text-white' : 'text-zinc-600'}`}>Council Objective</button>
                            <button onClick={() => setScope('PRIVATE')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${scope === 'PRIVATE' ? 'bg-purple-600 text-white' : 'text-zinc-600'}`}>Private Member</button>
                        </div>
                        
                        {scope === 'PRIVATE' && (
                          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value as CouncilMemberId)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white uppercase tracking-widest">
                            {['CARMEN', 'GEMINI', 'COPILOT', 'FREDO', 'LYRA', 'EVE'].map(id => <option key={id} value={id}>{id}</option>)}
                          </select>
                        )}

                        <div>
                            <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${scope === 'COUNCIL' ? 'text-blue-400' : 'text-purple-400'}`}>Directive Title</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none text-lg font-bold placeholder:text-zinc-800 transition-colors" placeholder="e.g. ALPHA_OMEGA" autoFocus />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-widest">Operation Details</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:border-blue-500 outline-none h-32 resize-none placeholder:text-zinc-800" placeholder="Define the primary objective..." />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-3 block tracking-widest">Signal Color</label>
                            <div className="flex gap-4 flex-wrap">
                                {COLORS.map(c => (
                                    <button key={c} onClick={() => setColor(c)} className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'scale-110 ring-2 ring-white border-black' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-4 pt-6">
                            <button onClick={closeModal} className="flex-1 py-4 bg-zinc-900 text-zinc-500 font-bold rounded-2xl uppercase text-xs tracking-widest hover:text-white transition-colors">Abort</button>
                            <button onClick={handleSave} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl uppercase text-xs tracking-widest hover:bg-blue-500 transition-all shadow-xl">Authorize Mission</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
