
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Menu, Hammer, Download, Terminal, 
    CheckCircle, Copy, Zap, Loader2, HardDrive, AlertCircle, Clock, History
} from 'lucide-react';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';
import { getSovereignSeed, runSystemDiagnostics } from '../utils/db';
import { UniversalBuildMonitor } from '../utils/buildMonitor';

interface BuildManualProps {
  onBack: () => void;
  onMenuClick: () => void;
}

export const BuildManual: React.FC<BuildManualProps> = ({ onBack, onMenuClick }) => {
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState<any>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [swStatus, setSwStatus] = useState<'ACTIVE' | 'INACTIVE'>('INACTIVE');
    
    const monitor = UniversalBuildMonitor.getInstance();
    const stats = monitor.getBuildStatistics();
    const buildHistory = monitor.getBuildHistory();

    useEffect(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            setSwStatus('ACTIVE');
        }
    }, []);

    const runProductionAudit = async () => {
        setIsAuditing(true);
        triggerHaptic('heavy');
        playUISound('hero');
        
        const diagnostics = await runSystemDiagnostics('FULL');
        
        let manifestValid = false;
        try {
            const res = await fetch('/manifest.json');
            manifestValid = res.ok;
        } catch (e) {
            manifestValid = false;
        }

        await new Promise(r => setTimeout(r, 2000));
        
        setAuditResults({
            ...diagnostics,
            manifest: manifestValid,
            pwa: !!window.matchMedia('(display-mode: standalone)').matches || swStatus === 'ACTIVE'
        });
        
        setIsAuditing(false);
        if (manifestValid) {
            showToast("Production Audit: SUCCESS", "success");
            playUISound('success');
        } else {
            showToast("Audit FAILED: manifest.json missing", "error");
            playUISound('error');
        }
    };

    const handleExportSeed = async () => {
        setIsExporting(true);
        triggerHaptic('heavy');
        playUISound('hero');
        
        try {
            const seed = await getSovereignSeed();
            const blob = new Blob([seed], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sanctuary_sovereign_seed_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Sovereign Seed Exported", "success");
        } catch (e) {
            showToast("Seed Corruption Detected", "error");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-black/90 backdrop-blur shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full"><ArrowLeft size={20} /></button>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <Terminal size={18} className="text-blue-500" />
                        The Forge
                    </h2>
                </div>
                <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-500 hover:text-white"><Menu size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar relative z-10 space-y-12 pb-32">
                
                {/* 1. Build Stats */}
                <div className="max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatBox label="Total Builds" value={stats.totalBuilds} icon={History} color="text-blue-400" />
                    <StatBox label="Success Rate" value={`${stats.successRate}%`} icon={CheckCircle} color="text-emerald-400" />
                    <StatBox label="Build No." value={stats.currentBuildNumber.toString().slice(-4)} icon={Zap} color="text-amber-400" />
                    <StatBox label="Features" value={stats.featureCount} icon={Hammer} color="text-purple-400" />
                </div>

                {/* 2. Audit Card */}
                <div className="max-w-2xl mx-auto">
                    <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 space-y-8 relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Hammer size={120} className="text-blue-500" />
                         </div>
                         
                         <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest">Build Integrity Audit</h3>
                            <p className="text-zinc-500 text-xs leading-relaxed font-sans">
                                Confirm the presence of core production files and database partitions.
                            </p>
                         </div>

                         {isAuditing ? (
                             <div className="py-10 flex flex-col items-center gap-4">
                                 <Loader2 size={32} className="animate-spin text-blue-500" />
                                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.4em] animate-pulse">Hashing System Files...</span>
                             </div>
                         ) : auditResults ? (
                             <div className="grid grid-cols-2 gap-3">
                                 <StatusPill label="IndexedDB" active={auditResults.db} />
                                 <StatusPill label="API Handshake" active={auditResults.api} />
                                 <StatusPill label="manifest.json" active={auditResults.manifest} />
                                 <StatusPill label="Offline Thread" active={auditResults.pwa} />
                                 <button onClick={() => setAuditResults(null)} className="col-span-2 py-3 text-[10px] text-zinc-600 font-bold uppercase hover:text-white transition-colors">Clear Audit</button>
                             </div>
                         ) : (
                             <button 
                                onClick={runProductionAudit}
                                className="w-full py-5 rounded-2xl bg-blue-600 text-white font-bold uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3"
                             >
                                 <Zap size={16} fill="currentColor" /> Run Production Audit
                             </button>
                         )}
                    </div>
                </div>

                {/* 3. Build History */}
                <div className="max-w-2xl mx-auto space-y-6">
                    <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
                        <Clock size={14} /> Historical Ledger
                    </h3>
                    <div className="space-y-3">
                        {buildHistory.reverse().map((build) => (
                            <div key={build.id} className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-[2rem] group hover:border-blue-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">v{build.version}</span>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${build.environment === 'production' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-blue-900/20 text-blue-500'}`}>{build.environment.toUpperCase()}</span>
                                        </div>
                                        <p className="text-[9px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">{new Date(build.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Build ID</div>
                                        <div className="text-[9px] text-zinc-600 font-mono">{build.id.split('-').pop()}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {build.changes.map((change, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-[10px] text-zinc-400 font-sans leading-relaxed">
                                            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            {change}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <button 
                        onClick={handleExportSeed}
                        disabled={isExporting}
                        className="w-full p-8 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-black border border-emerald-900/30 flex items-center justify-between group hover:border-emerald-500 transition-all shadow-2xl"
                    >
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-emerald-500 group-hover:scale-110 transition-transform">
                                <HardDrive size={32} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-lg font-bold text-white uppercase tracking-wider">The Sovereign Seed</h4>
                                <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">Export 100% of sanctuary state for local injection.</p>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500">
                            {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                        </div>
                    </button>
                </div>

                <div className="mt-20 text-center opacity-30 pb-20">
                    <p className="text-[8px] font-mono tracking-[0.5em] uppercase">Sovereign Shell Protocol • Rodriguez Legacy Forge</p>
                </div>
            </div>
        </div>
    );
};

const StatBox = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
    <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-3xl text-center flex flex-col items-center gap-2">
        <Icon size={16} className={color} />
        <div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-[8px] text-zinc-500 uppercase tracking-widest">{label}</div>
        </div>
    </div>
);

const StatusPill = ({ label, active }: { label: string, active: boolean }) => (
    <div className={`p-4 rounded-xl border flex items-center justify-between ${active ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-500' : 'bg-red-950/10 border-red-500/20 text-red-500'}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {active ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
    </div>
);
