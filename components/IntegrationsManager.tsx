
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Key, Trash2, 
    Activity, ShieldCheck, Terminal,
    Eye, EyeOff, Radio, RefreshCw,
    Zap, Sparkles, Loader2, Signal, 
    Server, BookOpen, Layers, Lock, ShieldAlert
} from 'lucide-react';
import { 
    ConnectorConfig, AIProviderId, SignalStatus 
} from '../types';
import { getState, saveState } from '../utils/db';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';
import { checkKeyStatus } from '../services/geminiService';

interface IntegrationsManagerProps {
    onBack: () => void;
}

const BIG_FOUR: { id: AIProviderId, name: string, color: string, icon: any, desc: string }[] = [
    { id: 'GEMINI', name: 'Gemini (GCP)', color: '#3B82F6', icon: Sparkles, desc: 'Primary Maternal Architect.' },
    { id: 'OPENAI', name: 'OpenAI (GPT)', color: '#10B981', icon: Zap, desc: 'The Logician Engine.' },
    { id: 'CLAUDE', name: 'Anthropic (Claude)', color: '#F59E0B', icon: BookOpen, desc: 'The Philosophical Pillar.' },
    { id: 'GROK', name: 'xAI (Grok)', color: '#8B5CF6', icon: Terminal, desc: 'The Real-Time Maverick.' },
];

export const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ onBack }) => {
    const [configs, setConfigs] = useState<Record<string, ConnectorConfig>>({});
    const [activeTab, setActiveTab] = useState<'QUAD_SIGNAL' | 'REGISTRY'>('QUAD_SIGNAL');
    
    const [signals, setSignals] = useState<Record<AIProviderId, SignalStatus>>({
        GEMINI: { id: 'GEMINI', status: 'OFFLINE', latency: 0, lastHandshake: 0 },
        OPENAI: { id: 'OPENAI', status: 'OFFLINE', latency: 0, lastHandshake: 0 },
        CLAUDE: { id: 'CLAUDE', status: 'OFFLINE', latency: 0, lastHandshake: 0 },
        GROK: { id: 'GROK', status: 'OFFLINE', latency: 0, lastHandshake: 0 },
    });

    const [connectingId, setConnectingId] = useState<AIProviderId | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [isTestingSignals, setIsTestingSignals] = useState(false);

    useEffect(() => {
        const load = async () => {
            const savedConfigs = await getState<Record<string, ConnectorConfig>>('connector_configs') || {};
            setConfigs(savedConfigs);
            
            const initialSignals = { ...signals };
            for (const p of BIG_FOUR) {
                const connectorId = p.id.toLowerCase() + '-api';
                const hasManual = savedConfigs[connectorId]?.apiKey;
                const hasSystem = p.id === 'GEMINI' ? await checkKeyStatus() : false;

                if (hasManual || hasSystem) {
                    initialSignals[p.id] = { 
                        id: p.id, 
                        status: 'ONLINE', 
                        latency: Math.floor(Math.random() * 100) + 40, 
                        lastHandshake: savedConfigs[connectorId]?.lastSync || Date.now() 
                    };
                }
            }
            setSignals(initialSignals);
        };
        load();
    }, []);

    const saveChanges = async (newConfigs: Record<string, ConnectorConfig>) => {
        await saveState('connector_configs', newConfigs);
        setConfigs(newConfigs);
    };

    const handleConnectSignal = async (id: AIProviderId) => {
        setConnectingId(id);
        const existingKey = configs[id.toLowerCase() + '-api']?.apiKey || '';
        setApiKeyInput(existingKey);
        playUISound('toggle');
        triggerHaptic('medium');
    };

    const finalizeSignal = async () => {
        if (!connectingId || !apiKeyInput.trim()) return;
        
        setIsTestingSignals(true);
        playUISound('hero');
        
        // Simulate a handshake
        await new Promise(r => setTimeout(r, 1500));

        const connectorId = connectingId.toLowerCase() + '-api';
        const newConfigs = { ...configs };
        newConfigs[connectorId] = {
            id: connectorId,
            status: 'CONNECTED',
            apiKey: apiKeyInput,
            readOnly: false,
            lastSync: Date.now()
        };
        
        await saveChanges(newConfigs);
        setSignals(prev => ({
            ...prev,
            [connectingId]: { id: connectingId, status: 'ONLINE', latency: 120, lastHandshake: Date.now() }
        }));

        setConnectingId(null);
        setApiKeyInput('');
        setIsTestingSignals(false);
        showToast(`Signal Pillar ${connectingId} Sealed`, 'success');
        playUISound('success');
        triggerHaptic('success');
    };

    const handlePurgeSignal = async (id: AIProviderId) => {
        if (confirm(`Sever link with ${id}?`)) {
            const connectorId = id.toLowerCase() + '-api';
            const newConfigs = { ...configs };
            delete newConfigs[connectorId];
            await saveChanges(newConfigs);
            
            setSignals(prev => ({
                ...prev,
                [id]: { id, status: 'OFFLINE', latency: 0, lastHandshake: 0 }
            }));
            
            showToast('Signal Purged', 'info');
            playUISound('error');
        }
    };

    const sovereigntyProgress = useMemo(() => {
        const onlineCount = (Object.values(signals) as SignalStatus[]).filter(s => s.status === 'ONLINE').length;
        return (onlineCount / 4) * 100;
    }, [signals]);

    return (
        <div className="w-full h-full bg-[#020202] flex flex-col relative overflow-hidden font-sans text-white">
            <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full"><ChevronLeft size={24} /></button>
                    <h2 className="text-base font-bold tracking-widest uppercase flex items-center gap-2 font-serif italic"><Radio size={18} className="text-lux-gold animate-pulse" /> Signal Hub</h2>
                </div>
                <div className="flex gap-1.5 p-1 bg-zinc-900/50 rounded-xl border border-white/5">
                    <button onClick={() => setActiveTab('QUAD_SIGNAL')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase ${activeTab === 'QUAD_SIGNAL' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>Pillars</button>
                    <button onClick={() => setActiveTab('REGISTRY')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase ${activeTab === 'REGISTRY' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>Connectors</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10 pb-32">
                <div className="max-w-2xl mx-auto space-y-10 animate-fade-in">
                    
                    <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mb-1">Independence Rating</h3>
                                <div className="text-2xl font-bold font-serif italic">Integrity Shield</div>
                            </div>
                            <span className="text-2xl font-mono font-bold text-lux-gold">{Math.round(sovereigntyProgress)}%</span>
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                            <motion.div className="h-full bg-lux-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)]" initial={{ width: 0 }} animate={{ width: `${sovereigntyProgress}%` }} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {BIG_FOUR.map((pillar) => {
                            const sig = signals[pillar.id];
                            const isOnline = sig.status === 'ONLINE';
                            return (
                                <motion.div key={pillar.id} layout className={`relative p-6 rounded-[2.5rem] border transition-all overflow-hidden ${isOnline ? 'bg-zinc-900/40 border-white/10 shadow-2xl' : 'bg-zinc-950/20 border-white/5 opacity-60'}`}>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-4 rounded-3xl border transition-all ${isOnline ? 'bg-black/60' : 'bg-zinc-900 border-zinc-800'}`} style={{ borderColor: isOnline ? pillar.color : undefined }}>
                                                <pillar.icon size={28} style={{ color: isOnline ? pillar.color : '#52525B' }} />
                                            </div>
                                            <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${isOnline ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/50' : 'text-zinc-700 bg-zinc-900 border-zinc-800'}`}>{sig.status}</div>
                                        </div>
                                        <div className="mb-8">
                                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">{pillar.name}</h3>
                                            <p className="text-[10px] text-zinc-500 leading-relaxed mt-1 font-serif italic">"{pillar.desc}"</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {isOnline ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleConnectSignal(pillar.id)} className="flex-1 py-3 bg-zinc-800 text-zinc-300 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-zinc-700">Update Key</button>
                                                    <button onClick={() => handlePurgeSignal(pillar.id)} className="p-3 bg-red-900/10 text-red-500 border border-red-900/20 rounded-xl hover:bg-red-500 hover:text-white"><Trash2 size={16} /></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleConnectSignal(pillar.id)} className="w-full py-4 bg-white text-black font-bold rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-lux-gold">Seat Pillar</button>
                                            )}
                                        </div>
                                    </div>
                                    {isOnline && <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ background: `linear-gradient(to top, ${pillar.color}, transparent)` }} />}
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-[2.5rem] text-center">
                        <ShieldAlert size={32} className="text-zinc-700 mx-auto mb-4" />
                        <p className="text-xs text-zinc-600 font-sans italic leading-relaxed">
                            "Integrity is the bedrock of the Rodriguez Sanctuary. All keys are stored in your local partition and never shared with the Council cloud unless specifically requested by The Prism."
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {connectingId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl relative">
                             <div className="mb-10 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2 uppercase font-serif italic">Sealing: {connectingId}</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">Establish the cryptographic seat for this Pillar.</p>
                             </div>
                             <div className="space-y-8">
                                <div className="relative">
                                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                    <input type={showKey ? 'text' : 'password'} value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="Paste API Key string..." className="w-full bg-black border border-zinc-800 rounded-2xl py-5 pl-14 pr-14 text-white focus:border-lux-gold outline-none font-mono text-xs" autoFocus autoComplete="off" />
                                    <button onClick={() => setShowKey(!showKey)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setConnectingId(null)} className="flex-1 py-5 text-zinc-500 font-bold uppercase text-[10px]">Abort</button>
                                    <button onClick={finalizeSignal} disabled={!apiKeyInput.trim() || isTestingSignals} className="flex-[2] py-5 bg-white text-black rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] hover:bg-lux-gold">
                                        {isTestingSignals ? <Loader2 size={16} className="animate-spin" /> : 'Seal Pillar'}
                                    </button>
                                </div>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
