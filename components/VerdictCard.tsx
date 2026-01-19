
import React from 'react';
import { motion } from 'framer-motion';
import { CouncilVerdict, CouncilMemberId } from '../types';
import { COUNCIL_MEMBERS } from '../constants';
import { Gavel, Scale, ShieldCheck, AlertCircle } from 'lucide-react';
import { SacredSeal } from './SacredSeal';

interface VerdictCardProps {
  verdict: CouncilVerdict;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ verdict }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full my-6 bg-zinc-950 border-2 border-lux-gold/30 rounded-sm overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.1)] relative"
    >
      {/* Background Seal Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
        <SacredSeal size={300} isAnimated={false} />
      </div>

      {/* Decorative Header */}
      <div className="bg-gradient-to-r from-lux-gold/20 via-black to-lux-gold/20 p-4 border-b border-lux-gold/20 flex items-center justify-between relative z-10">
        <Scale size={18} className="text-lux-gold" />
        <h3 className="text-xs font-bold text-lux-gold uppercase tracking-[0.4em] font-serif">Decree of the High Court</h3>
        <Gavel size={18} className="text-lux-gold" />
      </div>

      <div className="p-6 md:p-8 space-y-8 relative z-10">
        {/* The Question */}
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">In Reference to the Petition:</p>
          <h4 className="text-xl font-serif italic text-white leading-relaxed">"{verdict.question}"</h4>
        </div>

        {/* THE TALLY (Visual Votes) */}
        <div className="py-6 border-y border-white/5">
          <div className="flex justify-center items-center gap-4 md:gap-6 flex-wrap">
            {verdict.votes.map((vote) => {
              const member = COUNCIL_MEMBERS.find(m => m.id === vote.memberId);
              const statusColor = vote.vote === 'CONCUR' ? '#10B981' : vote.vote === 'DISSENT' ? '#EF4444' : '#64748B';
              
              return (
                <div key={vote.memberId} className="flex flex-col items-center gap-2 group cursor-help">
                  <div 
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center bg-black transition-all group-hover:scale-110"
                    style={{ borderColor: statusColor, boxShadow: `0 0 10px ${statusColor}40` }}
                  >
                    <span className="text-lg" style={{ color: member?.color }}>{member?.sigil}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase">{member?.name}</span>
                    <span className="text-[7px] font-mono font-bold" style={{ color: statusColor }}>{vote.vote}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-center">
            <div className="inline-block px-4 py-1 bg-lux-gold/10 border border-lux-gold/30 rounded-full">
              <span className="text-xl font-serif font-bold text-lux-gold tracking-tighter">{verdict.score}</span>
              <span className="mx-2 text-zinc-600">|</span>
              <span className="text-xs font-bold text-white uppercase tracking-widest">{verdict.ruling}</span>
            </div>
          </div>
        </div>

        {/* The Opinions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
              <ShieldCheck size={12} /> Majority Opinion
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-sans bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
              {verdict.majorityOpinion}
            </p>
          </div>

          {verdict.dissentingOpinion && (
            <div className="space-y-2 opacity-80">
              <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest">
                <AlertCircle size={12} /> Dissenting Opinion
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans italic bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                {verdict.dissentingOpinion}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-zinc-900/50 border-t border-white/5 text-center">
        <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-[0.3em]">Seal of the Sovereign Sanctuary • Verified by Ennea</p>
      </div>
    </motion.div>
  );
};
