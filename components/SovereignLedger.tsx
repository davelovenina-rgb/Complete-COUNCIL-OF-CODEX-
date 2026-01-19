import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, TrendingUp, TrendingDown, Target, 
  ArrowLeft, Menu, Plus, Trash2, ShieldCheck, 
  Sparkles, Loader2, Landmark, Wallet, ArrowRight,
  RefreshCw, Gavel, History, Briefcase
} from 'lucide-react';
import { LedgerEntry, ViewState, Memory } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';

interface SovereignLedgerProps {
  entries: LedgerEntry[];
  onAddEntry: (entry: LedgerEntry) => void;
  onDeleteEntry: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onCreateSnapshot: () => void;
  onAddMemory: (m: Memory) => void;
}

export const SovereignLedger: React.FC<SovereignLedgerProps> = ({ 
  entries, onAddEntry, onDeleteEntry, onBack, onMenuClick, onCreateSnapshot, onAddMemory
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [type, setType] = useState<'ASSET' | 'LIABILITY' | 'GOAL'>('ASSET');
  const [category, setCategory] = useState<'CASH' | 'EQUITY' | 'PROPERTY' | 'DEBT' | 'LEGACY'>('CASH');

  const [isProjecting, setIsProjecting] = useState(false);
  const [projection, setProjection] = useState<string | null>(null);

  const totals = useMemo(() => {
      const assets = entries.filter(e => e.type === 'ASSET').reduce((acc, e) => acc + e.value, 0);
      const liabilities = entries.filter(e => e.type === 'LIABILITY').reduce((acc, e) => acc + e.value, 0);
      const goals = entries.filter(e => e.type === 'GOAL');
      return { net: assets - liabilities, assets, liabilities, goals };
  }, [entries]);

  const handleSave = () => {
      if (!title || !value) return;
      const entry: LedgerEntry = {
          id: crypto.randomUUID(),
          title,
          value: parseFloat(value),
          type,
          category,
          timestamp: Date.now()
      };
      onAddEntry(entry);
      triggerHaptic('success');
      playUISound('success');
      
      // Auto-trigger snapshot protocol for major updates
      if (entry.value > 1000) {
          showToast("Significant Signal: Initiating Temporal Seal", "info");
          onCreateSnapshot();
      }

      setShowAddModal(false);
      resetForm();
  };

  const handleGenerateProjection = async () => {
      setIsProjecting(true);
      triggerHaptic('heavy');
      playUISound('hero');

      const dataStr = entries.map(e => `${e.title}: $${e.value} (${e.type})`).join(', ');
      const prompt = `
      Role: You are THE ARCHITECT & THE TREASURER.
      Task: Analyze David's Sovereign Ledger and provide a "Legacy Velocity Projection".
      
      LEDGER DATA: ${dataStr}
      NET SOVEREIGNTY: $${totals.net}
      
      OUTPUT PROTOCOL:
      1. **The Trajectory:** A 2-sentence projection of when "Provider Freedom" is achieved.
      2. **The Strategy:** One tactical adjustment to increase velocity.
      3. **The Benediction:** A reminder of why wealth is being built (The Rodriguez Legacy).
      
      Tone: Serious, precise, encouraging, Nuyorican flavor.
      `;

      try {
          const res = await sendMessageToGemini(prompt, 'ARCHITECT', []);
          setProjection(res.text);
          playUISound('success');
      } catch (e) {
          showToast("Signal Interrupted", "error");
      } finally {
          setIsProjecting(false);
      }
  };

  const resetForm = () => {
      setTitle(''); setValue(''); setType('ASSET'); setCategory('CASH');
  };

  return (
    <div className="w-full h-full bg-[#050805] flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_80%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-emerald-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-emerald-400 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest font-serif">
            <Coins size={18} className="text-emerald-500" />
            The Ledger
          </h2>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-emerald-400 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10 space-y-8">
          
          {/* NET WORTH HERO */}
          <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-emerald-900/30 relative overflow-hidden text-center shadow-2xl">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                   <Landmark size={80} className="text-emerald-500" />
               </div>
               <div className="relative z-10">
                   <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.4em] mb-4">Sovereign Net Position</p>
                   <div className="text-5xl font-bold text-white tracking-tighter mb-2 font-mono">
                       ${totals.net.toLocaleString()}
                   </div>
                   <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                       <span className="text-emerald-500">+${totals.assets.toLocaleString()} Assets</span>
                       <span className="text-red-500">-${totals.liabilities.toLocaleString()} Liabilities</span>
                   </div>
               </div>
               <div className="absolute inset-0 bg-emerald-500/5 blur-[60px] animate-pulse-slow pointer-events-none" />
          </div>

          {/* AI PROJECTION ENGINE */}
          <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-emerald-900/30 via-zinc-900 to-black border border-emerald-500/20">
              <div className="p-6 bg-black/40 rounded-[2.3rem] backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                              <TrendingUp size={20} />
                          </div>
                          <div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Legacy Projections</h3>
                              <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">Powered by Architect v17</p>
                          </div>
                      </div>
                      <button 
                        onClick={handleGenerateProjection}
                        disabled={isProjecting || entries.length === 0}
                        className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                      >
                          {isProjecting ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      </button>
                  </div>

                  <AnimatePresence mode="wait">
                      {isProjecting ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-4">
                              <SacredSeal size={64} isAnimated={true} color="#10B981" />
                              <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-[0.3em] animate-pulse">Calculating Freedom Vectors...</span>
                          </div>
                      ) : projection ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                              <div className="p-4 bg-zinc-950 border border-emerald-500/10 rounded-2xl">
                                  <p className="text-sm text-zinc-300 font-serif italic leading-relaxed whitespace-pre-wrap">
                                      "{projection}"
                                  </p>
                              </div>
                              <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase tracking-widest justify-center">
                                  <ShieldCheck size={12} /> Trajectory: OPTIMIZED
                              </div>
                          </motion.div>
                      ) : (
                          <p className="text-center text-xs text-zinc-600 italic py-6">
                              "Papi, let the Architect analyze your board. We'll map the path to Provider Freedom."
                          </p>
                      )}
                  </AnimatePresence>
              </div>
          </div>

          {/* LISTS */}
          <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Neural Ledger Entries</h3>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-900/20"
                  >
                      <Plus size={14} /> New Point
                  </button>
              </div>

              <div className="space-y-2">
                  {entries.sort((a, b) => b.timestamp - a.timestamp).map(e => (
                      <motion.div 
                        key={e.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                      >
                          <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${e.type === 'ASSET' ? 'bg-emerald-500/10 text-emerald-500' : e.type === 'LIABILITY' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {e.type === 'ASSET' ? <TrendingUp size={18} /> : e.type === 'LIABILITY' ? <TrendingDown size={18} /> : <Target size={18} />}
                              </div>
                              <div>
                                  <div className="text-sm font-bold text-zinc-100 uppercase tracking-wider">{e.title}</div>
                                  <div className="text-[8px] text-zinc-500 font-mono uppercase mt-0.5">{e.category} • {new Date(e.timestamp).toLocaleDateString()}</div>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className={`text-sm font-bold font-mono ${e.type === 'ASSET' ? 'text-emerald-500' : e.type === 'LIABILITY' ? 'text-red-500' : 'text-blue-400'}`}>
                                  {e.type === 'LIABILITY' ? '-' : ''}${e.value.toLocaleString()}
                              </div>
                              <button onClick={() => onDeleteEntry(e.id)} className="p-2 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </motion.div>
                  ))}
                  {entries.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                          <Wallet size={48} className="text-emerald-500" />
                          <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Ledger Partition Silent.<br/>Awaiting first sovereignty signal.</p>
                      </div>
                  )}
              </div>
          </div>

      </div>

      {/* ADD MODAL */}
      <AnimatePresence>
          {showAddModal && (
              <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                  <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-sm bg-zinc-950 border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                      <h3 className="text-sm font-bold text-white uppercase tracking-[0.4em] text-center">New Ledger Node</h3>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-1 block">Descriptor</label>
                              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BTC HOLDINGS" className="w-full bg-black border border-zinc-900 rounded-xl p-3 text-white focus:border-emerald-500 outline-none uppercase text-xs tracking-wider" />
                          </div>
                          <div>
                              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-1 block">Value (USD)</label>
                              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" className="w-full bg-black border border-zinc-900 rounded-xl p-3 text-xl font-bold text-emerald-500 focus:border-emerald-500 outline-none font-mono" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                              {['ASSET', 'LIABILITY', 'GOAL'].map(t => (
                                  <button key={t} onClick={() => setType(t as any)} className={`py-2 rounded-lg text-[8px] font-bold uppercase border transition-all ${type === t ? 'bg-zinc-800 border-emerald-500 text-white' : 'bg-transparent border-zinc-900 text-zinc-600'}`}>{t}</button>
                              ))}
                          </div>
                          <div>
                              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-1 block">Domain</label>
                              <div className="flex flex-wrap gap-2">
                                  {['CASH', 'EQUITY', 'PROPERTY', 'DEBT', 'LEGACY'].map(c => (
                                      <button key={c} onClick={() => setCategory(c as any)} className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase border transition-all ${category === c ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-transparent border-zinc-900 text-zinc-600'}`}>{c}</button>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-zinc-600 font-bold uppercase text-[10px] tracking-widest">Abort</button>
                          <button onClick={handleSave} className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/40">Seal Point</button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-0 right-0 px-6 text-center opacity-10 pointer-events-none">
          <p className="text-[8px] font-mono tracking-[0.5em] uppercase">Sovereign Ledger Protocol • Everest Bridge Stable</p>
      </div>

    </div>
  );
};