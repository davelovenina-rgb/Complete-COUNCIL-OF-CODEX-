
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Download, Trash2, CheckCircle, XCircle, HardDrive, Terminal, Clock, Box } from 'lucide-react';
import { metricsCollector } from '../services/MetricsCollector';
import { BuildMetric } from '../types';
import { showToast } from '../utils/events';
import { triggerHaptic } from '../utils/haptics';

export const DataLogsPanel: React.FC = () => {
    const [history, setHistory] = useState<BuildMetric[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        metricsCollector.getHistory().then(setHistory);
    }, []);

    const handleExportMetrics = async () => {
        setIsExporting(true);
        triggerHaptic('medium');
        try {
            const data = JSON.stringify(history, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sanctuary_metrics_${Date.now()}.json`;
            a.click();
            showToast("Metrics Exported", "success");
        } catch (e) {
            showToast("Export Failed", "error");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} className="text-lux-gold" /> Manus Production Forge
                </h3>
                <button 
                    onClick={handleExportMetrics}
                    disabled={isExporting || history.length === 0}
                    className="p-2 bg-zinc-900 rounded-lg text-lux-gold border border-lux-gold/20 hover:bg-lux-gold hover:text-black transition-all"
                >
                    <Download size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {history.length === 0 && (
                    <div className="py-12 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-600 italic text-sm">
                        No build metrics in partition.
                    </div>
                )}
                {history.map((m) => (
                    <div key={m.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-lux-gold/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl bg-black border ${m.success ? 'border-emerald-500/30 text-emerald-500' : 'border-red-500/30 text-red-500'}`}>
                                {m.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">
                                    {new Date(m.timestamp).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[8px] font-mono text-zinc-500 uppercase">
                                    <span className="flex items-center gap-1"><Clock size={10} /> {m.duration}ms</span>
                                    <span className="flex items-center gap-1"><HardDrive size={10} /> {(m.apkSize! / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">v15.9.0 PREP</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
