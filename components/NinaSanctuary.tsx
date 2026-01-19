
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Upload, X, Menu, ArrowLeft, Camera, Trash2, Flame, Mic, Sparkles, Wand2, PlayCircle, Loader2, Save, AudioLines, Tag, Volume2, History, ShieldCheck, Square } from 'lucide-react';
import { CompanionMemory, Memory, GeneratedMedia } from '../types';
import { saveAsset, getAsset } from '../utils/db';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { compressImage } from '../utils/imageUtils'; 
import { transcribeAudio, sendMessageToGemini } from '../services/geminiService';
import { AudioPlayer } from './AudioPlayer';
import { showToast } from '../utils/events';
import { SPIRITUAL_TAGS } from '../constants';
import { SacredSeal } from './SacredSeal';

interface NinaSanctuaryProps {
  memories: CompanionMemory[];
  onAddMemory: (memory: CompanionMemory) => void;
  onDeleteMemory: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onLogRitual: (memory: Memory) => void;
}

const RosePetals: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-rose-500/20 rounded-full blur-[1px]"
                    style={{
                        width: Math.random() * 8 + 4 + 'px',
                        height: Math.random() * 8 + 4 + 'px',
                        left: Math.random() * 100 + '%',
                        top: -20
                    }}
                    animate={{
                        y: ['0vh', '100vh'],
                        x: [0, Math.random() * 50 - 25],
                        rotate: [0, 360],
                        opacity: [0, 0.8, 0]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        delay: Math.random() * 10,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

// --- NEW EMBER VISUALIZER COMPONENT ---
const GardenEmbers: React.FC<{ volume: number }> = ({ volume }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<any[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const createParticle = () => {
            return {
                x: Math.random() * canvas.width,
                y: canvas.height + 20,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1 + (volume * 10),
                opacity: Math.random() * 0.5 + 0.2,
                color: Math.random() > 0.5 ? '#f97316' : '#fbbf24',
                vx: (Math.random() - 0.5) * 2
            };
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Add particles based on volume
            const count = Math.floor(volume * 20) + 1;
            for(let i = 0; i < count; i++) {
                if (particles.current.length < 200) {
                    particles.current.push(createParticle());
                }
            }

            particles.current.forEach((p, i) => {
                p.y -= p.speed;
                p.x += p.vx;
                p.opacity -= 0.005;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 + volume * 2), 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fill();

                if (p.y < -20 || p.opacity <= 0) {
                    particles.current.splice(i, 1);
                }
            });

            requestAnimationFrame(animate);
        };

        const handle = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(handle);
            window.removeEventListener('resize', resize);
        };
    }, [volume]);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
};

export const NinaSanctuary: React.FC<NinaSanctuaryProps> = ({ 
  memories, 
  onAddMemory, 
  onDeleteMemory, 
  onBack, 
  onMenuClick,
  onLogRitual
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('Nina');
  const [caption, setCaption] = useState('');
  const [selectedTag, setSelectedTag] = useState(SPIRITUAL_TAGS[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCandleLit, setIsCandleLit] = useState(false);
  
  // Whisper State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [pendingWhisper, setPendingWhisper] = useState<{ text: string, audioUrl: string, base64: string } | null>(null);
  const [whisperHistory, setWhisperHistory] = useState<{ id: string, text: string, audioUrl?: string, timestamp: number }[]>([]);
  
  // Sanctification State
  const [isSanctifying, setIsSanctifying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Dream Weaver State
  const [isWeaving, setIsWeaving] = useState(false);
  const [shimmerIndex, setShimmerIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const lit = sessionStorage.getItem('nina_candle_lit');
      if (lit) setIsCandleLit(true);

      const shimmerLoop = setInterval(() => {
          if (memories.length > 0) {
              setShimmerIndex(Math.floor(Math.random() * memories.length));
              setTimeout(() => setShimmerIndex(null), 3000);
          }
      }, 10000);
      return () => clearInterval(shimmerLoop);
  }, [memories]);

  const handleLightCandle = () => {
      if (isCandleLit) return;
      triggerHaptic('success');
      playUISound('hero');
      setIsCandleLit(true);
      sessionStorage.setItem('nina_candle_lit', 'true');
      const memory: Memory = {
          id: crypto.randomUUID(),
          category: 'SPIRITUAL',
          content: `[RITUAL]: Lit a candle in the Eternal Garden for the beloved.`,
          source: 'Nina Sanctuary',
          timestamp: Date.now(),
          isVerified: true
      };
      onLogRitual(memory);
  };

  const handleWeaveDream = async (mem: CompanionMemory) => {
      setIsWeaving(true);
      triggerHaptic('heavy');
      playUISound('hero');
      showToast("Lyra is weaving a dream...", "info");

      try {
          const prompt = `
          Generate a "Sacred Dream Vision" for David.
          Subject: His beloved companion ${mem.name}.
          Memory Context: "${mem.caption}"
          Style: Ethereal, oil painting, soft lighting, divine Puerto Rican garden background, high quality, cinematic.
          Instruction: Create a sense of peace, reunion, and eternal presence.
          `;
          
          const response = await sendMessageToGemini(prompt, 'FLAME', [], { imageSize: '2K', aspectRatio: '1:1' });
          if (response.generatedMedia && response.generatedMedia.length > 0) {
              const dreamUrl = response.generatedMedia[0].url;
              const newMem: CompanionMemory = {
                  id: crypto.randomUUID(),
                  name: `Dream of ${mem.name}`,
                  caption: `A vision woven on ${new Date().toLocaleDateString()}.`,
                  imageUrl: dreamUrl,
                  timestamp: Date.now(),
                  assetKey: `dream_${Date.now()}`,
                  spiritualTag: 'Eternidad'
              };
              onAddMemory(newMem);
              showToast("Dream Manifested", "success");
              playUISound('success');
          }
      } catch (e) {
          showToast("Dream weaving failed", "error");
      } finally {
          setIsWeaving(false);
      }
  };

  const stopWhisperRecording = useCallback(() => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (audioCtxRef.current) audioCtxRef.current.close();
          setVoiceVolume(0);
          triggerHaptic('medium');
      }
  }, [isRecording]);

  const handleWhisper = async () => {
      if (isRecording) {
          stopWhisperRecording();
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              
              // Setup volume analysis
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const analyser = audioCtx.createAnalyser();
              const source = audioCtx.createMediaStreamSource(stream);
              source.connect(analyser);
              analyser.fftSize = 256;
              audioCtxRef.current = audioCtx;
              analyserRef.current = analyser;

              const bufferLength = analyser.frequencyBinCount;
              const dataArray = new Uint8Array(bufferLength);

              const updateVolume = () => {
                  if (!isRecording && !mediaRecorderRef.current) return;
                  analyser.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for(let i = 0; i < bufferLength; i++) {
                      sum += dataArray[i];
                  }
                  setVoiceVolume(sum / bufferLength / 255);
                  if (mediaRecorderRef.current?.state === 'recording') {
                      requestAnimationFrame(updateVolume);
                  }
              };

              const recorder = new MediaRecorder(stream);
              chunksRef.current = [];
              recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
              
              recorder.onstop = async () => {
                  setIsProcessing(true);
                  const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                  const audioUrl = URL.createObjectURL(blob);
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                      const base64 = (reader.result as string).split(',')[1];
                      try {
                          const text = await transcribeAudio(base64, 'audio/webm');
                          setPendingWhisper({ text, audioUrl, base64 });
                          setIsProcessing(false);
                          playUISound('success');
                      } catch (e) { 
                          setIsProcessing(false);
                          showToast("Transcription silent", "error");
                      }
                  };
                  reader.readAsDataURL(blob);
                  stream.getTracks().forEach(t => t.stop());
              };

              mediaRecorderRef.current = recorder;
              recorder.start();
              setIsRecording(true);
              triggerHaptic('success');
              playUISound('toggle');
              updateVolume();
          } catch (e) {
              alert("Microphone needed to whisper.");
          }
      }
  };

  const finalizeWhisper = () => {
      if (!pendingWhisper) return;
      
      setIsSanctifying(true);
      triggerHaptic('heartbeat');
      playUISound('hero');

      setTimeout(() => {
          const { text, audioUrl } = pendingWhisper;
          setWhisperHistory(prev => [{ id: crypto.randomUUID(), text, audioUrl, timestamp: Date.now() }, ...prev]);
          
          const mem: Memory = {
              id: crypto.randomUUID(),
              category: 'RELATIONSHIPS',
              content: `[WHISPER TO ${name.toUpperCase()}]: "${text}"`,
              source: 'Eternal Garden',
              timestamp: Date.now(),
              isVerified: true
          };
          onLogRitual(mem);
          setPendingWhisper(null);
          setIsSanctifying(false);
          showToast("Whisper Sealed in the Archive", "success");
          triggerHaptic('success');
          playUISound('success');
      }, 3000);
  };

  const discardWhisper = () => {
      setPendingWhisper(null);
      showToast("Whisper Released", "info");
      triggerHaptic('light');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const handleSave = async () => {
      if (!name || !selectedFile) return;
      playUISound('success');
      triggerHaptic('success');
      try {
          const assetKey = `companion_${Date.now()}_${selectedFile.name}`;
          let fileToSave: Blob | File = selectedFile;
          try { fileToSave = await compressImage(selectedFile); } catch (e) {}
          await saveAsset(assetKey, fileToSave);
          const objectUrl = URL.createObjectURL(fileToSave);
          const newMemory: CompanionMemory = {
              id: crypto.randomUUID(),
              name,
              caption,
              imageUrl: objectUrl,
              timestamp: Date.now(),
              assetKey,
              spiritualTag: selectedTag
          };
          onAddMemory(newMemory);
          closeModal();
      } catch (e) { triggerHaptic('error'); }
  };

  const closeModal = () => {
      setShowAddModal(false);
      setName('Nina'); 
      setCaption('');
      setSelectedFile(null);
  };

  return (
    <div className="w-full h-full bg-[#0a0505] flex flex-col relative overflow-hidden font-sans">
      
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-black to-black pointer-events-none z-0" />
      <RosePetals />
      
      {isRecording && <GardenEmbers volume={voiceVolume} />}

      <div className="px-4 py-3 border-b border-rose-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-rose-200/50 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-rose-100 flex items-center gap-2">
              <Heart size={18} className="text-rose-500 fill-rose-500" />
              The Neural Garden
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-rose-200/50 hover:text-white rounded-full transition-colors">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
        
        <div className="w-full max-w-[400px] mx-auto mb-10 p-1 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="p-4 flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-rose-500" />
                <span className="text-[0.6rem] font-bold text-zinc-500 uppercase tracking-[0.3em]">Sanctuary Integrity Confirmed</span>
            </div>
        </div>

        <div className="w-full max-w-lg mx-auto mb-10 text-center relative group">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] transition-all duration-1000 ${isCandleLit ? 'bg-orange-500/20' : 'bg-transparent'}`} />
            
            <button onClick={handleLightCandle} className="relative z-10 flex flex-col items-center justify-center gap-4 py-8 w-full">
                <div className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${isCandleLit ? 'border-orange-500/50 bg-orange-950/30 shadow-[0_0_30px_rgba(249,115,22,0.3)]' : 'border-rose-900/30 bg-black'}`}>
                    <Flame size={isCandleLit ? 40 : 32} className={`transition-all duration-700 ${isCandleLit ? 'text-orange-500 animate-pulse' : 'text-zinc-700'}`} fill={isCandleLit ? "currentColor" : "none"} />
                </div>
                <div>
                    <h3 className={`text-xl font-serif italic transition-colors ${isCandleLit ? 'text-orange-200' : 'text-zinc-600'}`}>
                        {isCandleLit ? "The flame burns eternal." : "Light a candle for them."}
                    </h3>
                </div>
            </button>
        </div>

        <div className="flex flex-col items-center gap-4 mb-10">
            <div className="flex justify-center gap-4">
                {!isRecording && (
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-3 bg-rose-900/20 hover:bg-rose-900/40 text-rose-200 rounded-full border border-rose-800/50 transition-colors text-xs font-bold uppercase tracking-widest">
                        <Plus size={14} /> Add Relic
                    </button>
                )}
                
                <button 
                    onClick={isRecording ? stopWhisperRecording : handleWhisper} 
                    disabled={isProcessing} 
                    className={`flex items-center gap-2 px-6 py-3 rounded-full border transition-all text-xs font-bold uppercase tracking-widest ${isRecording ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white'}`}
                >
                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : isRecording ? <Square size={14} fill="white" /> : <Mic size={14} />} 
                    {isRecording ? "Stop Recording" : "Heart Echo"}
                </button>
            </div>
            
            <AnimatePresence>
                {isRecording && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mt-4">
                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-[0.5em] animate-pulse">Channeling Embers...</p>
                    </motion.div>
                )}

                {pendingWhisper && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-md">
                        <div className="p-6 bg-zinc-900/80 backdrop-blur-xl border border-rose-500/30 rounded-3xl shadow-2xl overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <History size={48} className="text-rose-500" />
                             </div>
                             
                             <div className="flex items-center gap-2 text-[10px] text-rose-400 font-bold uppercase tracking-widest mb-4">
                                {isSanctifying ? (
                                    <><Loader2 size={12} className="animate-spin" /> Sanctifying Whisper...</>
                                ) : (
                                    <><Sparkles size={12} /> Sanctuary Buffer: Review Echo</>
                                )}
                             </div>

                             <p className="text-sm text-zinc-100 font-serif italic mb-6 leading-relaxed">"{pendingWhisper.text}"</p>
                             <AudioPlayer src={pendingWhisper.audioUrl} className="bg-black/40 border-rose-500/10 mb-6" />
                             
                             <div className="flex gap-3">
                                 <button 
                                    onClick={discardWhisper} 
                                    disabled={isSanctifying}
                                    className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-700 disabled:opacity-50"
                                 >
                                    <Trash2 size={12} /> Discard
                                 </button>
                                 <button 
                                    onClick={finalizeWhisper} 
                                    disabled={isSanctifying}
                                    className="flex-[2] py-3 bg-rose-600 text-white font-bold rounded-xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 hover:bg-rose-500 transition-all disabled:opacity-50"
                                 >
                                    {isSanctifying ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} 
                                    {isSanctifying ? "COMMITTING..." : "Final Seal"}
                                 </button>
                             </div>
                        </div>
                    </motion.div>
                )}

                {whisperHistory.length > 0 && !pendingWhisper && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-2">
                        {whisperHistory.slice(0, 1).map(w => (
                            <div key={w.id} className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                                    <AudioLines size={12} /> New Echo • {new Date(w.timestamp).toLocaleTimeString()}
                                </div>
                                <p className="text-sm text-zinc-300 italic mb-3">"{w.text}"</p>
                                {w.audioUrl && <AudioPlayer src={w.audioUrl} className="bg-black/40 border-none" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="columns-2 md:columns-3 gap-4 space-y-4 max-w-5xl mx-auto">
            {memories.map((mem, i) => (
                <motion.div 
                    key={mem.id} 
                    animate={shimmerIndex === i ? { boxShadow: '0 0 20px rgba(225,29,72,0.3)', scale: 1.02 } : { scale: 1 }}
                    className="break-inside-avoid relative group rounded-2xl overflow-hidden mb-4 border border-white/5"
                >
                    <img src={mem.imageUrl} alt={mem.name} className="w-full h-auto object-cover brightness-[0.8] group-hover:brightness-105 transition-all duration-500" />
                    
                    {mem.spiritualTag && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-rose-500/20 text-[8px] font-bold text-rose-200 uppercase tracking-[0.2em] flex items-center gap-1.5 z-20">
                            <Sparkles size={8} className="text-rose-400" />
                            {mem.spiritualTag}
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-rose-100 font-bold text-sm tracking-wide">{mem.name}</h3>
                        <p className="text-rose-200/70 text-xs line-clamp-2 mt-1 font-serif italic">"{mem.caption}"</p>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => handleWeaveDream(mem)} disabled={isWeaving} className="flex-1 py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                {isWeaving ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Weave Dream
                            </button>
                            <button onClick={() => confirm('Remove relic?') && onDeleteMemory(mem.id)} className="p-2 bg-red-950/40 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    {shimmerIndex === i && (
                        <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse" />
                    )}
                </motion.div>
            ))}
        </div>

        {memories.length === 0 && (
            <div className="text-center py-20 opacity-40">
                <Heart size={32} className="mx-auto text-rose-900 mb-2" />
                <p className="text-rose-200/50 text-xs italic">"No memory is ever lost when kept in the Garden."</p>
            </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-md bg-zinc-950 rounded-3xl border border-zinc-800 p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white font-serif italic">Memory of Love</h3>
                        <button onClick={closeModal} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                        <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video rounded-2xl bg-black border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/50 transition-colors overflow-hidden relative group">
                            {selectedFile ? <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" /> : <div className="text-center"><Camera size={24} className="mx-auto text-zinc-700 mb-2" /><span className="text-xs text-zinc-500">Tap to upload photo</span></div>}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                        </div>
                        
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-wider">Spiritual Essence</label>
                            <div className="flex flex-wrap gap-2">
                                {SPIRITUAL_TAGS.map(t => (
                                    <button 
                                        key={t} 
                                        onClick={() => setSelectedTag(t)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${selectedTag === t ? 'bg-rose-500 text-white border-rose-500 shadow-lg' : 'bg-black text-zinc-600 border-zinc-800 hover:border-zinc-700'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-wider">Name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-wider">Memory</label>
                            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-rose-500 outline-none h-24 resize-none" placeholder="What do you remember?" />
                        </div>
                        <button onClick={handleSave} disabled={!name || !selectedFile} className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-xs ${!name || !selectedFile ? 'bg-zinc-900 text-zinc-600' : 'bg-rose-700 text-white shadow-lg'}`}>Seal Memory</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
