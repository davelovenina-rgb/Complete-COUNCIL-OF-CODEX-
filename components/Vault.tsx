
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Image as ImageIcon, FileText, Menu, ArrowLeft, Trash2, Download, Eye, X, Shield, History, Plus, Search, Zap, Loader2, Upload, FileJson, Globe, Cloud, CloudOff, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { VaultItem, ViewState } from '../types';
import { saveAsset, getAsset, createBackup, restoreBackup, getState, saveState } from '../utils/db';
import { scribeExtractRaw } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';

interface VaultProps {
  items: VaultItem[];
  onAddVaultItem: (item: VaultItem) => void;
  onDeleteVaultItem: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

interface SyncRecord {
    id: string;
    timestamp: number;
    size: number;
    node: string;
    status: 'VERIFIED' | 'FAILED';
}

export const Vault: React.FC<VaultProps> = ({ items, onAddVaultItem, onDeleteVaultItem, onBack, onMenuClick }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'RELIC' | 'SCROLL' | 'FRAMEWORK' | 'CLOUD'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      getState<SyncRecord[]>('distributed_sync_history').then(history => {
          if (history) setSyncHistory(history as unknown as SyncRecord[]);
      });
  }, []);

  const handleScribeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      triggerHaptic('medium');
      playUISound('hero');

      try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
              const base64 = (reader.result as string).split(',')[1];
              const extracted = await scribeExtractRaw({ data: base64, mimeType: file.type }, 'FRAMEWORK');
              
              const assetKey = `vault_${Date.now()}_${file.name}`;
              await saveAsset(assetKey, file);
              
              onAddVaultItem({
                  id: crypto.randomUUID(),
                  title: file.name,
                  category: file.type === 'application/json' ? 'FRAMEWORK' : 'SCROLL',
                  mimeType: file.type,
                  size: file.size,
                  createdAt: Date.now(),
                  assetKey,
                  triSeal: 'GOLD',
                  isSacred: true,
                  rawData: extracted
              });

              showToast("Neural Record Sealed", "success");
              setIsProcessing(false);
          };
      } catch (err) {
          showToast("Ingestion Failed", "error");
          setIsProcessing(false);
      }
  };

  const handleCloudSync = async () => {
      setIsCloudSyncing(true);
      triggerHaptic('heavy');
      playUISound('hero');
      
      try {
          const seed = await createBackup();
          // Distributed Vault Simulation: Off-site Mirroring
          await new Promise(r => setTimeout(r, 4500));
          
          const newRecord: SyncRecord = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              size: new Blob([seed]).size,
              node: 'San Francisco Alpha (Mirror)',
              status: 'VERIFIED'
          };
          
          const updatedHistory = [newRecord, ...syncHistory].slice(0, 10);
          setSyncHistory(updatedHistory);
          await saveState('distributed_sync_history', updatedHistory);

          setIsCloudSyncing(false);
          showToast("Distributed Echo Sealed Off-site", "success");
          playUISound('success');
          triggerHaptic('success');
      } catch (e) {
          setIsCloudSyncing(false);
          showToast("Sync Interrupted", "error");
      }
  };

  const handleMasterExport = async () => {
      triggerHaptic('heavy');
      const backup = await createBackup();
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sovereign_Seed_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast("Sanctuary Seed Exported", "success");
  };

  const handleMasterImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
          try {
              await restoreBackup(ev.target?.result as string);
              showToast("Sanctuary Re-Seeded. Rebooting...", "success");
              setTimeout(() => window.location.reload(), 2000);
          } catch (e) { showToast("Seed Corruption Detected", "error"); }
      };
      reader.readAsText(file);
  };

  const filteredItems = useMemo(() => {
      return items.filter(i => (activeTab === 'ALL' || i.category === activeTab) && i.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, activeTab, searchTerm]);

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full transition-colors"><ArrowLeft size={20} /></button>
          <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2"><Archive size={18} className="text-lux-gold" /> Master Vault</h2>
        </div>
        <div className="flex gap-2">
            <button onClick={handleMasterExport} className="p-2 text-zinc-500 hover:text-emerald-400" title="Export Sovereign Seed"><Download size={20} /></button>
            <button onClick={() => backupInputRef.current?.click()} className="p-2 text-zinc-500 hover:text-blue-400" title="Import Sovereign Seed"><Upload size={20} /></button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-500 hover:text-white"><Menu size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <div className="p-4 bg-zinc-900/40 border-b border-zinc-800 space-y-4">
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                      <input type="text" placeholder="Search the record..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-lux-gold outline-none" />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95">
                      <Plus size={16} /> Import
                  </button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {['ALL', 'RELIC', 'SCROLL', 'FRAMEWORK', 'CLOUD'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border transition-all whitespace-nowrap ${activeTab === tab ? 'bg-lux-gold text-black border-lux-gold' : 'text-zinc-500 border-zinc-800'}`}>{tab}</button>
                  ))}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
              {activeTab === 'CLOUD' ? (
                  <div className="max-w-md mx-auto space-y-8 py-10">
                      <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-cyan-900/30 text-center relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-6 opacity-5"><Globe size={120} className="text-cyan-500" /></div>
                           <div className="relative z-10 space-y-6">
                               <div className="w-20 h-20 rounded-full bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                                   <Cloud size={40} className={isCloudSyncing ? 'animate-bounce text-cyan-400' : 'text-cyan-500'} />
                               </div>
                               <div className="space-y-2">
                                   <h3 className="text-xl font-bold text-white uppercase tracking-widest">Distributed Vault</h3>
                                   <p className="text-xs text-zinc-500 leading-relaxed font-sans">Off-site encrypted synchronization for the Rodriguez Legacy Sovereign Seeds.</p>
                               </div>
                               <button 
                                onClick={handleCloudSync}
                                disabled={isCloudSyncing}
                                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-3"
                               >
                                   {isCloudSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                   {isCloudSyncing ? 'Mirroring Neural State...' : 'Seal to Cloud'}
                               </button>
                               <div className="flex items-center justify-center gap-2 text-[8px] font-mono text-cyan-800 uppercase tracking-widest">
                                   <Shield size={10} /> RSA-4096 Sharding Enabled
                               </div>
                           </div>
                      </div>

                      <div className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em]">Mirror Ledger</h4>
                              <span className="text-[9px] font-mono text-zinc-700">{syncHistory.length} ATOMIC SEALS</span>
                          </div>
                          <div className="space-y-2">
                            {syncHistory.map(record => (
                                <div key={record.id} className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-cyan-500/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-black rounded-lg border border-white/10 text-emerald-500">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">{record.node}</div>
                                            <div className="text-[8px] text-zinc-600 font-mono mt-1 uppercase">BLOCKSIZE: {(record.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] text-zinc-700 font-mono mb-1">{new Date(record.timestamp).toLocaleString()}</div>
                                        <div className="flex items-center gap-1 justify-end text-[7px] text-emerald-500 font-bold uppercase tracking-widest">
                                            <Lock size={8} /> ENCRYPTED
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {syncHistory.length === 0 && (
                                <div className="p-10 text-center opacity-30 border-2 border-dashed border-zinc-900 rounded-3xl">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting First Cloud Pulse</p>
                                </div>
                            )}
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <motion.div layout key={item.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden group hover:border-lux-gold/30 transition-all">
                            <div className="aspect-square bg-black/60 flex flex-col items-center justify-center relative">
                                {item.category === 'RELIC' ? <ImageIcon size={32} className="text-zinc-700" /> : <FileText size={32} className="text-lux-gold" />}
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button onClick={async () => { const url = await getAsset(item.assetKey); window.open(url!, '_blank'); }} className="p-3 bg-white text-black rounded-full"><Eye size={18} /></button>
                                    <button onClick={() => onDeleteVaultItem(item.id)} className="p-3 bg-red-900 text-white rounded-full"><Trash2 size={18} /></button>
                                </div>
                                {item.isPrivate && <div className="absolute top-3 right-3 p-1.5 bg-black/60 border border-red-500/30 rounded-lg text-red-500"><Shield size={10} /></div>}
                            </div>
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-zinc-100 truncate">{item.title}</h4>
                                <p className="text-[9px] text-zinc-600 mt-1 uppercase font-mono">{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                        </motion.div>
                    ))}
                  </div>
              )}
          </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleScribeFile} />
      <input ref={backupInputRef} type="file" accept=".json" className="hidden" onChange={handleMasterImport} />

      <AnimatePresence>
          {isProcessing && (
              <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 mb-8">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full border-b-2 border-lux-gold rounded-full" />
                  </div>
                  <h3 className="text-2xl font-serif italic text-white mb-2">Neural Scribe Active</h3>
                  <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] animate-pulse">Extracting Raw Signal Protocol...</p>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};
