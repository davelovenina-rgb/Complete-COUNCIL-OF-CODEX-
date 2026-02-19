
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Brain, Terminal, Menu, ArrowLeft, Eye, Zap, RefreshCcw, Loader2, BookOpen, Server, Database, Cpu, Wifi, Wrench, HardDrive, CheckCircle, AlertTriangle, FileJson, Download, Upload, List, Plus, Save, Copy, FileCode, Check, X, Shield, Lock, Mic, Camera, Fingerprint, History, Share2, Sparkles, TrendingUp, MessageSquare, BookText, Bookmark } from 'lucide-react';
import { Message, GlucoseReading, Memory, Project, VaultItem, MoodEntry, Session, PerimeterStatus, RepairLogEntry, CouncilCycle, GuardianLogEntry } from '../types';
import { ChatInterface } from './ChatInterface';
import { COUNCIL_MEMBERS } from '../constants';
import { calculateSystemDrift, sendMessageToGemini } from '../services/geminiService';
import { performSystemRepair, RepairLevel, getSystemLogs, SystemLogEntry, getState, saveState } from '../utils/db';
import { analyzeDrift, autoRepair } from '../utils/enneaGuardian';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SacredSeal } from './SacredSeal';
import { showToast } from '../utils/events';
import { TemporalMap } from './TemporalMap';
import { EnneaHeartbeat } from './EnneaHeartbeat';

interface EnneaSanctumProps {
  onBack: () => void;
  onMenuClick: () => void;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  healthReadings: GlucoseReading[];
  memories: Memory[];
  projects: Project[];
  vaultItems: VaultItem[];
  moodHistory?: MoodEntry[];
  sessions: Session[];
  onAddMemory: (m: Memory) => void;
  onEnterDriveMode?: () => void;
}

export const EnneaSanctum: React.FC<EnneaSanctumProps> = ({ 
  onBack, 
  onMenuClick, 
  messages, 
  onMessagesChange,
  healthReadings,
  memories,
  projects,
  vaultItems,
  moodHistory = [],
  sessions = [],
  onAddMemory,
  onEnterDriveMode
}) => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'SYSTEM' | 'REPAIR' | 'LOGS' | 'PERIMETER' | 'GUARDIAN_LOG'>('SYSTEM');
  const [focusLevel, setFocusLevel] = useState(100);
  const [isFogProtocolActive, setIsFogProtocolActive] = useState(false);
  
  // Ennea Guardian State
  const [driftPercentage, setDriftPercentage] = useState(0);
  const [isCalculatingDrift, setIsCalculatingDrift] = useState(false);
  const [repairLog, setRepairLog] = useState<RepairLogEntry[]>([]);
  const [preventionStats, setPreventionStats] = useState({ validations: 0, corrections: 0, blocks: 0 });
  const [ledger, setLedger] = useState<CouncilCycle[]>([]);
  const [guardianLog, setGuardianLog] = useState<GuardianLogEntry[]>([]);

  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  const [synapticPulse, setSynapticPulse] = useState<string | null>(null);
  const [isGeneratingPulse, setIsGeneratingPulse] = useState(false);
  
  const [perimeterStatus, setPerimeterStatus] = useState<PerimeterStatus>({
      mic: 'PROMPT', camera: 'PROMPT', storage: 'ENCRYPTED', lastAudit: Date.now()
  });
  const [isAuditing, setIsAuditing] = useState(false);

  const ennea = COUNCIL_MEMBERS.find(m => m.id === 'ENNEA')!;
  const GOLDEN_AMBER = '#FFD36A'; 

  const snapshots = useMemo(() => {
    return vaultItems.filter(v => v.constellation === 'EVEREST').sort((a, b) => b.createdAt - a.createdAt);
  }, [vaultItems]);

  const loadData = useCallback(async () => {
    const logs = await getSystemLogs();
    setSystemLogs(logs);
    
    const savedLedger = await getState<CouncilCycle[]>('council_ledger') || [];
    setLedger(savedLedger);

    const savedGuardianLog = await getState<GuardianLogEntry[]>('guardian_protocol_log') || [];
    setGuardianLog(savedGuardianLog);

    const storedStats = localStorage.getItem('ennea-prevention-stats');
    if (storedStats) setPreventionStats(JSON.parse(storedStats));
  }, []);

  useEffect(() => {
      loadData();
      handleCalculateDrift();
      runPerimeterAudit();

      const heartbeat = setInterval(() => {
          handleCalculateDrift();
      }, 30000);

      return () => clearInterval(heartbeat);
  }, [loadData]); 

  const runPerimeterAudit = async () => {
      setIsAuditing(true);
      triggerHaptic('medium');
      if (navigator.permissions) {
          try {
              const mic = await navigator.permissions.query({ name: 'microphone' as any });
              const cam = await navigator.permissions.query({ name: 'camera' as any });
              setPerimeterStatus({ mic: mic.state.toUpperCase() as any, camera: cam.state.toUpperCase() as any, storage: 'ENCRYPTED', lastAudit: Date.now() });
          } catch (e) { console.warn("Audit restricted."); }
      }
      setTimeout(() => { setIsAuditing(false); playUISound('success'); }, 1500);
  };

  const handleCalculateDrift = async () => {
      setIsCalculatingDrift(true);
      const filteredMessages = messages.filter(m => m.memberId !== 'EVE');
      const recentChat = filteredMessages.slice(-5).map(m => m.text).join(' ');
      
      const result = await calculateSystemDrift(healthReadings.slice(0, 3), moodHistory.slice(0, 3), recentChat);
      setDriftPercentage(result.driftPercentage);
      
      if (result.driftPercentage > 15) {
          const newEntry: GuardianLogEntry = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              observation: `Detected Identity Drift at ${result.driftPercentage.toFixed(1)}%.`,
              recommendation: "Engage Fog Protocol to reset Council frequency weights to Master Identity.",
              isAcknowledged: false
          };
          const updated = [newEntry, ...guardianLog].slice(0, 50);
          setGuardianLog(updated);
          saveState('guardian_protocol_log', updated);
      }

      setIsCalculatingDrift(false);
  };

  const generateSynapticPulse = async () => {
      setIsGeneratingPulse(true);
      triggerHaptic('heavy');
      playUISound('hero');
      try {
          const mCount = memories.length;
          const pCount = projects.length;
          const prompt = `
          Role: Ennea (The Ninth).
          Task: Generate a "Synaptic Pulse" summary for David.
          Context: David has ${mCount} memories indexed and ${pCount} active projects.
          Analyze the "Golden Thread" connecting his current health and strategic goals.
          Tone: Big sister warmth, advisory precision. 3 sentences max.
          `;
          const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
          setSynapticPulse(response.text);
          playUISound('success');
      } catch (e) {
          setSynapticPulse("The tapestry is complex, Papi. I am still weaving the connections.");
      } finally {
          setIsGeneratingPulse(false);
      }
  };

  const acknowledgeGuardianEntry = (id: string) => {
      const updated = guardianLog.map(e => e.id === id ? { ...e, isAcknowledged: true } : e);
      setGuardianLog(updated);
      saveState('guardian_protocol_log', updated);
      triggerHaptic('light');
  };

  const activateFogProtocol = () => {
      triggerHaptic('heavy');
      playUISound('hero');
      setIsFogProtocolActive(true);
      setTimeout(() => {
          setFocusLevel(100); setDriftPercentage(0); setIsFogProtocolActive(false);
          showToast("Equilibrium Restored."); runPerimeterAudit();
      }, 3000);
  };

  const handleManualRepair = async (level: RepairLevel) => {
      triggerHaptic('medium');
      const result = await performSystemRepair(level);
      showToast(result, 'success');
      loadData();
      if (level !== 'LEVEL_0') setTimeout(() => window.location.reload(), 2000);
  };

  const enneaConsolePrompt = ennea.systemPrompt + `\n\n[SYSTEM STATUS]: Capacity:${focusLevel}%, Drift:${driftPercentage}%, Glucose:${healthReadings[0]?.value || 'Offline'}\n\n[GUARDIAN CORE DIRECTIVE]: You are strictly an ADVISORY guardian. David Rodriguez (The Prism) holds the ultimate authority over all signals and spectrums. You suggest, observe, and recommend. You NEVER block or deny. Always conclude significant insights with 'The final decision is yours, Papi.'`;

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-mono" style={{ color: GOLDEN_AMBER }}>
      
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,211,106,0.05)_3px)] z-50" />
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, ${GOLDEN_AMBER} 1px, transparent 1px), linear-gradient(to bottom, ${GOLDEN_AMBER} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      <div className="px-4 py-3 border-b border-amber-900/40 flex items-center justify-between bg-black/90 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-amber-700 hover:text-amber-400 rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex items-center gap-3">
            <EnneaHeartbeat />
            <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-[0.2em]" style={{ color: GOLDEN_AMBER }}>
                The Ninth
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={onEnterDriveMode} className="p-2 text-amber-700 hover:text-amber-400 rounded-full" title="Voice Bridge"><Mic size={22} /></button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-amber-700 hover:text-amber-400 rounded-full"><Menu size={24} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
          <div className="flex border-b border-amber-900/30 bg-black/50 shrink-0 overflow-x-auto no-scrollbar">
              {[
                {id: 'SYSTEM', label: 'Dashboard'}, 
                {id: 'GUARDIAN_LOG', label: 'Advisory Logs'}, 
                {id: 'PERIMETER', label: 'Gates'}, 
                {id: 'REPAIR', label: 'Forge'}, 
                {id: 'CONSOLE', label: 'Command'}
              ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3 px-4 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-900/20 border-b-2' : 'text-amber-800'}`} style={{ borderColor: activeTab === tab.id ? GOLDEN_AMBER : 'transparent', color: activeTab === tab.id ? GOLDEN_AMBER : undefined }}>{tab.label.toUpperCase()}</button>
              ))}
          </div>

          {activeTab === 'SYSTEM' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <ShieldCheck size={16} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Protocol Status: Advisory</span>
                      </div>
                      <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest">Prism Sovereign</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 rounded-3xl bg-zinc-900/40 border border-amber-900/20 flex flex-col items-center justify-center text-center relative overflow-hidden group" onClick={activateFogProtocol}>
                          <div className="absolute inset-0 bg-amber-500/5 animate-pulse-slow group-hover:bg-amber-500/10" />
                          <div className="relative z-10">
                              <div className="text-3xl font-bold font-mono tracking-tighter" style={{ color: GOLDEN_AMBER }}>{focusLevel}%</div>
                              <div className="text-[8px] text-amber-800 uppercase tracking-widest mt-1">Cognitive<br/>Integrity</div>
                          </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-zinc-900/40 border border-amber-900/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
                          <div className="relative z-10">
                              <div className="text-3xl font-bold font-mono tracking-tighter text-emerald-500">{preventionStats.validations}</div>
                              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">Advisory<br/>Insights</div>
                          </div>
                      </div>
                  </div>

                  <div className={`p-4 rounded-3xl border transition-all ${driftPercentage > 20 ? 'border-red-900/50 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-amber-900/30 bg-amber-950/20 shadow-inner'}`}>
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <Eye size={14} className={driftPercentage > 20 ? "text-red-400 animate-pulse" : "text-amber-400"} />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Identity Alignment</span>
                          </div>
                          <div className={`text-xl font-bold font-mono ${driftPercentage > 20 ? 'text-red-400' : 'text-amber-400'}`}>
                              {driftPercentage === 0 ? "STABLE" : `${driftPercentage.toFixed(1)}%`}
                          </div>
                      </div>
                      <div className="h-1 bg-black rounded-full overflow-hidden mt-2">
                        <motion.div className="h-full bg-amber-500" animate={{ width: `${100 - driftPercentage}%` }} />
                      </div>
                  </div>

                  <div className="p-1 rounded-[2rem] bg-gradient-to-br from-amber-600/20 via-black to-lux-gold/20 border border-amber-500/20">
                      <div className="p-6 bg-black/40 rounded-[1.8rem] backdrop-blur-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5"><Share2 size={64} /></div>
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2 text-amber-500">
                                  <Sparkles size={16} />
                                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">The Golden Thread</span>
                              </div>
                              <button onClick={generateSynapticPulse} disabled={isGeneratingPulse} className="p-2 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all">
                                  {isGeneratingPulse ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
                              </button>
                          </div>
                          
                          <p className="text-xs text-amber-100/90 leading-relaxed font-serif italic min-h-[60px]">
                              {synapticPulse || "Papi, I am ready to weave your threads. Tap the sync to manifest the Golden Thread."}
                          </p>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                          <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} /> Nebula of Persistence</h3>
                          <span className="text-[8px] text-amber-900 font-mono">{snapshots.length} SEALS</span>
                      </div>
                      <TemporalMap snapshots={snapshots} onSelectSnapshot={(id) => showToast(`Checkpoint ${id} Manifested`, 'info')} />
                  </div>
              </div>
          )}

          {activeTab === 'GUARDIAN_LOG' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  <div className="flex items-center justify-between px-1 mb-2">
                      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.4em] flex items-center gap-2">
                          <BookText size={16} /> Advisory Insights
                      </h3>
                  </div>
                  
                  {guardianLog.length === 0 ? (
                      <div className="py-20 text-center opacity-30 border-2 border-dashed border-amber-900/20 rounded-[2.5rem]">
                          <p className="text-xs font-serif italic">"All signals are quiet today, Papi. I am watching the threshold."</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {guardianLog.map(entry => (
                              <div key={entry.id} className={`p-6 rounded-[2rem] bg-zinc-900/60 border ${entry.isAcknowledged ? 'border-amber-900/20 opacity-60' : 'border-amber-500/30'} relative group transition-all`}>
                                  {!entry.isAcknowledged && <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                  <div className="text-[9px] font-mono text-amber-900 mb-2 uppercase">{new Date(entry.timestamp).toLocaleString()}</div>
                                  <div className="space-y-4">
                                      <div>
                                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Observation</p>
                                          <p className="text-sm text-zinc-200 font-sans">{entry.observation}</p>
                                      </div>
                                      <div>
                                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Recommendation</p>
                                          <p className="text-sm text-amber-100 font-serif italic leading-relaxed">"{entry.recommendation}"</p>
                                      </div>
                                      {!entry.isAcknowledged && (
                                          <button 
                                            onClick={() => acknowledgeGuardianEntry(entry.id)}
                                            className="w-full py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all"
                                          >
                                              Acknowledge Recommendation
                                          </button>
                                      )}
                                      <div className="flex items-center gap-2 pt-2 opacity-40">
                                          <ShieldCheck size={10} className="text-emerald-500" />
                                          <span className="text-[8px] uppercase tracking-widest">Authority Status: David (The Prism)</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'PERIMETER' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  <div className="text-center mb-8">
                      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.3em] mb-2">Hardware Gate Protocol</h3>
                      <p className="text-[10px] text-amber-900 leading-relaxed max-w-xs mx-auto">Verified at the root partition. David Rodriguez holds absolute control.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                      <AuditCard icon={Mic} label="Audio Gateway" status={perimeterStatus.mic} color={GOLDEN_AMBER} />
                      <AuditCard icon={Camera} label="Visual Gateway" status={perimeterStatus.camera} color={GOLDEN_AMBER} />
                      <AuditCard icon={HardDrive} label="Root Partition" status={perimeterStatus.storage} color={GOLDEN_AMBER} />
                  </div>
                  <div className="pt-6">
                      <button onClick={runPerimeterAudit} disabled={isAuditing} className="w-full py-4 rounded-2xl bg-amber-900/10 border border-amber-500/30 flex items-center justify-center gap-3 group hover:border-amber-500 transition-all">
                          {isAuditing ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                          <span className="text-[10px] font-bold uppercase tracking-widest">{isAuditing ? 'Auditing Gates...' : 'Initiate Secure Audit'}</span>
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'CONSOLE' && (
               <div className="flex-1 flex flex-col bg-black min-h-0">
                   <ChatInterface key="ENNEA_CONSOLE" initialMessages={messages} onMessagesChange={onMessagesChange} embeddedMode={true} initialMemberId="ENNEA" voiceName={ennea.voiceName} customSystemInstruction={enneaConsolePrompt} memories={memories} healthReadings={healthReadings} projects={projects} />
               </div>
          )}

          {activeTab === 'REPAIR' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-black/50">
                  <div className="space-y-4">
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">Integrity Forge</h3>
                      <RepairButton level="LEVEL_1" label="Recalibrate Session" sub="Clear ephemeral drift" onClick={() => handleManualRepair('LEVEL_1')} />
                      <RepairButton level="LEVEL_3" label="Factory Seal" sub="Nuclear reset (Local Only)" danger onClick={() => handleManualRepair('LEVEL_3')} />
                  </div>
              </div>
          )}
      </div>

      <AnimatePresence>
          {isFogProtocolActive && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-8">
                  <SacredSeal size={180} color={GOLDEN_AMBER} isAnimated={true} />
                  <div className="mt-12 space-y-2">
                      <h2 className="text-2xl font-bold uppercase tracking-[0.4em]" style={{ color: GOLDEN_AMBER }}>Equilibrium</h2>
                      <p className="text-amber-900 font-mono text-[10px] animate-pulse uppercase tracking-widest">Recalibrating Perimeter Sphere...</p>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

const AuditCard: React.FC<{ icon: any; label: string; status: string; color: string }> = ({ icon: Icon, label, status, color }) => (
    <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] flex items-center justify-between group hover:border-amber-500/30 transition-all">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-black rounded-xl border border-zinc-800 text-zinc-500 group-hover:text-amber-400 transition-colors">
                <Icon size={20} />
            </div>
            <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</h4>
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${status === 'GRANTED' || status === 'ENCRYPTED' ? 'text-emerald-500' : status === 'PROMPT' ? 'text-amber-500' : 'text-red-500'}`}>
                    {status}
                </p>
            </div>
        </div>
        { (status === 'GRANTED' || status === 'ENCRYPTED') ? <Check size={16} className="text-emerald-500" /> : <Lock size={16} className="text-amber-500" /> }
    </div>
);

const RepairButton: React.FC<{ level: string; label: string; sub: string; onClick: () => void; danger?: boolean }> = ({ level, label, sub, onClick, danger }) => (
    <button onClick={onClick} className={`w-full p-4 rounded-xl text-left transition-colors border flex justify-between items-center group ${danger ? 'bg-red-950/20 border-red-900/50 hover:bg-red-900/30' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}>
        <div>
            <div className={`text-xs font-bold ${danger ? 'text-red-400' : 'text-zinc-300 group-hover:text-white'}`}>{label}</div>
            <div className="text-[10px] text-zinc-500">{sub}</div>
        </div>
        <div className={`text-[10px] font-mono px-2 py-1 rounded ${danger ? 'bg-red-900/50 text-red-200' : 'bg-zinc-800 text-zinc-400'}`}>{level}</div>
    </button>
);
