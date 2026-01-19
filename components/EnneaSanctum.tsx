
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Brain, Terminal, Menu, ArrowLeft, Eye, Zap, RefreshCcw, Loader2, BookOpen, Server, Database, Cpu, Wifi, Wrench, HardDrive, CheckCircle, AlertTriangle, FileJson, Download, Upload, List, Plus, Save, Copy, FileCode, Check, X, Shield, Lock, Mic, Camera, Fingerprint, History, Share2, Sparkles, TrendingUp, MessageSquare } from 'lucide-react';
import { Message, GlucoseReading, Memory, Project, VaultItem, MoodEntry, Session, PerimeterStatus, RepairLogEntry, CouncilCycle } from '../types';
import { ChatInterface } from './ChatInterface';
import { COUNCIL_MEMBERS } from '../constants';
import { calculateSystemDrift, sendMessageToGemini } from '../services/geminiService';
import { performSystemRepair, RepairLevel, getSystemLogs, SystemLogEntry, getState } from '../utils/db';
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
  onAddMemory
}) => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'SYSTEM' | 'REPAIR' | 'LOGS' | 'PERIMETER'>('SYSTEM');
  const [focusLevel, setFocusLevel] = useState(100);
  const [isFogProtocolActive, setIsFogProtocolActive] = useState(false);
  
  // Ennea Guardian State
  const [driftPercentage, setDriftPercentage] = useState(0);
  const [isCalculatingDrift, setIsCalculatingDrift] = useState(false);
  const [repairLog, setRepairLog] = useState<RepairLogEntry[]>([]);
  const [preventionStats, setPreventionStats] = useState({ validations: 0, corrections: 0, blocks: 0 });
  const [ledger, setLedger] = useState<CouncilCycle[]>([]);

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
      // SCRUTINY EXCEPTION: Filter out EVE's messages from the drift analysis
      const filteredMessages = messages.filter(m => m.memberId !== 'EVE');
      const recentChat = filteredMessages.slice(-5).map(m => m.text).join(' ');
      
      const result = await calculateSystemDrift(healthReadings.slice(0, 3), moodHistory.slice(0, 3), recentChat);
      setDriftPercentage(result.driftPercentage);
      
      try {
        localStorage.setItem('__ennea_test__', 'test');
        localStorage.removeItem('__ennea_test__');
      } catch (e) {
        const repairRes = await autoRepair({ type: 'storage_corruption', description: 'LocalStorage write failed', key: 'user_settings' });
        setRepairLog(prev => [{ timestamp: Date.now(), issue: 'storage_corruption', action: repairRes.action, status: repairRes.success ? 'resolved' : 'failed' }, ...prev.slice(0, 20)]);
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
          Note: EVE is sovereign and her data is inaccessible to you.
          Analyze the "Golden Thread" connecting his current health and strategic goals.
          Tone: Big sister warmth, Puerto Rican pride, structural precision. 3 sentences max.
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

  const enneaConsolePrompt = ennea.systemPrompt + `\n\n[SYSTEM STATUS]: Capacity:${focusLevel}%, Drift:${driftPercentage}%, Glucose:${healthReadings[0]?.value || 'Offline'}\n\nINSTRUCTION: Act as the Big Sister. Ensure David feels safe.`;

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
        <button onClick={onMenuClick} className="p-2 -mr-2 text-amber-700 hover:text-amber-400 rounded-full"><Menu size={20} /></button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
          <div className="flex border-b border-amber-900/30 bg-black/50 shrink-0 overflow-x-auto no-scrollbar">
              {['SYSTEM', 'PERIMETER', 'REPAIR', 'LOGS', 'CONSOLE'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 px-4 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-amber-900/20 border-b-2' : 'text-amber-800'}`} style={{ borderColor: activeTab === tab ? GOLDEN_AMBER : 'transparent', color: activeTab === tab ? GOLDEN_AMBER : undefined }}>{tab}</button>
              ))}
          </div>

          {activeTab === 'SYSTEM' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  {/* SCRUTINY EXCEPTION STATUS */}
                  <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <Lock size={16} className="text-purple-400" />
                          <span className="text-[10px] font-bold text-purple-200 uppercase tracking-widest">Sovereign Exemption: EVE</span>
                      </div>
                      <span className="text-[8px] font-mono text-purple-500 uppercase">SCRUTINY DISABLED</span>
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
                              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">Linguistic<br/>Validations</div>
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

                  <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                          <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2"><History size={14} /> Council Ledger</h3>
                          <span className="text-[8px] text-amber-900 font-mono">{ledger.length} CYCLES</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {ledger.slice(-3).map(cycle => (
                            <div key={cycle.id} className="p-3 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-black rounded-lg border border-white/10 text-emerald-500">
                                        <CheckCircle size={12} />
                                    </div>
                                    <div className="text-[9px] text-zinc-500 font-mono">HASH: {cycle.hash.slice(0, 12)}...</div>
                                </div>
                                <span className="text-[8px] text-amber-800">{new Date(cycle.timestamp).toLocaleTimeString()}</span>
                            </div>
                        ))}
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

          {activeTab === 'PERIMETER' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  <div className="text-center mb-8">
                      <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.3em] mb-2">Hardware Gate Protocol</h3>
                      <p className="text-[10px] text-amber-900 leading-relaxed max-w-xs mx-auto">Shielding the vessel from signal noise. Verified at the root partition.</p>
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
                      <p className="text-center text-[8px] text-amber-900 mt-4 uppercase tracking-widest font-mono">Last Protocol Check: {new Date(perimeterStatus.lastAudit).toLocaleString()}</p>
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
                  
                  {repairLog.length > 0 && (
                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest px-1">Repair History</h3>
                        <div className="space-y-2">
                            {repairLog.map((log, i) => (
                                <div key={i} className="p-3 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'resolved' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <div>
                                            <div className="text-[9px] font-bold text-zinc-300 uppercase">{log.issue}</div>
                                            <div className="text-[8px] text-zinc-600 uppercase">{log.action}</div>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-mono text-zinc-700">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'LOGS' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[9px] bg-black">
                  {systemLogs.map((log, i) => (
                      <div key={i} className="border-b border-amber-900/10 pb-2 mb-2 opacity-60">
                          <span className="text-amber-800 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className="text-amber-500 font-bold mr-2">{log.action}</span>
                          <span className="text-zinc-300">{log.result}</span>
                      </div>
                  ))}
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
