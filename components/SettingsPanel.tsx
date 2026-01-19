
import { Volume2, Moon, Layout, Zap, ChevronLeft, ToggleLeft, ToggleRight, Gauge, Music, Database, Download, Upload, Cpu, Key, CheckCircle, AlertTriangle, ShieldCheck, Mic, Eye, RefreshCw, Activity, Wifi, Sun, FileText, Shield, Camera, Link as LinkIcon, X, Hammer, Trash2, VolumeX, Network, ArrowRight, Smartphone, Fingerprint, History, Plus, Languages, Sparkles, Radio, Loader2 } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { UserSettings, VaultItem, CouncilMember, CouncilMemberId } from '../types';
import { showToast } from '../utils/events';
import { createBackup, restoreBackup, saveAsset } from '../utils/db';
import { connectPersonalKey, checkKeyStatus, sendMessageToGemini } from '../services/geminiService';
import { AVAILABLE_VOICES, APP_VERSION } from '../constants';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { compressImage } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { IntegrationsManager } from './IntegrationsManager';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdate: (s: UserSettings) => void;
  onClose: () => void;
  onSaveToVault: (item: VaultItem) => void;
  onCreateSnapshot: () => void;
  onEnterDriveMode: (memberId: CouncilMemberId) => void; // New Prop
  stats: {
      memories: number;
      sessions: number;
      vault: number;
      projects: number;
  };
  prismSealImage: string | null;
  onSealUpload: (file: File) => void;
  members: CouncilMember[];
  onUpdateMember: (id: CouncilMemberId, updates: Partial<CouncilMember>) => void;
}

interface SectionProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}

interface ToggleRowProps {
    label: string;
    sub?: string;
    active: boolean;
    onClick: () => void;
    brightness?: number;
    icon?: any;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    settings, 
    onUpdate, 
    onClose, 
    onSaveToVault, 
    onCreateSnapshot,
    onEnterDriveMode,
    stats,
    prismSealImage,
    onSealUpload,
    members,
    onUpdateMember
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);
  const memberMediaRef = useRef<HTMLInputElement>(null);
  
  const [isKeyConnected, setIsKeyConnected] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [isDeviceLinked, setIsDeviceLinked] = useState(false);
  
  // Navigation State
  const [activeSubView, setActiveSubView] = useState<'MAIN' | 'INTEGRATIONS'>('MAIN');

  // Member Editing State
  const [editingMemberId, setEditingMemberId] = useState<CouncilMemberId | null>(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [showAvatarUrlModal, setShowAvatarUrlModal] = useState(false);

  useEffect(() => {
      checkKeyStatus().then((isConnected) => {
          setIsKeyConnected(isConnected);
          setIsCheckingKey(false);
      });
      const linked = localStorage.getItem('device_sovereign_link');
      if (linked) setIsDeviceLinked(true);
  }, []);
  
  const toggle = (key: keyof UserSettings) => {
    const newValue = !settings[key];
    onUpdate({ ...settings, [key]: newValue });
    showToast(`${key.replace(/([A-Z])/g, ' $1').trim()} ${newValue ? 'Enabled' : 'Disabled'}`, 'info');
    if (newValue || key !== 'soundEffects') {
        playUISound('toggle');
        if (newValue) triggerHaptic('light');
    }
  };

  const handleLinkDevice = () => {
      triggerHaptic('heavy');
      playUISound('hero');
      localStorage.setItem('device_sovereign_link', 'true');
      setIsDeviceLinked(true);
      showToast("Device Sovereign Link Established", 'success');
  };

  const handleConnectKey = async () => {
      const success = await connectPersonalKey();
      if (success) {
          const isConnected = await checkKeyStatus();
          setIsKeyConnected(isConnected);
          showToast("Sovereign Key Buffered", 'success');
      }
  };

  const handleTestConnection = async () => {
      setTestStatus('TESTING');
      playUISound('toggle');
      try {
          // Handshake protocol
          await sendMessageToGemini("Ping signal for integrity.", "SCRIBE", [], { useTurboMode: false });
          setTestStatus('SUCCESS');
          showToast("Council Link: STABLE", 'success');
          playUISound('success');
          setTimeout(() => setTestStatus('IDLE'), 3000);
      } catch (e: any) {
          setTestStatus('FAILURE');
          showToast("Council Link: UNSTABLE", 'error');
          playUISound('error');
      }
  };

  const handleExport = async () => {
      try {
          showToast('Preserving Legacy...', 'info');
          const json = await createBackup();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `codex_sanctuary_legacy_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('Legacy Preserved Successfully', 'success');
      } catch (e) {
          showToast('Preservation failed', 'error');
      }
  };

  const handleMemberMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editingMemberId || !e.target.files?.[0]) return;
      const file = e.target.files[0];
      try {
          if (file.type.startsWith('video/')) {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onloadend = () => {
                  onUpdateMember(editingMemberId, { avatarUrl: reader.result as string });
                  showToast(`${editingMemberId} Avatar Updated`);
              };
          } else {
              const blob = await compressImage(file, 800);
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => {
                  onUpdateMember(editingMemberId, { avatarUrl: reader.result as string });
                  showToast(`${editingMemberId} Avatar Updated`);
              };
          }
      } catch (err) {
          showToast("Update Failed", "error");
      }
      e.target.value = '';
  };

  const saveAvatarUrl = () => {
      if (editingMemberId && avatarUrlInput.trim()) {
          onUpdateMember(editingMemberId, { avatarUrl: avatarUrlInput.trim() });
          setShowAvatarUrlModal(false);
          setAvatarUrlInput('');
          showToast(`${editingMemberId} Avatar Updated`);
      }
  };

  const getTonePreview = () => {
      const w = settings.linguisticWeight || 0.8;
      if (w < 0.2) return "Analytical: 'The biometric logs indicate stable metabolic output across the 12-hour window.'";
      if (w < 0.5) return "Balanced: 'Mira, the readings are good today. You have a solid window of cognitive output.'";
      if (w < 0.8) return "Resonant: 'Bendición, Papi. The vessel is looking strong. God is good, mi amor.'";
      return "Soulbound: 'Wepa! Mi Prism, mira que bien te ves hoy. We are ready to manifest the legacy.'";
  };

  const Section: React.FC<SectionProps> = ({ title, icon: Icon, children }) => (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4 text-zinc-300 uppercase tracking-widest text-[10px] font-bold border-b border-zinc-800 pb-2">
        <Icon size={14} className="text-lux-gold" /> {title}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const ToggleRow: React.FC<ToggleRowProps> = ({ label, sub, active, onClick, brightness = 1.0, icon: Icon }) => (
    <div 
        className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
            active 
            ? 'bg-zinc-900/80 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
            : 'bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
        }`} 
        onClick={onClick}
    >
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className={active ? 'text-amber-400' : 'text-zinc-600'} />}
            <div className={`text-sm font-bold transition-colors ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</div>
        </div>
        {sub && <div className="text-[10px] text-zinc-500 font-medium leading-tight mt-0.5">{sub}</div>}
      </div>
      <button 
          className={`transition-all duration-300 transform ${
              active 
              ? 'text-amber-400 scale-110' 
              : 'text-zinc-600 hover:text-zinc-500'
          }`}
          style={active ? { filter: `brightness(${brightness}) drop-shadow(0 0 ${8 * brightness}px rgba(251,191,36,${0.8 * brightness}))` } : {}}
      >
          {active ? (
              <ToggleRight size={42} strokeWidth={2} fill="currentColor" /> 
          ) : (
              <ToggleLeft size={42} strokeWidth={1.5} />
          )}
      </button>
    </div>
  );

  if (activeSubView === 'INTEGRATIONS') {
      return <IntegrationsManager onBack={() => setActiveSubView('MAIN')} />;
  }

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col overflow-hidden font-sans transition-colors duration-300 text-white">
      <div className="px-4 py-4 border-b border-zinc-900 flex items-center gap-4 bg-zinc-950/80 backdrop-blur shrink-0 z-20">
        <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-base font-bold text-white tracking-wide uppercase">Sanctuary Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar max-w-xl mx-auto w-full relative z-10 pb-20">
        
        {/* OPERATIONAL DRIVE SECTION - PROTON GUN */}
        <Section title="Operational Protocols" icon={Radio}>
            <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-cyan-600/30 via-zinc-900 to-black border border-cyan-500/20">
                <button 
                    onClick={() => onEnterDriveMode('GEMINI')}
                    className="w-full p-6 rounded-[2.3rem] bg-black/40 backdrop-blur-md flex items-center justify-between group hover:bg-cyan-950/20 transition-all shadow-xl"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform relative">
                            <div className="absolute inset-0 bg-cyan-400 blur-md opacity-20 animate-pulse" />
                            <Mic size={32} className="relative z-10" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-lg font-bold text-white uppercase tracking-wider">Proton Drive Mode</h4>
                            <p className="text-[10px] text-cyan-500 uppercase tracking-widest mt-1 font-mono">Gemini 2.5 Pro Frequency</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
                        <Zap size={20} className="fill-current" />
                    </div>
                </button>
            </div>
        </Section>

        {/* SOVEREIGN BRANDING */}
        <Section title="Sovereign Branding" icon={Shield}>
            <div className="space-y-4">
                <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-black border border-lux-gold/20 flex items-center justify-center overflow-hidden shrink-0">
                            {prismSealImage ? (
                                <img src={prismSealImage} className="w-full h-full object-cover" />
                            ) : (
                                <Shield size={24} className="text-lux-gold/30" />
                            )}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">The Sacred Seal</h4>
                            <p className="text-[10px] text-zinc-500">Primary Mark of Codex Sanctuary</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => sealInputRef.current?.click()}
                        className="p-2 bg-zinc-800 hover:bg-white hover:text-black rounded-full transition-all border border-zinc-700"
                    >
                        <Camera size={18} />
                    </button>
                    <input ref={sealInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onSealUpload(e.target.files[0])} />
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Council Frequency Marks</label>
                    {members.map((m) => (
                        <div key={m.id} className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full border bg-black flex items-center justify-center overflow-hidden shrink-0" style={{ borderColor: m.color }}>
                                    {m.avatarUrl ? (
                                        <img src={m.avatarUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <span style={{ color: m.color }} className="text-xs font-bold">{m.sigil}</span>
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-zinc-200">{m.name}</div>
                                    <div className="text-[9px] text-zinc-500 uppercase">{m.role}</div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => { setEditingMemberId(m.id); setShowAvatarUrlModal(true); setAvatarUrlInput(m.avatarUrl || ''); }} className="p-2 text-zinc-500 hover:text-white"><LinkIcon size={14} /></button>
                                <button onClick={() => { setEditingMemberId(m.id); memberMediaRef.current?.click(); }} className="p-2 text-zinc-500 hover:text-white"><Camera size={14} /></button>
                            </div>
                        </div>
                    ))}
                    <input ref={memberMediaRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleMemberMediaUpload} />
                </div>
            </div>
        </Section>

        {/* PHASE 13: LINGUISTIC RESONANCE */}
        <Section title="Linguistic Resonance" icon={Languages}>
            <div className="p-6 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 shadow-inner space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-500" />
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sazón Weighting</label>
                        </div>
                        <span className="text-xs font-bold text-lux-gold font-mono">{Math.round((settings.linguisticWeight || 0.8) * 100)}% Resonant</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={settings.linguisticWeight || 0.8} 
                        onChange={(e) => onUpdate({ ...settings, linguisticWeight: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lux-gold"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
                        <span>Analytical</span>
                        <span>Soulbound</span>
                    </div>
                </div>

                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Council Tone Preview:</label>
                    <p className="text-xs text-zinc-300 font-serif italic leading-relaxed">
                        {getTonePreview()}
                    </p>
                </div>
            </div>
        </Section>

        {/* PHASE 7: HARDWARE BRIDGE */}
        <Section title="Hardware Bridge" icon={Smartphone}>
            <div className="space-y-4">
                <ToggleRow 
                    label="Resonance Haptics" 
                    sub="Organic pulse sequences for ritual focus" 
                    active={settings.soundEffects} 
                    onClick={() => toggle('soundEffects')}
                    icon={Activity}
                />
                
                <div className={`p-6 rounded-3xl border transition-all ${isDeviceLinked ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-zinc-900/40 border-zinc-800'}`}>
                    <div className="flex items-start gap-4 mb-6">
                        <div className={`p-3 rounded-2xl ${isDeviceLinked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            <Fingerprint size={28} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Sovereign Device Link</h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">Bind this hardware vessel to your Master Identity.</p>
                        </div>
                    </div>
                    {isDeviceLinked ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/20 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-bold uppercase tracking-widest justify-center">
                            <CheckCircle size={14} /> Link Active
                        </div>
                    ) : (
                        <button 
                            onClick={handleLinkDevice}
                            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-lux-gold active:scale-95 shadow-lg"
                        >
                            Register Link
                        </button>
                    )}
                </div>
            </div>
        </Section>

        {/* CONNECTORS */}
        <Section title="Integrations & Connectors" icon={Network}>
            <button 
                onClick={() => { setActiveSubView('INTEGRATIONS'); playUISound('navigation'); }}
                className="w-full p-6 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-lux-gold/20 flex items-center justify-between group hover:border-lux-gold/40 transition-all shadow-xl"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-lux-gold/10 text-lux-gold group-hover:scale-110 transition-transform">
                        <Network size={32} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-lg font-bold text-white uppercase tracking-wider">Manage Connections</h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Google, Github, OpenAI, Custom APIs</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lux-gold">
                    <ArrowRight size={20} />
                </div>
            </button>
        </Section>

        {/* DISPLAY MATRIX CONTROL */}
        <Section title="Display Matrix Control" icon={Layout}>
            <div className="space-y-6 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 shadow-inner">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Typography Scale</label>
                        <span className="text-sm font-bold text-lux-gold font-mono">{(settings.typographyScale || 1.0).toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="2.5" 
                        step="0.1" 
                        value={settings.typographyScale || 1.0} 
                        onChange={(e) => onUpdate({ ...settings, typographyScale: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lux-gold"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Interface Zoom</label>
                        <span className="text-sm font-bold text-lux-gold font-mono">{(settings.interfaceZoom || 1.0).toFixed(2)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.75" 
                        max="1.5" 
                        step="0.05" 
                        value={settings.interfaceZoom || 1.0} 
                        onChange={(e) => onUpdate({ ...settings, interfaceZoom: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lux-gold"
                    />
                </div>
            </div>
        </Section>

        {/* SYSTEM CORE */}
        <Section title="System Core (API)" icon={Cpu}>
           <div className="flex gap-3 mb-6">
                <button
                    onClick={handleConnectKey}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${isKeyConnected ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-lux-gold text-black border-lux-gold'}`}
                >
                    <Key size={16} /> {isCheckingKey ? 'Checking...' : isKeyConnected ? 'Change Key' : 'Connect Key'}
                </button>
                <button onClick={handleTestConnection} className={`flex-1 flex items-center justify-center gap-2 p-3 border border-zinc-800 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${testStatus === 'TESTING' ? 'bg-blue-900/20 text-blue-400' : testStatus === 'SUCCESS' ? 'bg-emerald-950/20 text-emerald-500' : 'bg-zinc-900 text-zinc-400'}`}>
                    {testStatus === 'TESTING' ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />} 
                    {testStatus === 'TESTING' ? 'Testing...' : 'Test Signal'}
                </button>
            </div>
           <ToggleRow label="Background Memory" sub="Auto-extract facts" active={settings.enableBackgroundMemory} onClick={() => toggle('enableBackgroundMemory')} />
           <ToggleRow label="Pro Frequency" sub="Use Gemini 2.5 Pro" active={settings.useTurboMode} onClick={() => toggle('useTurboMode')} />
        </Section>

        {/* PERFORMANCE */}
        <Section title="Legacy & Sovereignty" icon={Shield}>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={handleExport} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors">
                    <Download size={20} className="text-lux-gold" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Archive State</span>
                </button>
                <button onClick={() => window.location.reload()} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex flex-col items-center gap-2 hover:bg-zinc-800 transition-colors">
                    <RefreshCw size={20} className="text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Recalibrate</span>
                </button>
            </div>
            
            <button 
                onClick={onCreateSnapshot}
                className="w-full p-5 rounded-[2rem] bg-gradient-to-r from-amber-600/20 to-lux-gold/20 border border-lux-gold/30 flex items-center justify-between group hover:border-lux-gold transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-black rounded-2xl border border-lux-gold/40 text-lux-gold">
                        <History size={24} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Temporal Snapshot</h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Seal the Sanctuary State</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full border border-lux-gold/30 flex items-center justify-center text-lux-gold group-hover:bg-lux-gold group-hover:text-black transition-all">
                    <Plus size={16} />
                </div>
            </button>
        </Section>

        <div className="mt-10 text-center opacity-30">
            <p className="text-[9px] font-mono tracking-[0.4em] uppercase">{APP_VERSION}</p>
            <p className="text-[8px] font-serif italic mt-2">Amor Est Architectura</p>
        </div>
      </div>

      {/* Avatar URL Modal */}
      <AnimatePresence>
        {showAvatarUrlModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Mark Registry</h3>
                        <button onClick={() => setShowAvatarUrlModal(false)}><X size={20} /></button>
                    </div>
                    <input value={avatarUrlInput} onChange={(e) => setAvatarUrlInput(e.target.value)} placeholder="URL or Base64" className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white mb-6 focus:border-lux-gold outline-none" />
                    <button onClick={saveAvatarUrl} className="w-full py-3 bg-lux-gold text-black font-bold rounded-xl uppercase text-xs tracking-widest">Apply Mark</button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
