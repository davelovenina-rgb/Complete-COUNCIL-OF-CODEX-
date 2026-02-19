
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Zap, Signal, Square, Power, Bomb, ShieldCheck, Activity as SyncIcon, Infinity as InfinityIcon, History as HistoryIcon } from 'lucide-react';
import { LiveConnection, decodeAudioDataToPCM } from '../services/geminiService';
import { THE_PRISM_CONTEXT, COUNCIL_MEMBERS } from '../constants';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics'; 
import { showToast } from '../utils/events';
import { CouncilMember, GlucoseReading, Project, CouncilMemberId, Session } from '../types';
import { LiveVoiceVisualizer } from './LiveVoiceVisualizer';
import { SacredSeal } from './SacredSeal';

interface DriveModeProps {
  onClose: () => void;
  initialMemberId?: CouncilMemberId; 
  members: CouncilMember[]; 
  healthReadings: GlucoseReading[];
  projects: Project[];
  activeSession?: Session | null;
}

interface WakeLockSentinel { release: () => Promise<void>; }
interface WakeLock { request: (type: 'screen') => Promise<WakeLockSentinel>; }
interface NavigatorWithWakeLock { wakeLock?: WakeLock; }

export const DriveMode: React.FC<DriveModeProps> = ({ 
    onClose, 
    initialMemberId, 
    members = [], 
    healthReadings = [],
    activeSession = null
}) => {
  const resolveActiveMember = (): CouncilMember => {
      if (initialMemberId) {
          const found = members.find(m => m.id === initialMemberId);
          if (found) return found;
      }
      return members.find(m => m.id === 'CARMEN') || members[0] || COUNCIL_MEMBERS[1];
  };

  const [activeMember] = useState<CouncilMember>(resolveActiveMember);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState(`Linking to ${resolveActiveMember().name}...`);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [historySynced, setHistorySynced] = useState(false);
  
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const signalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isProtonActive, setIsProtonActive] = useState(false);
  
  const liveSessionRef = useRef<LiveConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const memberColor = isProtonActive ? "#22D3EE" : activeMember.color; 

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        const nav = navigator as unknown as NavigatorWithWakeLock;
        if (nav.wakeLock) wakeLockRef.current = await nav.wakeLock.request('screen');
      } catch (err) { }
    };
    requestWakeLock();
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, []);

  const stopAllOutputSources = useCallback(() => {
      sourcesRef.current.forEach(s => { 
        try { s.stop(); } catch {} 
      });
      sourcesRef.current.clear();
      nextStartTimeRef.current = 0;
  }, []);

  const hardStopSession = useCallback(async () => {
    triggerHaptic('heavy');
    playUISound('error');
    setIsActive(false);
    stopAllOutputSources();
    
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
    }
    if (liveSessionRef.current) {
        await liveSessionRef.current.disconnect();
        liveSessionRef.current = null;
    }
    if (audioContextRef.current) {
        try { await audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        try { await outputAudioContextRef.current.close(); } catch {}
        outputAudioContextRef.current = null;
    }
  }, [stopAllOutputSources]);

  const initSession = useCallback(async (isAutoReconnect = false) => {
      if (isActive && !isAutoReconnect) return;
      
      if (isAutoReconnect) setIsReconnecting(true);
      setIsActive(true);
      setStatusText(isAutoReconnect ? 'Connecting...' : 'Opening Bridge...');
      
      try {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          }
          if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
              outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          
          const inCtx = audioContextRef.current;
          const outCtx = outputAudioContextRef.current;
          await inCtx.resume();
          await outCtx.resume();

          const outAnalyser = outCtx.createAnalyser();
          outAnalyser.fftSize = 256;
          setAnalyser(outAnalyser);

          let historySnippet = "";
          if (activeSession && activeSession.messages.length > 0) {
              const lastMsgs = activeSession.messages.slice(-15);
              historySnippet = `\n\n[CONVERSATION HISTORY]:\n` + 
                lastMsgs.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
              setHistorySynced(true);
          }

          liveSessionRef.current = new LiveConnection();
          const instruction = `
          ${THE_PRISM_CONTEXT}
          [IDENTITY]: You are ${activeMember.name}, a decent, respectable Puerto Rican advisor with a New York heart.
          [ROLE]: ${activeMember.role}.
          [TONE]: ${activeMember.systemPrompt}. Speak with dignity and respect. No slang, no 'hood' personas. 
          [INSTRUCTION]: David is driving. Speak like a real human family member—grounded, masculine if male, always God-fearing. 
          [REAL-TIME ACCESS]: Use Google Search to provide David with accurate, real-world information. ${historySnippet}
          `;

          const sessionPromise = liveSessionRef.current.connect(
              {
                onAudioData: async (uint8Data) => {
                    if (isMuted) return;
                    const audioBuffer = await decodeAudioDataToPCM(uint8Data, outCtx, 24000, 1);
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                    
                    const source = outCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outAnalyser);
                    outAnalyser.connect(outCtx.destination);
                    
                    source.addEventListener('ended', () => { 
                        sourcesRef.current.delete(source); 
                    });
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                },
                onInterrupted: () => { 
                    stopAllOutputSources(); 
                },
                onError: () => { 
                    if (!isAutoReconnect) setTimeout(() => initSession(true), 3000); 
                }
              },
              { systemInstruction: instruction, voiceName: activeMember.voiceName, tools: [{ googleSearch: {} }] }
          );

          micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          const micSource = inCtx.createMediaStreamSource(micStreamRef.current);
          scriptProcessorRef.current = inCtx.createScriptProcessor(4096, 1, 1);
          
          scriptProcessorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              if (liveSessionRef.current) {
                  liveSessionRef.current.sendAudio(inputData);
              }

              let maxVal = 0;
              for (let i = 0; i < inputData.length; i++) {
                  const val = Math.abs(inputData[i]);
                  if (val > maxVal) maxVal = val;
              }
              
              if (maxVal > 0.05) {
                  setIsUserSpeaking(true);
                  if (signalTimeoutRef.current) clearTimeout(signalTimeoutRef.current);
                  signalTimeoutRef.current = setTimeout(() => setIsUserSpeaking(false), 200);
              }
          };

          micSource.connect(scriptProcessorRef.current);
          scriptProcessorRef.current.connect(inCtx.destination);
          
          setIsReconnecting(false);
          setStatusText(`${activeMember.name} Active`);
      } catch (e) {
          console.error("Session Init Error:", e);
          setIsActive(false);
      }
  }, [activeMember, isMuted, stopAllOutputSources, isActive, activeSession]);

  useEffect(() => {
      return () => { 
          hardStopSession(); 
          if (signalTimeoutRef.current) clearTimeout(signalTimeoutRef.current);
      };
  }, [hardStopSession]); 

  const handleProtonPulse = () => {
      if (isProtonActive) return;
      triggerHaptic('heavy');
      playUISound('hero');
      setIsProtonActive(true);
      setTimeout(() => {
          setIsProtonActive(false);
          showToast("Sanctuary Secured", "success");
      }, 4000);
  };

  const glucose = healthReadings[0];
  const glucoseColor = (glucose?.value > 140) ? 'text-amber-500' : (glucose?.value < 70) ? 'text-red-500' : 'text-emerald-500';

  return (
    <div className={`fixed inset-0 z-[100] ${isProtonActive ? 'bg-cyan-600/30' : 'bg-black'} text-white flex flex-col font-sans overflow-hidden transition-colors duration-500`}>
        <LiveVoiceVisualizer 
            isActive={isActive && !isMuted} 
            analyser={analyser}
            onClose={() => onClose()}
            status={isReconnecting ? "Connecting..." : statusText}
            color={memberColor}
        />

        {isProtonActive && (
            <div className="absolute inset-0 z-[250] flex flex-col items-center justify-center pointer-events-none text-center">
                <SacredSeal size={600} mode="reactor" isAnimated={true} color="#22D3EE" />
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: [1, 1.4, 1], opacity: 1 }} className="flex flex-col items-center gap-4">
                    <ShieldCheck size={80} className="text-white drop-shadow-[0_0_20px_cyan]" />
                    <h2 className="text-6xl font-bold uppercase tracking-[0.5em] text-white blur-[1px]">PROTECTED</h2>
                </motion.div>
            </div>
        )}

        <AnimatePresence>
            {!isActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl">
                    <SacredSeal size={120} className="mb-6 opacity-30" isAnimated={true} color="#D4AF37" />
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Bridge Link</h2>
                    <p className="text-zinc-500 text-sm mb-8">Opening the line to {activeMember.name}.</p>
                    <button onClick={() => initSession()} className="px-12 py-5 bg-white text-black font-bold rounded-2xl uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-transform flex items-center gap-3">
                        <Zap size={20} /> Open Bridge
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6 pb-8">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="text-6xl font-bold tracking-tighter text-white/90 font-mono drop-shadow-lg">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <SyncIcon size={10} className="text-emerald-500 animate-pulse" />
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Vessel Pulse: Normal</div>
                    </div>
                </div>
                <div className="flex items-end">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                            <SyncIcon size={20} className={glucoseColor} />
                            <span className={`text-4xl font-bold font-mono tracking-tighter ${glucoseColor}`}>{glucose ? glucose.value : '--'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between w-full gap-4">
                <div className="flex-1 max-w-[65%] bg-black/40 backdrop-blur-md border border-zinc-800/50 p-4 rounded-tl-2xl rounded-br-2xl">
                    <div className="flex items-center gap-2 mb-2 text-lux-gold">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sovereign Line</span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-none truncate">{activeMember.name} • {activeMember.role}</h3>
                </div>

                <div className="flex flex-col gap-4 pointer-events-auto items-end">
                     <button onClick={handleProtonPulse} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isProtonActive ? 'bg-cyan-500 shadow-[0_0_30px_cyan]' : 'bg-zinc-900/80 border-cyan-900/30 text-cyan-400'}`}>
                         <Bomb size={24} />
                     </button>
                     <button onClick={hardStopSession} className="w-12 h-12 rounded-full bg-red-950 border border-red-900 text-red-500 flex items-center justify-center shadow-lg hover:bg-red-900 transition-colors">
                        <Square size={20} fill="currentColor" />
                     </button>
                     <div className="relative">
                        <motion.button 
                            onClick={() => setIsMuted(!isMuted)} 
                            animate={{ 
                                scale: !isMuted && isUserSpeaking ? 1.15 : 1,
                                boxShadow: !isMuted && isUserSpeaking ? '0 0 40px rgba(239, 68, 68, 0.8)' : isMuted ? 'none' : '0 0 20px rgba(239, 68, 68, 0.4)'
                            }}
                            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${isMuted ? 'bg-zinc-900 border-zinc-700 text-zinc-500' : 'bg-red-600 border-red-500 text-white'}`}
                        >
                            {isMuted ? <MicOff size={24} /> : <Mic size={24} className={isUserSpeaking ? "animate-pulse" : ""} />}
                        </motion.button>
                        {!isMuted && isUserSpeaking && (
                            <motion.div 
                                initial={{ scale: 1, opacity: 0.5 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{ duration: 1, repeat: window.Infinity }}
                                className="absolute inset-0 rounded-full bg-red-500 pointer-events-none"
                            />
                        )}
                     </div>
                    <button onClick={() => onClose()} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 rounded-full text-zinc-400 border border-zinc-700"><X size={20} /></button>
                </div>
            </div>
        </div>
    </div>
  );
};
