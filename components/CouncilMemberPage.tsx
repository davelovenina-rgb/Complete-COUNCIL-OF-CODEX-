
import React, { useState, useRef, useMemo } from 'react';
import { CouncilMember, Message, Session, CouncilMemberId, GlucoseReading, Memory, Project, VaultItem, ViewState } from '../types';
import { ChatInterface } from './ChatInterface';
import { ArrowLeft, Menu, Plus, MessageSquare, Trash2, X, ChevronRight, Mic, Shield, FileCode, Zap, Loader2, Archive, Edit2, Folder, FolderPlus, Check, RefreshCw, FolderSearch, Lock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scribeExtractRaw, sendMessageToGemini } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';

interface CouncilMemberPageProps {
  member: CouncilMember;
  members: CouncilMember[];
  onUpdateMember: (id: CouncilMemberId, updates: Partial<CouncilMember>) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onNavigate: (view: ViewState, id?: string) => void;
  sessions: Session[];
  activeSession: Session | null;
  onOpenSession: (sessionId: string | null) => void;
  onCreateSession: (memberId: CouncilMemberId) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, updates: Partial<Session>) => void;
  onMessagesChange: (messages: Message[]) => void;
  onAddVaultItem: (item: VaultItem) => void;
  onAddProject: (project: Project) => void;
  healthReadings?: GlucoseReading[];
  memories?: Memory[];
  projects?: Project[];
  vaultItems?: VaultItem[];
  useTurboMode?: boolean;
  onEnterDriveMode?: () => void;
}

export const CouncilMemberPage: React.FC<CouncilMemberPageProps> = ({ 
  member, members, onUpdateMember, onBack, onMenuClick, onNavigate, sessions, activeSession, onOpenSession, onCreateSession, onDeleteSession, onUpdateSession, onMessagesChange, onAddVaultItem, onAddProject, healthReadings, memories, projects = [], vaultItems, useTurboMode, onEnterDriveMode
}) => {
  const [activeTab, setActiveTab] = useState<'THREADS' | 'FORGE' | 'PRIVATE_RECORDS'>('THREADS');
  const [isScribing, setIsScribing] = useState(false);
  const [isHealing, setIsHealing] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionTitleInput, setSessionTitleInput] = useState('');
  const [showFolderPicker, setShowFolderPicker] = useState<string | null>(null);
  
  const scribeInputRef = useRef<HTMLInputElement>(null);
  
  const isChatActive = !!activeSession;

  const memberRelevantProjects = useMemo(() => {
    return projects.filter(p => p.scope === 'COUNCIL' || (p.scope === 'PRIVATE' && p.ownerId === member.id));
  }, [projects, member.id]);

  const handleScribeDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsScribing(true);
      triggerHaptic('heavy');
      playUISound('hero');
      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const base64 = (reader.result as string).split(',')[1];
              const extracted = await scribeExtractRaw({ data: base64, mimeType: file.type }, 'FRAMEWORK');
              onUpdateMember(member.id, { systemPrompt: extracted });
              showToast(`${member.name} Framework Re-Seeded`, "success");
              setIsScribing(false);
          };
      } catch (err) {
          showToast("Scribe Failed", "error");
          setIsScribing(false);
      }
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
                  const prompt = `Generate a short (3-4 word) sovereign title for a thread starting with: "${firstMsg.substring(0, 50)}"`;
                  const res = await sendMessageToGemini(prompt, 'SCRIBE', []);
                  onUpdateSession(s.id, { title: res.text.replace(/"/g, '') });
              }
          }
          showToast("Registry Harmonized", "success");
      } catch (e) {
          showToast("Healing Interrupted", "error");
      } finally {
          setIsHealing(false);
      }
  };

  const startRenaming = (s: Session) => {
      setEditingSessionId(s.id);
      setSessionTitleInput(s.title);
      triggerHaptic('light');
  };

  const saveRename = (id: string) => {
      if (sessionTitleInput.trim()) {
          onUpdateSession(id, { title: sessionTitleInput.trim() });
          showToast("Thread Renamed");
      }
      setEditingSessionId(null);
  };

  const toggleSacred = (sessionId: string, current: boolean) => {
      onUpdateSession(sessionId, { isSacred: !current });
      triggerHaptic('medium');
      playUISound('hero');
      showToast(!current ? "Signal Sealed as SACRED" : "Sacred Seal Released", "info");
  };

  const associateWithProject = (sessionId: string, projectId: string | undefined) => {
      onUpdateSession(sessionId, { projectId });
      setShowFolderPicker(null);
      triggerHaptic('medium');
      showToast(projectId ? "Thread Classified" : "Thread De-classified");
  };

  const handleCreateNewFolder = () => {
      const newProj: Project = {
          id: crypto.randomUUID(),
          title: "Member Objective",
          description: `Private mission folder for ${member.name}.`,
          color: member.color,
          status: 'ACTIVE',
          scope: 'PRIVATE',
          ownerId: member.id,
          flightStage: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          waypoints: []
      };
      onAddProject(newProj);
      triggerHaptic('success');
      showToast("Private Member Folder Created", "success");
  };

  const sessionsByProject = useMemo(() => {
      return sessions.reduce((acc, s) => {
          const pId = s.projectId || 'unorganized';
          if (!acc[pId]) acc[pId] = [];
          acc[pId].push(s);
          return acc;
      }, {} as Record<string, Session[]>);
  }, [sessions]);

  const privateRecords = vaultItems?.filter(v => v.ownerId === member.id && v.isPrivate) || [];

  return (
    <div className="w-full h-full flex flex-col bg-black relative overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/80 backdrop-blur border-b border-white/5 z-50 shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={isChatActive ? () => onOpenSession(null) : onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full"><ArrowLeft size={20} /></button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                        {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-xs" style={{ color: member.color }}>{member.sigil}</div>}
                    </div>
                    <div className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                        {member.name}
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={handleHealRegistry} disabled={isHealing} className={`p-2 transition-colors ${isHealing ? 'text-lux-gold animate-spin' : 'text-zinc-500 hover:text-lux-gold'}`} title="Heal Registry (Auto-Fix)"><RefreshCw size={20} /></button>
                <button onClick={onEnterDriveMode} className="p-2 text-zinc-400 hover:text-white rounded-full" title="Voice Bridge"><Mic size={22} /></button>
                <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full"><Menu size={24} /></button>
            </div>
        </div>

        <input ref={scribeInputRef} type="file" className="hidden" onChange={handleScribeDocument} />

        <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
            {isChatActive ? (
                <ChatInterface 
                    key={activeSession.id} 
                    initialMessages={activeSession.messages} 
                    onMessagesChange={onMessagesChange} 
                    onNavigate={onNavigate} 
                    embeddedMode={true} 
                    initialMemberId={member.id} 
                    voiceName={member.voiceName} 
                    memories={memories} 
                    vaultItems={vaultItems} 
                    healthReadings={healthReadings} 
                    projects={projects}
                    useTurboMode={useTurboMode}
                    customSystemInstruction={member.systemPrompt}
                />
            ) : (
                <>
                <div className="flex border-b border-white/5 bg-zinc-900/30 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('THREADS')} className={`flex-1 py-3 px-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${activeTab === 'THREADS' ? 'text-white border-b-2 border-white' : 'text-zinc-600'}`}>Signals</button>
                    <button onClick={() => setActiveTab('FORGE')} className={`flex-1 py-3 px-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${activeTab === 'FORGE' ? 'text-lux-gold border-b-2 border-lux-gold' : 'text-zinc-600'}`}>Logic Forge</button>
                    <button onClick={() => setActiveTab('PRIVATE_RECORDS')} className={`flex-1 py-3 px-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${activeTab === 'PRIVATE_RECORDS' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-600'}`}>Private Partition</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        {activeTab === 'THREADS' && (
                            <div className="space-y-12">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={16} /> Signal Archive</h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleCreateNewFolder} className="p-2 text-zinc-500 hover:text-blue-400 rounded-xl transition-colors" title="Create Private Member Folder"><FolderPlus size={18} /></button>
                                        <button onClick={() => onCreateSession(member.id)} className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-lux-gold transition-all shadow-lg active:scale-95"><Plus size={14} /> New Signal</button>
                                    </div>
                                </div>
                                
                                {(Object.entries(sessionsByProject) as [string, Session[]][]).map(([pId, group]) => {
                                    const project = projects.find(p => p.id === pId);
                                    return (
                                        <div key={pId} className="space-y-4">
                                            <div className="flex items-center gap-3 px-2">
                                                <Folder size={14} className={project ? 'text-blue-400' : 'text-zinc-700'} />
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                                                    {project ? `${project.title} (${project.scope})` : 'Unorganized / General'}
                                                </h4>
                                                <div className="flex-1 h-px bg-zinc-900/50 ml-2" />
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-3">
                                                {group.map(s => (
                                                    <div 
                                                        key={s.id} 
                                                        className={`relative p-5 rounded-[2.2rem] bg-zinc-900/40 border transition-all flex items-center justify-between cursor-pointer ${s.isSacred ? 'border-lux-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-white/5 hover:border-white/20'} group`} 
                                                        onClick={() => onOpenSession(s.id)}
                                                    >
                                                        <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                                                            {s.isSacred && (
                                                                <div className="shrink-0 animate-pulse">
                                                                    <SacredSeal size={24} mode="simple" color="#D4AF37" />
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
                                                                            className="bg-black border border-lux-gold/30 rounded-xl px-3 py-1.5 text-sm text-white outline-none w-full"
                                                                        />
                                                                        <button onClick={(e) => { e.stopPropagation(); saveRename(s.id); }} className="p-2 bg-emerald-600 text-white rounded-xl"><Check size={14} /></button>
                                                                    </div>
                                                                ) : (
                                                                    <div className={`font-bold truncate transition-colors tracking-wide uppercase text-xs ${s.isSacred ? 'text-lux-gold' : 'text-zinc-100 group-hover:text-white'}`}>{s.title}</div>
                                                                )}
                                                                <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1.5 font-mono">{new Date(s.lastModified).toLocaleString()} • {s.messages.length} Signals</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); toggleSacred(s.id, !!s.isSacred); }}
                                                                className={`p-2 transition-colors ${s.isSacred ? 'text-lux-gold' : 'text-zinc-700 hover:text-lux-gold'}`}
                                                                title={s.isSacred ? "Unmark Sacred" : "Mark as Sacred"}
                                                            >
                                                                <Star size={14} fill={s.isSacred ? "currentColor" : "none"} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); startRenaming(s); }}
                                                                className="p-2 text-zinc-600 hover:text-white"
                                                                title="Rename"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <div className="relative">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setShowFolderPicker(showFolderPicker === s.id ? null : s.id); }}
                                                                    className={`p-2 transition-colors ${s.projectId ? 'text-blue-400' : 'text-zinc-600 hover:text-blue-400'}`}
                                                                    title="Classify to Project"
                                                                >
                                                                    <FolderSearch size={14} />
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
                                                                            <button onClick={() => associateWithProject(s.id, undefined)} className="w-full text-left px-3 py-2 text-[10px] font-bold text-zinc-500 hover:bg-white/5 rounded-lg uppercase tracking-widest">Unorganized</button>
                                                                            <div className="h-px bg-white/5 my-1" />
                                                                            {memberRelevantProjects.map(p => (
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
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); if (confirm('Purge Signal from Record?')) onDeleteSession(s.id); }}
                                                                className="p-2 text-zinc-600 hover:text-red-500"
                                                                title="Purge"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                            <ChevronRight size={18} className="text-zinc-800 ml-1" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {sessions.length === 0 && (
                                    <div className="py-32 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                                        <MessageSquare size={48} className="text-zinc-600" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Signal Registry Silent</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'FORGE' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-lux-gold/20 relative overflow-hidden shadow-2xl">
                                     <div className="absolute top-0 right-0 p-8 opacity-5"><FileCode size={120} className="text-lux-gold" /></div>
                                     <div className="relative z-10">
                                         <h3 className="text-xl font-serif italic text-white mb-2">Architectural Framework</h3>
                                         <p className="text-xs text-zinc-500 leading-relaxed mb-8">Direct logic control for the {member.name} frequency.</p>
                                         <textarea 
                                            value={member.systemPrompt}
                                            onChange={(e) => onUpdateMember(member.id, { systemPrompt: e.target.value })}
                                            className="w-full h-80 bg-black border border-zinc-800 rounded-3xl p-6 text-sm font-mono text-zinc-300 focus:border-lux-gold outline-none resize-none shadow-inner mb-8"
                                         />
                                         <button onClick={() => scribeInputRef.current?.click()} className="w-full py-4 bg-white text-black font-bold rounded-2xl uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 shadow-xl">
                                            <Zap size={16} /> Direct Signal Injection
                                         </button>
                                     </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'PRIVATE_RECORDS' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-[2rem] bg-red-950/10 border border-red-900/30 mb-8 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 mb-1"><Shield size={16} /> Private Sector</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Isolated partition for sensitive data strings.</p>
                                    </div>
                                    <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                                        <Lock size={20} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {privateRecords.map(rec => (
                                        <div key={rec.id} className="p-5 bg-zinc-900/50 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-red-500/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-black rounded-2xl border border-red-500/20 text-red-500"><Archive size={18} /></div>
                                                <div>
                                                    <div className="text-xs font-bold text-zinc-200 truncate max-w-[150px] uppercase tracking-wide">{rec.title}</div>
                                                    <div className="text-[8px] text-zinc-600 font-mono mt-1 uppercase">SEALED: {new Date(rec.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <button className="p-2 text-zinc-700 hover:text-white"><ChevronRight size={18} /></button>
                                        </div>
                                    ))}
                                    {privateRecords.length === 0 && <div className="col-span-full py-20 text-center text-zinc-700 italic text-sm">No encrypted blocks detected in this sector.</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}
        </div>

        <AnimatePresence>
            {isScribing && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
                    <div className="relative mb-12">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-32 h-32 border-2 border-lux-gold/20 border-b-lux-gold rounded-full" />
                        <div className="absolute inset-0 flex items-center justify-center"><Zap size={40} className="text-lux-gold animate-pulse" /></div>
                    </div>
                    <h3 className="text-2xl font-serif italic text-white mb-3 uppercase tracking-widest">Scribe Protocol</h3>
                    <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] animate-pulse">De-serializing Framework Strings...</p>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};
