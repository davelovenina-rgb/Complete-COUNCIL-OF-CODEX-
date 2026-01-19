
import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, MessageSquare, Settings, LayoutDashboard, 
  Sun, Sparkles, Mic, BookOpen, Brain, Folder, Archive, 
  Clock, Calendar, CloudMoon, BarChart, Heart, FileText,
  Activity, Zap, User, Search, Lock, Unlock, Cpu, ShieldCheck, Scale, Landmark, Hammer, Book, ShieldAlert, Moon, Wand2, Diamond, Coins, Map, Radio, FileCode
} from 'lucide-react';
import { ViewState, Session, CouncilMember, UserSettings, Memory, VaultItem, CouncilMemberId } from '../types';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SacredSeal } from './SacredSeal';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  settings: UserSettings;
  members: CouncilMember[];
  onSelectMember: (id: CouncilMemberId) => void;
  onMemberAvatarUpload: (id: string, file: File) => void;
  onNightlySeal: () => void;
  memories: Memory[];
  vaultItems: VaultItem[];
  onToggleGuestMode: () => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  settings,
  members,
  onSelectMember,
  onMemberAvatarUpload,
  onNightlySeal,
  memories,
  vaultItems,
  onToggleGuestMode
}) => {
  const [synapseLoad, setSynapseLoad] = useState(20);

  useEffect(() => {
      const interval = setInterval(() => {
          setSynapseLoad(Math.floor(Math.random() * 30) + 15);
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  const getSealColor = () => {
      if (synapseLoad < 30) return "#10B981"; 
      if (synapseLoad < 60) return "#F59E0B"; 
      return "#EF4444"; 
  };

  const sanctuaryItems = [
    { id: ViewState.CouncilHall, label: 'The Grand Hall', icon: Landmark, show: true }, 
    { id: ViewState.CouncilChamber, label: 'The Sovereign Court', icon: Scale, show: true }, 
    { id: ViewState.EnneaSanctum, label: 'System Core', icon: ShieldCheck, show: true },
    { id: ViewState.Integrations, label: 'Signal Hub', icon: Radio, show: true },
    { id: ViewState.DiamondCore, label: 'Diamond Core', icon: Diamond, show: true },
    { id: ViewState.SovereignLedger, label: 'Sovereign Ledger', icon: Coins, show: true },
    { id: ViewState.NeuralCartography, label: 'Memory Palace', icon: Map, show: true },
    { id: ViewState.VisionaryForge, label: 'Visionary Forge', icon: Wand2, show: true },
    { id: ViewState.AtelierVisionis, label: 'Atelier Visionis', icon: Sparkles, show: true },
    { id: ViewState.NinaSanctuary, label: 'Nina Sanctuary', icon: Heart, show: settings.showNina },
    { id: ViewState.Charter, label: 'The Charter', icon: FileText, show: true },
    { id: ViewState.UserManual, label: 'User Manual', icon: Book, show: true },
    { id: ViewState.DailyProtocol, label: 'Morning Rise', icon: Sun, show: !settings.guestMode },
    { id: ViewState.LiveWhisper, label: 'Live Whisper', icon: Mic, show: !settings.guestMode },
    { id: ViewState.WeeklyReflection, label: 'Weekly Reflection', icon: BookOpen, show: !settings.guestMode },
    { id: ViewState.MemorySystem, label: 'Memory System', icon: Brain, show: !settings.guestMode },
    { id: ViewState.Projects, label: 'Flight Deck', icon: Folder, show: !settings.guestMode },
    { id: ViewState.Vault, label: 'Vault', icon: Archive, show: settings.showVault && !settings.guestMode },
    { id: ViewState.EmotionalTimeline, label: 'Emotional Timeline', icon: Clock, show: settings.showTimeline && !settings.guestMode },
    { id: ViewState.LifeEvents, label: 'Life Events', icon: Calendar, show: settings.showLifeEvents && !settings.guestMode },
    { id: ViewState.DreamOracle, label: 'Dream Oracle', icon: CloudMoon, show: settings.showDreamOracle && !settings.guestMode },
    { id: ViewState.Analytics, label: 'Analytics', icon: BarChart, show: !settings.guestMode },
    { id: ViewState.BuildManual, label: 'The Forge', icon: Hammer, show: true },
    { id: ViewState.DevBlueprint, label: 'DEV.BLUEPRINT', icon: FileCode, show: true, isSpecial: true },
  ].filter(item => item.show);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 w-80 bg-zinc-950 border-r border-zinc-900 z-50 flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <SacredSeal 
                    size={32} 
                    isAnimated={synapseLoad > 30} 
                    color={getSealColor()} 
                />
                <div>
                    <h2 className="text-sm font-bold text-lux-gold tracking-widest uppercase font-serif italic leading-none">
                        Council of Codex
                    </h2>
                    <p className="text-[0.5rem] text-zinc-500 uppercase tracking-widest mt-1 font-mono">Sanctuary Core</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* REVERENCE INDICATOR: Shell Status */}
        <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span className="text-[0.5rem] font-bold text-zinc-400 uppercase tracking-[0.2em]">Perimeter: SECURED</span>
            </div>
            <span className="text-[0.5rem] font-mono text-zinc-600">v13.22.1</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">Navigation</h3>
                <div className="space-y-1">
                    {sanctuaryItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                triggerHaptic(item.isSpecial ? 'heavy' : 'light');
                                playUISound(item.isSpecial ? 'hero' : 'click');
                                onViewChange(item.id);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                currentView === item.id 
                                ? 'bg-zinc-900 text-lux-gold font-medium border border-lux-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                                : item.isSpecial 
                                    ? 'text-lux-gold/60 border border-lux-gold/10 bg-lux-gold/5 hover:bg-lux-gold/10 hover:text-lux-gold'
                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                            }`}
                        >
                            <item.icon size={18} className={item.isSpecial ? 'animate-pulse' : ''} />
                            <span className={`text-sm ${item.isSpecial ? 'font-bold tracking-widest' : ''}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">Midnight Vigil</h3>
                <button 
                    onClick={onNightlySeal}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-indigo-400 hover:text-white hover:bg-indigo-950/30 border border-transparent hover:border-indigo-500/20 transition-all"
                >
                    <Moon size={18} />
                    <span className="text-sm font-bold uppercase tracking-widest">Seal for Night</span>
                </button>
            </div>

            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-2">The Council</h3>
                <div className="space-y-1">
                    {members.map(member => (
                        <button
                            key={member.id}
                            onClick={() => onSelectMember(member.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all"
                        >
                            <div className="w-8 h-8 rounded-full border border-zinc-800 bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                                {member.avatarUrl ? (
                                    <img src={member.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <span style={{ color: member.color }} className="text-xs font-bold">{member.sigil}</span>
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-zinc-200">{member.name}</div>
                                <div className="text-[0.5625rem] text-zinc-500 uppercase tracking-wider">{member.role}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-zinc-900">
                 <button
                    onClick={() => onViewChange(ViewState.Settings)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all"
                >
                    <Settings size={18} />
                    <span className="text-sm">Settings</span>
                </button>
                
                <button
                    onClick={() => { playUISound('toggle'); triggerHaptic('medium'); onToggleGuestMode(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        settings.guestMode 
                        ? 'bg-red-900/20 text-red-400 border border-red-900/50' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                    }`}
                >
                    {settings.guestMode ? <Unlock size={18} /> : <Lock size={18} />}
                    <span className="text-sm">{settings.guestMode ? "Unlock Sanctuary" : "Guest Mode"}</span>
                </button>
            </div>
        </div>

        <div className="p-4 border-t border-zinc-900 bg-black/50 backdrop-blur">
            <div className="flex items-center gap-3 text-zinc-500 text-[0.625rem] font-mono mb-2">
                <Cpu size={12} className="text-lux-gold animate-pulse" />
                <span className="tracking-widest">SYNAPSE LOAD</span>
                <span className="ml-auto text-lux-gold font-bold">{synapseLoad}%</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-lux-gold" 
                    animate={{ width: `${synapseLoad}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <div className="flex justify-between items-center mt-2 text-[0.5625rem] text-zinc-600">
                <span>MEM: {memories.length} BLOCKS</span>
                <span className="flex items-center gap-1 text-emerald-500 font-bold tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    ONLINE
                </span>
            </div>
        </div>
      </motion.div>
    </>
  );
};

export const Sidebar = memo(SidebarComponent);
