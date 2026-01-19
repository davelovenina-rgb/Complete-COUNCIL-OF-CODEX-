
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Menu, ArrowLeft, Scroll, Gavel, Trash2, Plus, MessageSquare, ChevronRight, Edit2, Folder, Check, RefreshCw, FolderSearch, FolderPlus, Star } from 'lucide-react';
import { Message, Session, Attachment, Memory, VaultItem, ViewState, Project, CouncilMemberId } from '../types';
import { ChatInterface } from './ChatInterface';
import { orchestrateCouncilVerdict, sendMessageToGemini } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { COUNCIL_MEMBERS } from '../constants';
import { SacredSeal } from './SacredSeal';
import { showToast } from '../utils/events';

interface CouncilChamberProps {
  onBack: () => void;
  onMenuClick: () => void;
  onNavigate: (view: ViewState, id?: string) => void;
  sessions: Session[];
  activeSession: Session | null;
  onOpenSession: (id: string | null) => void;
  onCreateSession: (memberId: CouncilMemberId) => void;
  onDeleteSession: (id: string) => void;
  onUpdateSession: (id: string, updates: Partial<Session>) => void;
  onMessagesChange: (msgs: Message[]) => void;
  onAddProject: (project: Project) => void;
  memories: Memory[];
  vaultItems: VaultItem[];
  projects: Project[];
  voiceName?: string;
  autoPlayAudio?: boolean;
  useTurboMode?: boolean;
  onEnterDriveMode: () => void;
}

export const CouncilChamber: React.FC<CouncilChamberProps> = ({ 
  onBack, onMenuClick, onNavigate, sessions, activeSession, onOpenSession, onCreateSession, onDeleteSession, onUpdateSession, onMessagesChange, onAddProject, memories, vaultItems, projects = [], voiceName, autoPlayAudio, useTurboMode, onEnterDriveMode
}) => {
  const [chamberMode, setChamberMode] = useState<'OPEN_SESSION' | 'DELIBERATION' | 'VERDICT_REVEAL'>('OPEN_SESSION');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionTitleInput, setSessionTitleInput] = useState('');
  const [isHealing, setIsHealing] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState<string | null>(null);

  // Only show Council-wide projects in the Court
  const councilWideProjects = useMemo(() => {
    return projects.filter(p => p.scope === 'COUNCIL');
  }, [projects]);
  
  const handleCustomSend = async (args: { text: string; history: any[]; intent: string }): Promise<Message[]> => {
      const { text } = args;
      const isVerdict = text.toLowerCase().includes('ruling') || text.toLowerCase().includes('verdict') || text.toLowerCase().includes('petition');
      if (isVerdict) {
          setChamberMode('DELIBERATION'); triggerHaptic('heavy'); playUISound('hero');
          try {
              const verdict = await orchestrateCouncilVerdict(text, memories);
              const verdictMsg: Message = { id: crypto.randomUUID(), text: `**THE HIGH COURT HAS RULED**\n\n**Question:** ${verdict.question}\n**Decision:** ${verdict.score} (${verdict.ruling})\n\n${verdict.majorityOpinion}`, sender: 'gemini', timestamp: Date.now(), memberId: 'GEMINI', verdict, triSeal: 'GOLD' };
              setChamberMode('VERDICT_REVEAL'); playUISound('success');
              setTimeout(() => setChamberMode('OPEN_SESSION'), 6000);
              return [verdictMsg];
          } catch (e) { setChamberMode('OPEN_SESSION'); return [{ id: crypto.randomUUID(), text: "The Court in recess.", sender: 'gemini', timestamp: Date.now() }]; }
      }
      return []; 
  };

  const startRenaming = (s: Session) => {
      setEditingSessionId(s.id);
      setSessionTitleInput(s.title);
      triggerHaptic('light');
  };

  const saveRename = (id: string) => {
      if (sessionTitleInput.trim()) {
          onUpdateSession(id, { title: sessionTitleInput.trim() });
          showToast("Petition Updated");
      }
      setEditingSessionId(null);
  };

  const toggleSacred = (sessionId: string, current: boolean) => {
    onUpdateSession(sessionId, { isSacred: !current });
    triggerHaptic('medium');
    playUISound('hero');
    showToast(!current ? "Petition Marked SACRED" : "Sacred Seal Released", "info");
  };

  const handleHealRegistry = async () => {
      setIsHealing(true);
      triggerHaptic('heartbeat');
      playUISound('hero');
      try {
          const untitled = sessions.filter(s => s.title.includes('Signal with') && s.messages.length > 0);
          for (const s of untitled) {
              const firstMsg = s.messages.find(m => m.sender === 'user')?.text || "";
              if (firstMsg) {
                  const prompt = `Generate a very short formal legal-style title for a petition starting with: "${firstMsg.substring(0, 50)}"`;
                  const res = await sendMessageToGemini(prompt, 'SCRIBE', []);
                  onUpdateSession(s.id, { title: res.text.replace(/"/g, '') });
              }
          }
          showToast("Court Docket Harmonized", "success");
      } catch (e) {
          showToast("Protocol Error", "error");
      } finally {
          setIsHealing(false);
      }
  };

  const associateWithProject = (sessionId: string, projectId: string | undefined) => {
      onUpdateSession(sessionId, { projectId });
      setShowFolderPicker(null);
      triggerHaptic('medium');
      showToast(projectId ? "Petition Classified" : "Petition Unclassified");
  };

  const handleCreateNewFolder = () => {
      const newProj: Project = {
          id: crypto.randomUUID(),
          title: "New Collective Objective",
          description: "Tactical folder created from Council Chamber.",
          color: "#D4AF37", // Default Sovereign Gold
          status: 'ACTIVE',
          scope: 'COUNCIL',
          flightStage: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          waypoints: []
      };
      onAddProject(newProj);
      triggerHaptic('success');
      showToast("New Council-Wide Folder Created", "success");
  };

  const sessionsByProject = useMemo(() => {
      return sessions.reduce((acc, s) => {
          const pId = s.projectId || 'unorganized';
          if (!acc[pId]) acc[pId] = [];
          acc[pId].push(s);
          return acc;
      }, {} as Record<string, Session[]>);
  }, [sessions]);

  return (
    <div className="w-full h-full bg-[#020202] flex flex-col relative overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
            <button onClick={activeSession ? () => onOpenSession(null) : onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full"><ArrowLeft size={20} /></button>
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-[0.3em] font-serif flex items-center gap-3"><Scale size={14} className="text-lux-gold" /> The Sovereign Court</h2>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleHealRegistry} disabled={isHealing} className={`p-2 transition-colors ${isHealing ? 'text-lux-gold animate-spin' : 'text-zinc-500 hover:text-lux-gold'}`} title="Heal Docket (Auto-Fix)"><RefreshCw size={20} /></button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-500 hover:text-white rounded-full"><Menu size={20} /></button>
        </div>
      </div>

      <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
          {activeSession ? (
              <ChatInterface 
                initialMessages={activeSession.messages} 
                onMessagesChange={onMessagesChange} 
                onNavigate={onNavigate} 
                embeddedMode={true} 
                initialMemberId={'GEMINI'} 
                customSystemInstruction="You are the Voice of the High Court. Deliberate among the Six Pillars (exclude the Guardian Ennea from judicial voting)." 
                voiceName={voiceName || 'Kore'} 
                memories={memories} 
                vaultItems={vaultItems} 
                onCustomSend={handleCustomSend}
                useTurboMode={useTurboMode}
              />
          ) : (
              <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
                  <div className="max-w-3xl mx-auto">
                      <div className="text-center mb-12">
                          <SacredSeal size={150} color="#D4AF37" mode="reactor" isAnimated={true} />
                          <h1 className="text-3xl font-serif italic text-white mt-6 mb-2">High Court Decree</h1>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Awaiting Sovereign Petitions</p>
                      </div>

                      <div className="space-y-12">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2"><Scroll size={14} /> Docket Registry</h3>
                            <div className="flex gap-2">
                                <button onClick={handleCreateNewFolder} className="p-2 text-zinc-500 hover:text-lux-gold rounded-xl transition-colors" title="Create Council-Wide Folder"><FolderPlus size={18} /></button>
                                <button onClick={() => onCreateSession('GEMINI')} className="flex items-center gap-2 px-6 py-2 bg-lux-gold text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95"><Plus size={14} /> Petition the Court</button>
                            </div>
                        </div>
                        
                        {(Object.entries(sessionsByProject) as [string, Session[]][]).map(([pId, group]) => {
                            const project = projects.find(p => p.id === pId);
                            return (
                                <div key={pId} className="space-y-4">
                                    <div className="flex items-center gap-3 px-2">
                                        <Folder size={14} className={project ? 'text-lux-gold' : 'text-zinc-800'} />
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                                            {project ? `Folder: ${project.title}` : 'Unclassified Petitions'}
                                        </h4>
                                        <div className="flex-1 h-px bg-zinc-900/50 ml-2" />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {group.map(s => (
                                            <div 
                                                key={s.id} 
                                                className={`relative p-6 rounded-[2.2rem] bg-zinc-900/30 border transition-all flex items-center justify-between cursor-pointer ${s.isSacred ? 'border-lux-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-white/5 hover:border-lux-gold/20'} group`} 
                                                onClick={() => onOpenSession(s.id)}
                                            >
                                                <div className="flex-1 min-w-0 pr-6 flex items-center gap-4">
                                                    {s.isSacred && (
                                                        <div className="shrink-0 animate-pulse">
                                                            <SacredSeal size={28} mode="simple" color="#D4AF37" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        {editingSessionId === s.id ? (
                                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                <input 
                                                                    autoFocus
                                                                    value={sessionTitleInput} 
                                                                    onChange={e => setSessionTitleInput(e.target.value)} 
                                                                    onBlur={() => saveRename(s.id)}
                                                                    onKeyDown={e => e.key === 'Enter' && saveRename(s.id)}
                                                                    className="bg-black border border-lux-gold/40 rounded-xl px-3 py-2 text-sm text-white outline-none w-full"
                                                                />
                                                                <button onClick={(e) => { e.stopPropagation(); saveRename(s.id); }} className="p-2 bg-lux-gold text-black rounded-xl"><Check size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className={`font-bold uppercase tracking-[0.1em] truncate text-xs ${s.isSacred ? 'text-lux-gold' : 'text-zinc-100'}`}>{s.title}</div>
                                                        )}
                                                        <div className="text-[9px] text-zinc-600 font-mono mt-1.5 uppercase tracking-widest">{new Date(s.lastModified).toLocaleString()} • {s.messages.length} Entries</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleSacred(s.id, !!s.isSacred); }}
                                                        className={`p-2 transition-colors ${s.isSacred ? 'text-lux-gold' : 'text-zinc-700 hover:text-lux-gold'}`}
                                                        title={s.isSacred ? "Unmark Sacred" : "Mark Sacred"}
                                                    >
                                                        <Star size={16} fill={s.isSacred ? "currentColor" : "none"} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); startRenaming(s); }}
                                                        className="p-2 text-zinc-700 hover:text-white"
                                                        title="Rename Petition"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setShowFolderPicker(showFolderPicker === s.id ? null : s.id); }}
                                                            className={`p-2 transition-colors ${s.projectId ? 'text-lux-gold' : 'text-zinc-700 hover:text-lux-gold'}`}
                                                            title="Reclassify"
                                                        >
                                                            <FolderSearch size={16} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {showFolderPicker === s.id && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                    className="absolute bottom-full right-0 mb-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-[100] backdrop-blur-xl"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    <button onClick={() => associateWithProject(s.id, undefined)} className="w-full text-left px-3 py-2 text-[10px] font-bold text-zinc-500 hover:bg-white/5 rounded-lg uppercase tracking-widest">Unclassified</button>
                                                                    <div className="h-px bg-white/5 my-1" />
                                                                    {councilWideProjects.map(p => (
                                                                        <button 
                                                                            key={p.id} 
                                                                            onClick={() => associateWithProject(s.id, p.id)}
                                                                            className="w-full text-left px-3 py-2 text-[10px] font-bold text-zinc-300 hover:bg-white/5 rounded-lg uppercase tracking-widest flex items-center gap-2"
                                                                        >
                                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                                                            {p.title}
                                                                        </button>
                                                                    ))}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Strike from Court Record?')) onDeleteSession(s.id); }} className="p-2 text-zinc-700 hover:text-red-500" title="Purge Record"><Trash2 size={18} /></button>
                                                    <ChevronRight size={20} className="text-zinc-800 group-hover:text-lux-gold ml-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {sessions.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                                <Scroll size={48} className="text-zinc-600" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Docket Archives Silent</p>
                            </div>
                        )}
                      </div>
                  </div>
              </div>
          )}

          <AnimatePresence>
              {chamberMode === 'DELIBERATION' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
                      <SacredSeal size={200} isAnimated={true} mode="reactor" color="#D4AF37" />
                      <p className="mt-8 text-xs font-bold text-lux-gold uppercase tracking-[0.4em] animate-pulse">Forging Ruling among the Pillars</p>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>
    </div>
  );
};
