import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { VaultItem } from '../types';
import { History, Star, Sparkles, Database } from 'lucide-react';

interface TemporalMapProps {
  snapshots: VaultItem[];
  onSelectSnapshot: (id: string) => void;
}

export const TemporalMap: React.FC<TemporalMapProps> = ({ snapshots, onSelectSnapshot }) => {
  const nebulaPoints = useMemo(() => {
    return snapshots.map((s, i) => {
      // Deterministic but random-looking positions
      const angle = (i * 137.5) * (Math.PI / 180);
      const radius = 20 + (i * 15);
      const x = 50 + (radius * Math.cos(angle)) / 4;
      const y = 50 + (radius * Math.sin(angle)) / 4;
      
      // Data size determines brightness/scale
      const scale = Math.min(2.5, 1 + (s.size / 100000));
      
      return { 
        id: s.id, 
        x, y, scale, 
        date: new Date(s.createdAt).toLocaleDateString(),
        title: s.title
      };
    });
  }, [snapshots]);

  return (
    <div className="relative w-full h-80 bg-zinc-950/40 border border-amber-900/20 rounded-[2.5rem] overflow-hidden group">
      {/* Background Gas Clouds */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.1)_0%,transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Connection Lines (Paths) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        {nebulaPoints.length > 1 && nebulaPoints.map((p, i) => {
          if (i === 0) return null;
          const prev = nebulaPoints[i - 1];
          return (
            <motion.line
              key={`path-${p.id}`}
              x1={`${prev.x}%`} y1={`${prev.y}%`}
              x2={`${p.x}%`} y2={`${p.y}%`}
              stroke="#D4AF37"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: i * 0.2 }}
            />
          );
        })}
      </svg>

      {/* Snapshot Stars */}
      <div className="absolute inset-0">
        {nebulaPoints.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            onClick={() => onSelectSnapshot(p.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group/star"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <div className="relative">
              {/* Outer Glow */}
              <motion.div 
                className="absolute inset-0 blur-[8px] rounded-full bg-lux-gold/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              />
              {/* Core Star */}
              <div 
                className="relative z-10 w-3 h-3 rounded-full bg-white border border-lux-gold shadow-[0_0_10px_white]"
                style={{ transform: `scale(${p.scale})` }}
              />
              
              {/* Star Info Tooltip */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 border border-amber-900/40 rounded-lg px-2 py-1 opacity-0 group-hover/star:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <p className="text-[8px] font-bold text-lux-gold uppercase tracking-widest">{p.date}</p>
                <p className="text-[6px] text-zinc-500 font-mono mt-0.5">SEALED CHECKPOINT</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_white]" />
            <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Temporal Star</span>
        </div>
        <div className="h-px w-8 bg-zinc-800" />
        <div className="text-[8px] text-zinc-600 font-mono uppercase">Nebula of Persistence v1.0</div>
      </div>

      {snapshots.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 text-center pointer-events-none">
            <History size={48} className="mb-4 text-lux-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No snapshots found in nebula</p>
        </div>
      )}
    </div>
  );
};