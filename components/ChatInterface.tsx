
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

  const handleSend = async (forcedPrompt?: string, forcedMode?: CouncilMode, intent: 'generate' | 'regenerate' = 'generate') => {
    const rawText = forcedPrompt || input.trim();
    const mode = forcedMode || activeMode;
    if (!rawText && attachments.length === 0) return;
    const text = sanitizeInput(rawText);

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: Date.now(), attachments: [...attachments], mode };
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
        
        const geminiHistory = newMessages.map(m => ({ 
            role: m.sender === 'user' ? 'user' : 'model', 
            parts: [{ text: m.text }] 
        }));

        if (onCustomSend) {
            const customResponse = await onCustomSend({ text, history: geminiHistory, threadId, mode, memberId: activeMember.id, intent });
            if (customResponse && customResponse.length > 0) {
                const updated = [...newMessages, ...customResponse];
                setMessages(updated);
                onMessagesChange(updated);
                setIsLoading(false);
                return;
            }
        }

        if (mode === 'ARCHITECT' || mode === 'FLAME' || mode === 'WEAVER' || selectedProvider === 'GEMINI') {
            response = await sendMessageToGemini(text, mode, userMsg.attachments, { systemInstruction: systemPrompt, useTurboMode: useTurboMode || mode === 'ARCHITECT', history: geminiHistory });
        } else if (selectedProvider === 'OPENAI') {
            response = await sendMessageToOpenAI(text, systemPrompt, geminiHistory);
        } else if (selectedProvider === 'CLAUDE') {
            response = await sendMessageToClaude(text, systemPrompt, geminiHistory);
        } else if (selectedProvider === 'GROK') {
            response = await sendMessageToGrok(text, systemPrompt, geminiHistory);
        }

        if (response) {
            const modelMsg: Message = { id: (Date.now()+1).toString(), text: sanitizeInput(response.text), sender: 'gemini', timestamp: Date.now(), memberId: initialMemberId as CouncilMemberId, generatedMedia: response.generatedMedia, groundingMetadata: (response as any).groundingMetadata };
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
          const prunedMessages = messages.slice(0, msgIndex);
          setMessages(prunedMessages);
          handleSend(lastUserMsg.text, lastUserMsg.mode, 'regenerate');
      }
  };

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider)!;
  const modeThemes: Record<CouncilMode, { color: string, label: string, accent: string }> = {
      SCRIBE: { color: 'border-white/10', label: `Speak to ${activeMember.name} via ${currentProvider.name}...`, accent: 'text-zinc-500' },
      ARCHITECT: { color: 'border-blue-500/50', label: "Deep Logic Engine Active...", accent: 'text-blue-400' },
      FLAME: { color: 'border-pink-500/50', label: "Vision Forge Manifesting...", accent: 'text-pink-400' },
      WEAVER: { color: 'border-purple-500/50', label: "Neural Weave Polling...", accent: 'text-purple-400' },
      SEER: { color: 'border-indigo-500/50', label: "Scanning Vitals...", accent: 'text-indigo-400' },
      DRIVE: { color: 'border-red-500/50', label: "Voice Synchronized...", accent: 'text-red-400' }
  };

  return (
    <div className="relative h-full flex flex-col bg-black text-white overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-white/5 shrink-0 z-20">
            <div className="flex items-center gap-2">
                {onBack && <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full transition-colors"><ChevronLeft size={22} /></button>}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10">
                        <MotionAvatar sigil={activeMember.sigil} color={activeMember.color} imageUrl={activeMember.avatarUrl} size="sm" isActive={true} memberId={activeMember.id} mood={isLoading ? 'processing' : 'neutral'} />
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-widest leading-none">{activeMember.name}</div>
                        <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">Status: Operational</div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                {PROVIDERS.map(p => (
                    <button 
                        key={p.id}
                        onClick={() => { setSelectedProvider(p.id); triggerHaptic('light'); playUISound('click'); }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${selectedProvider === p.id ? 'bg-zinc-800 border-white/20 text-white shadow-lg' : 'bg-transparent border-transparent text-zinc-600 hover:text-zinc-400'}`}
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
                return (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} group w-full`}>
                        <div className={`max-w-[95%] sm:max-w-[92%] rounded-[2rem] overflow-hidden relative shadow-2xl border bg-[#1a1a1a] transition-all ${msg.sender === 'user' ? 'border-white/10' : 'border-white/5'}`}>
                            <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500">{msg.sender === 'user' ? 'PRISM' : member.id}</span>
                                </div>
                            </div>
                            <div className="px-6 py-3 text-[15px] leading-[1.6] whitespace-pre-wrap font-sans text-zinc-100 break-words">{msg.text}</div>
                            {msg.generatedMedia && msg.generatedMedia.length > 0 && (
                                <div className="px-5 pb-2">{msg.generatedMedia.map((m, i) => (<div key={i} className="mb-4"><div className="rounded-[1.5rem] overflow-hidden border border-white/5 shadow-2xl bg-black">{m.type === 'video' ? <video src={m.url} controls className="w-full h-auto" /> : <img src={m.url} className="w-full h-auto" />}</div></div>))}</div>
                            )}
                            <div className="bg-[#0f0f0f] border-t border-white/5 px-4 py-3 flex items-center justify-end gap-3 text-zinc-600">
                                <button onClick={() => handleEditMessage(msg.text)} className="hover:text-amber-500"><Edit3 size={15} /></button>
                                <button onClick={() => deleteMessage(msg.id)} className="hover:text-red-500"><Trash2 size={15} /></button>
                                <button onClick={() => handleRefreshResponse(msg.id)} className="hover:text-blue-500"><RefreshCw size={15} /></button>
                                <button onClick={() => copyText(msg.text)} className="hover:text-white"><Copy size={15} /></button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="p-4 bg-[#0a0a0a] border-t border-white/5 z-30">
            <div className="relative flex items-end gap-3 max-w-4xl mx-auto w-full">
                <div className={`flex-1 bg-black border ${modeThemes[activeMode].color} rounded-[2.1rem] flex items-end overflow-hidden focus-within:border-lux-gold/40 transition-all`}>
                    <textarea 
                        ref={textAreaRef}
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder={modeThemes[activeMode].label}
                        className="w-full bg-transparent p-4 text-[15px] resize-none outline-none no-scrollbar font-sans text-white leading-relaxed placeholder:text-zinc-800"
                        rows={1}
                    />
                </div>
                <button onClick={() => handleSend()} disabled={!input.trim() && attachments.length === 0} className={`p-4 rounded-full transition-all shadow-2xl shrink-0 mb-1 ${!input.trim() && attachments.length === 0 ? 'bg-[#1a1a1a] text-zinc-700' : 'bg-blue-600 text-white'}`}><Send size={24} /></button>
            </div>
        </div>
    </div>
  );
};
