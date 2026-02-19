
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Plus, Image as ImageIcon, Video, Mic, 
  X, Globe, Menu, Loader2, Copy, Trash2, 
  Paperclip, Download, Heart, ThumbsUp, 
  ExternalLink, Zap, Film, Brain, 
  ChevronLeft, MoreVertical, ShieldCheck, Camera,
  ThumbsDown, Flame, Lightbulb, Target, RefreshCw, Edit3, Sparkles, BookOpen, Terminal, Languages,
  MicOff, PhoneCall, Headphones, Activity, Check
} from 'lucide-react';
import { Message, Attachment, CouncilMemberId, GeneratedMedia, CouncilMode, AIProviderId, VaultItem, CustomSendArgs } from '../types';
import { sendMessageToGemini, summarizeHistory, LiveConnection, decodeAudioDataToPCM } from '../services/geminiService';
import { sendMessageToOpenAI } from '../services/openaiService';
import { sendMessageToGrok } from '../services/grokService';
import { sendMessageToClaude } from '../services/claudeService';
import { COUNCIL_MEMBERS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast } from '../utils/events';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { analyzeText } from '../utils/spanglishAnalysis';
import { sanitizeInput } from '../utils/security';
import { LiveVoiceVisualizer } from './LiveVoiceVisualizer';
import { MotionAvatar } from './MotionAvatar';

interface ChatInterfaceProps {
  initialMessages?: Message[];
  onMessagesChange: (messages: Message[]) => void;
  onMenuClick?: () => void;
  onBack?: () => void;
  initialMemberId?: CouncilMemberId;
  embeddedMode?: boolean;
  onNavigate?: (view: any, id?: string) => void;
  onSnapshot?: () => void;
  voiceName?: string;
  memories?: any[];
  vaultItems?: VaultItem[];
  healthReadings?: any[];
  projects?: any[];
  useTurboMode?: boolean;
  onEnterDriveMode?: () => void;
  onCustomSend?: (args: CustomSendArgs) => Promise<Message[]>;
  customSystemInstruction?: string;
  threadId?: string;
}

const PROVIDERS: { id: AIProviderId, name: string, icon: any, color: string }[] = [
    { id: 'GEMINI', name: 'Gemini', icon: Sparkles, color: '#3B82F6' },
    { id: 'OPENAI', name: 'OpenAI', icon: Zap, color: '#10B981' },
    { id: 'CLAUDE', name: 'Claude', icon: BookOpen, color: '#F59E0B' },
    { id: 'GROK', name: 'Grok', icon: Terminal, color: '#8B5CF6' }
];

// Added ActionMenuItem component to fix missing name error
const ActionMenuItem: React.FC<{
    icon: any;
    label: string;
    sub: string;
    onClick: () => void;
    color: string;
    active?: boolean;
}> = ({ icon: Icon, label, sub, onClick, color, active }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
    >
        <div className={`p-2 rounded-xl bg-black border border-white/5 ${color}`}>
            <Icon size={20} />
        </div>
        <div className="text-left">
            <div className="text-xs font-bold text-white uppercase tracking-wider">{label}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{sub}</div>
        </div>
    </button>
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    initialMessages = [], 
    onMessagesChange,
    onMenuClick,
    onBack,
    initialMemberId = 'GEMINI',
    useTurboMode = false,
    onEnterDriveMode,
    onCustomSend,
    customSystemInstruction,
    memories,
    projects,
    vaultItems,
    threadId
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<CouncilMode>('SCRIBE');
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>('GEMINI');
  const [showLinguisticBadge, setShowLinguisticBadge] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  const [isVoiceBridgeActive, setIsVoiceBridgeActive] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [voiceAnalyser, setVoiceAnalyser] = useState<AnalyserNode | null>(null);
  
  const liveConnectionRef = useRef<LiveConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  const activeMember = COUNCIL_MEMBERS.find(m => m.id === initialMemberId) || COUNCIL_MEMBERS[1];

  useEffect(() => {
    if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
        textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = (ev.target?.result as string).split(',')[1];
            setAttachments(prev => [...prev, {
                id: crypto.randomUUID(),
                type: file.type.startsWith('image/') ? 'image' : 'file',
                mimeType: file.type,
                url: ev.target?.result as string,
                fileName: file.name,
                data: base64
            }]);
            playUISound('click');
        };
        reader.readAsDataURL(file);
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    triggerHaptic('light');
    playUISound('click');
    showToast("Link buffered to memory");
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSend = async (forcedPrompt?: string, forcedMode?: CouncilMode, intent: 'generate' | 'regenerate' = 'generate') => {
    const rawText = forcedPrompt || input.trim();
    const mode = forcedMode || activeMode;
    
    if (!rawText && attachments.length === 0) return;
    
    const text = sanitizeInput(rawText);

    const userMsg: Message = { 
        id: Date.now().toString(), 
        text, 
        sender: 'user', 
        timestamp: Date.now(), 
        attachments: [...attachments],
        mode
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachments([]);
    setIsActionMenuOpen(false);
    setIsLoading(true);
    triggerHaptic('medium');

    try {
        let response;
        let systemPrompt = customSystemInstruction || activeMember.systemPrompt;
        
        if (newMessages.length > 0 && newMessages.length % 8 === 0) {
            showToast("Compacting Context...", "info");
            const historyForSummary = newMessages.map(m => ({ 
                role: m.sender === 'user' ? 'user' : 'model', 
                parts: [{ text: m.text }] 
            }));
            const summary = await summarizeHistory(historyForSummary);
            systemPrompt += `\n\n[TACTICAL BRIEF OF PREVIOUS CONVERSATION]:\n${summary}`;
        }

        const vaultAwareness = vaultItems?.map(v => 
            `- ${v.title} (${v.category})${v.isPrivate ? ` [PRIVATE: ${v.ownerId}]` : ''}`
        ).join('\n') || "Vault is currently empty.";

        const geminiHistory = newMessages.map(m => ({ 
            role: m.sender === 'user' ? 'user' : 'model', 
            parts: [{ text: m.text }] 
        }));

        if (onCustomSend) {
            const customResponse = await onCustomSend({
                text,
                history: geminiHistory,
                threadId,
                mode,
                memberId: activeMember.id,
                intent
            });
            if (customResponse && customResponse.length > 0) {
                const updated = [...newMessages, ...customResponse];
                setMessages(updated);
                onMessagesChange(updated);
                setIsLoading(false);
                return;
            }
        }

        if (mode === 'ARCHITECT' || mode === 'FLAME' || mode === 'WEAVER' || selectedProvider === 'GEMINI') {
            response = await sendMessageToGemini(text, mode, userMsg.attachments, { 
                systemInstruction: systemPrompt,
                useTurboMode: useTurboMode || mode === 'ARCHITECT',
                vaultAwareness,
                history: geminiHistory
            });
        } else if (selectedProvider === 'OPENAI') {
            response = await sendMessageToOpenAI(text, systemPrompt);
        } else if (selectedProvider === 'CLAUDE') {
            response = await sendMessageToClaude(text, systemPrompt);
        } else if (selectedProvider === 'GROK') {
            response = await sendMessageToGrok(text, systemPrompt);
        }

        if (response) {
            const modelMsg: Message = { 
                id: (Date.now()+1).toString(), 
                text: sanitizeInput(response.text), 
                sender: 'gemini', 
                timestamp: Date.now(), 
                memberId: initialMemberId as CouncilMemberId,
                generatedMedia: response.generatedMedia,
                groundingMetadata: (response as any).groundingMetadata
            };
            const updatedMessages = [...newMessages, modelMsg];
            setMessages(updatedMessages);
            onMessagesChange(updatedMessages);
        }
    } catch (e: any) {
        showToast(e.message || "Signal Interrupt", "error");
    } finally {
        setIsLoading(false);
        setActiveMode('SCRIBE');
    }
  };

  const startVoiceBridge = async () => {
      setIsVoiceBridgeActive(true);
      triggerHaptic('heavy');
      playUISound('hero');
      
      try {
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
          outAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
          const outAnalyser = outAudioContextRef.current.createAnalyser();
          outAnalyser.fftSize = 256;
          setVoiceAnalyser(outAnalyser);

          const vaultAwareness = vaultItems?.map(v => 
            `- ${v.title} (${v.category})${v.isPrivate ? ` [PRIVATE: ${v.ownerId}]` : ''}`
          ).join('\n') || "Vault empty.";

          liveConnectionRef.current = new LiveConnection();
          const callbacks = {
              onopen: () => showToast(`Link to ${activeMember.name} Established`),
              onAudioData: async (uint8: string) => {
                  if (outAudioContextRef.current) {
                      const buffer = await decodeAudioDataToPCM(uint8, outAudioContextRef.current, 24000, 1);
                      const source = outAudioContextRef.current.createBufferSource();
                      source.buffer = buffer;
                      source.connect(outAnalyser);
                      outAnalyser.connect(outAudioContextRef.current.destination);
                      source.start();
                  }
              },
              onclose: () => stopVoiceBridge()
          };

          await liveConnectionRef.current.connect(callbacks, {
              systemInstruction: customSystemInstruction || activeMember.systemPrompt,
              voiceName: activeMember.voiceName,
              vaultAwareness
          });

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const source = audioContextRef.current.createMediaStreamSource(stream);
          const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
              if (liveConnectionRef.current && !isVoiceMuted) {
                  liveConnectionRef.current.sendAudio(e.inputBuffer.getChannelData(0));
              }
          };

          source.connect(processor);
          processor.connect(audioContextRef.current.destination);
      } catch (e) {
          showToast("Bridge Failure", "error");
          stopVoiceBridge();
      }
  };

  const stopVoiceBridge = () => {
      if (liveConnectionRef.current) liveConnectionRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outAudioContextRef.current) outAudioContextRef.current.close();
      setIsVoiceBridgeActive(false);
      setVoiceAnalyser(null);
      triggerHaptic('medium');
  };

  const copyText = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast("Buffered to Memory");
      triggerHaptic('light');
  };

  const deleteMessage = (id: string) => {
      const updated = messages.filter(m => m.id !== id);
      setMessages(updated);
      onMessagesChange(updated);
      showToast("Entry Purged", "info");
  };

  const handleEditMessage = (text: string) => {
      setInput(text);
      textAreaRef.current?.focus();
      triggerHaptic('light');
  };

  const handleRefreshResponse = async (msgId: string) => {
      const msgIndex = messages.findIndex(m => m.id === msgId);
      if (msgIndex === -1) return;
      const lastUserMsg = [...messages].slice(0, msgIndex).reverse().find(m => m.sender === 'user');
      if (lastUserMsg) {
          triggerHaptic('heavy');
          playUISound('hero');
          const prunedMessages = messages.slice(0, msgIndex);
          setMessages(prunedMessages);
          handleSend(lastUserMsg.text, lastUserMsg.mode, 'regenerate');
      }
  };

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider)!;

  const modeThemes: Record<CouncilMode, { color: string, label: string, accent: string }> = {
      SCRIBE: { color: 'border-white/10', label: `Speak to ${activeMember.name} via ${currentProvider.name}...`, accent: 'text-zinc-500' },
      ARCHITECT: { color: 'border-blue-500/50', label: "Deep Logic Engine Active (Gemini 3 Pro)...", accent: 'text-blue-400' },
      FLAME: { color: 'border-pink-500/50', label: "Vision Forge Manifesting...", accent: 'text-pink-400' },
      WEAVER: { color: 'border-purple-500/50', label: "Neural Weave Polling...", accent: 'text-purple-400' },
      SEER: { color: 'border-indigo-500/50', label: "Scanning Vitals...", accent: 'text-indigo-400' },
      DRIVE: { color: 'border-red-500/50', label: "Voice Synchronized...", accent: 'text-red-400' }
  };

  return (
    <div className="relative h-full flex flex-col bg-black text-white overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-white/5 shrink-0 z-20">
            <div className="flex items-center gap-2">
                {onBack && (
                    <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full transition-colors"><ChevronLeft size={22} /></button>
                )}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10">
                        <MotionAvatar 
                            sigil={activeMember.sigil} 
                            color={activeMember.color} 
                            imageUrl={activeMember.avatarUrl} 
                            size="sm" 
                            isActive={true} 
                            memberId={activeMember.id}
                            mood={isLoading ? 'processing' : 'neutral'}
                        />
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-widest leading-none">{activeMember.name}</div>
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">Status: Operational</div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-1.5">
                <button onClick={() => setShowLinguisticBadge(!showLinguisticBadge)} className={`p-2 transition-colors ${showLinguisticBadge ? 'text-lux-gold' : 'text-zinc-600'}`} title="Toggle Linguistic Resonance">
                    <Languages size={18} />
                </button>
                <div className="w-px h-4 bg-white/5 mx-1" />
                {PROVIDERS.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => { setSelectedProvider(p.id); triggerHaptic('light'); playUISound('click'); }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${selectedProvider === p.id ? 'bg-zinc-800 border-white/20 text-white shadow-lg' : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400'}`}
                        title={p.name}
                    >
                        <p.icon size={14} style={{ color: selectedProvider === p.id ? p.color : undefined }} />
                    </button>
                ))}
            </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar relative">
            {messages.map((msg) => {
                const member = COUNCIL_MEMBERS.find(m => m.id === msg.memberId) || activeMember;
                const dotColor = msg.sender === 'user' ? '#3B82F6' : member.color;
                const linguistic = analyzeText(msg.text);

                return (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} group w-full`}>
                        <div className={`max-w-[95%] sm:max-w-[92%] rounded-[2rem] overflow-hidden relative shadow-2xl border bg-[#1a1a1a] transition-all ${
                            msg.sender === 'user' ? 'border-white/10' : 'border-white/5'
                        }`}>
                            
                            {msg.sender === 'gemini' && showLinguisticBadge && linguistic.spanishRatio > 0 && (
                                <div className="absolute top-0 right-0 h-full w-1 overflow-hidden pointer-events-none">
                                    <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${linguistic.spanishRatio}%` }}
                                        className="w-full bg-lux-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                                    />
                                </div>
                            )}

                            <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">
                                        {msg.sender === 'user' ? 'PRISM' : member.id}
                                    </span>
                                    {showLinguisticBadge && linguistic && linguistic.spanishRatio > 0 && (
                                        <span className="text-[8px] font-mono font-bold text-lux-gold bg-lux-gold/10 px-1.5 py-0.5 rounded-full border border-lux-gold/20 flex items-center gap-1 ml-2">
                                            <Activity size={8} className="animate-pulse" /> {linguistic.spanishRatio}% RESONANCE
                                        </span>
                                    )}
                                </div>
                                {msg.mode && msg.mode !== 'SCRIBE' && (
                                    <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-zinc-600 px-2 py-0.5 rounded-full bg-black/40 border border-white/5">{msg.mode}</span>
                                )}
                            </div>

                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="px-5 mt-2">
                                    {msg.attachments.map(a => (
                                        <div key={a.id} className="mb-3 rounded-2xl overflow-hidden border border-black/40 shadow-inner bg-black/20">
                                            {a.type === 'image' && <img src={a.url} className="w-full h-auto" alt="Attachment" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div className="px-6 py-3 text-[15px] leading-[1.6] whitespace-pre-wrap font-sans text-zinc-100 break-words overflow-hidden overflow-wrap-anywhere">
                                {msg.text}
                            </div>

                            {msg.groundingMetadata?.groundingChunks && (
                                <div className="px-6 pb-4 flex flex-wrap gap-2">
                                    {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                                        chunk.web && (
                                            <div key={i} className="flex items-center gap-0.5">
                                                <a 
                                                    href={chunk.web.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-900/20 border border-blue-500/20 rounded-l-full text-[10px] text-blue-400 hover:bg-blue-900/40 transition-colors"
                                                >
                                                    <Globe size={10} />
                                                    <span className="truncate max-w-[120px]">{chunk.web.title || "Reference"}</span>
                                                    <ExternalLink size={8} />
                                                </a>
                                                <button 
                                                    onClick={() => handleCopyUrl(chunk.web.uri)}
                                                    className={`p-1.5 border border-l-0 rounded-r-full transition-all flex items-center justify-center ${copiedUrl === chunk.web.uri ? 'bg-emerald-600/30 border-emerald-500/30 text-emerald-400' : 'bg-blue-900/30 border-blue-500/20 text-blue-500 hover:text-white hover:bg-blue-900/50'}`}
                                                    title="Copy URL"
                                                >
                                                    {copiedUrl === chunk.web.uri ? <Check size={10} /> : <Copy size={10} />}
                                                </button>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                            
                            {msg.generatedMedia && msg.generatedMedia.length > 0 && (
                                <div className="px-5 pb-2">
                                    {msg.generatedMedia.map((m, i) => (
                                        <div key={i} className="mb-4">
                                            <div className="rounded-[1.5rem] overflow-hidden border border-white/5 shadow-2xl bg-black">
                                                {m.type === 'video' ? (
                                                    <video src={m.url} controls className="w-full h-auto" />
                                                ) : (
                                                    <img src={m.url} className="w-full h-auto" alt="Neural Vision" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-[#0f0f0f] border-t border-white/5 px-4 py-3 flex flex-wrap items-center justify-between gap-y-3">
                                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                                    {["👍", "❤️", "🔥", "🙏", "💡", "🎯"].map(emoji => (
                                      <button key={emoji} className="text-base hover:scale-125 transition-transform" onClick={() => { triggerHaptic('light'); playUISound('click'); }}>{emoji}</button>
                                    ))}
                                </div>
                                
                                <div className="flex items-center gap-3 text-zinc-600 border-l border-white/10 pl-3">
                                    <button onClick={() => handleEditMessage(msg.text)} className="hover:text-amber-500 transition-colors" title="Edit"><Edit3 size={15} /></button>
                                    <button onClick={() => deleteMessage(msg.id)} className="hover:text-red-500 transition-colors" title="Purge"><Trash2 size={15} /></button>
                                    <button onClick={() => handleRefreshResponse(msg.id)} className="hover:text-blue-500 transition-colors" title="Refresh"><RefreshCw size={15} /></button>
                                    <button onClick={() => copyText(msg.text)} className="hover:text-white transition-colors" title="Copy"><Copy size={15} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            {isLoading && (
                <div className="flex items-center gap-3 p-4 text-zinc-600">
                    <div className="flex gap-1">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-mono">
                        {activeMode === 'WEAVER' ? 'Weaving Neural Motion...' : activeMode === 'FLAME' ? 'Forging Vision...' : 'Channeling Council...'}
                    </span>
                </div>
            )}
        </div>

        {isVoiceBridgeActive && (
            <div className="h-48 relative shrink-0">
                <LiveVoiceVisualizer 
                    isActive={isVoiceBridgeActive} 
                    analyser={voiceAnalyser} 
                    onClose={stopVoiceBridge} 
                    status={`${activeMember.name} Listening...`}
                    color={activeMember.color}
                />
            </div>
        )}

        <div className="p-4 bg-[#0a0a0a] border-t border-white/5 z-30">
            <div className="relative flex items-end gap-3 max-w-4xl mx-auto w-full">
                
                <div className="relative mb-1">
                    <button 
                        onClick={() => { setIsActionMenuOpen(!isActionMenuOpen); playUISound('toggle'); triggerHaptic('light'); }}
                        className={`p-3.5 rounded-full transition-all shadow-xl ${isActionMenuOpen ? 'bg-lux-gold text-black rotate-45' : 'bg-[#1a1a1a] text-zinc-500 hover:text-white'}`}
                    >
                        <Plus size={24} />
                    </button>
                    
                    <AnimatePresence>
                        {isActionMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.9 }} 
                                animate={{ opacity: 1, y: -10, scale: 1 }} 
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-16 left-0 w-64 bg-[#121212] border border-white/10 rounded-[2rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 backdrop-blur-3xl"
                            >
                                <ActionMenuItem icon={Camera} label="Reality Capture" sub="System Camera" onClick={() => { cameraInputRef.current?.click(); setIsActionMenuOpen(false); }} color="text-emerald-400" />
                                <ActionMenuItem icon={Film} label="Neural Weave" sub="Video Manifest" onClick={() => { setActiveMode('WEAVER'); setSelectedProvider('GEMINI'); setIsActionMenuOpen(false); triggerHaptic('medium'); }} color="text-purple-400" active={activeMode === 'WEAVER'} />
                                <ActionMenuItem icon={ImageIcon} label="Vision Forge" sub="Image Forge" onClick={() => { setActiveMode('FLAME'); setSelectedProvider('GEMINI'); setIsActionMenuOpen(false); triggerHaptic('medium'); }} color="text-pink-400" active={activeMode === 'FLAME'} />
                                <ActionMenuItem icon={Brain} label="Deep Logic" sub="Architect Mode" onClick={() => { setActiveMode('ARCHITECT'); setSelectedProvider('GEMINI'); setIsActionMenuOpen(false); triggerHaptic('medium'); }} color="text-blue-400" active={activeMode === 'ARCHITECT'} />
                                <div className="h-px bg-white/5 my-2 mx-4" />
                                <ActionMenuItem icon={Paperclip} label="Context Seal" sub="Attach File" onClick={() => { fileInputRef.current?.click(); setIsActionMenuOpen(false); }} color="text-zinc-500" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className={`flex-1 bg-black border ${modeThemes[activeMode].color} rounded-[2.1rem] flex items-end overflow-hidden focus-within:border-lux-gold/40 transition-all shadow-inner group min-h-[56px] relative`}>
                    <textarea 
                        ref={textAreaRef}
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder={modeThemes[activeMode].label}
                        className="w-full bg-transparent p-4 text-[15px] resize-none outline-none no-scrollbar font-sans text-white leading-relaxed placeholder:text-zinc-800"
                        rows={1}
                    />
                    <div className="pb-4 pr-5 opacity-40 flex items-center">
                         {activeMode !== 'SCRIBE' && <span className={`text-[10px] font-bold uppercase tracking-widest ${modeThemes[activeMode].accent} mr-2`}>{activeMode}</span>}
                         {input.length > 0 && <span className="text-[10px] font-mono text-lux-gold font-bold">{input.length}</span>}
                    </div>
                </div>

                <button 
                    onClick={() => handleSend()} 
                    disabled={!input.trim() && attachments.length === 0}
                    className={`p-4 rounded-full transition-all shadow-2xl shrink-0 mb-1 ${
                        !input.trim() && attachments.length === 0 
                        ? 'bg-[#1a1a1a] text-zinc-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
                    }`}
                >
                    <Send size={24} />
                </button>
            </div>
            
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
        </div>
    </div>
  );
};
