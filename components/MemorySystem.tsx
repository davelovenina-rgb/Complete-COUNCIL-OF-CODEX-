
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory, MemoryCategory } from '../types';
import { 
  Brain, Search, Plus, Edit2, Trash2, CheckCircle, 
  User, Heart, Activity, Target, Briefcase, Users, FileText,
  Menu, ArrowLeft, Sparkles, LayoutGrid, Network, Share2
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';

interface MemorySystemProps {
  memories: Memory[];
  onAddMemory: (memory: Memory) => void;
  onUpdateMemory: (id: string, updates: Partial<Memory>) => void;
  onDeleteMemory: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

const CATEGORIES: { id: MemoryCategory | 'ALL', label: string, icon: any, color: string }[] = [
  { id: 'ALL', label: 'All Facts', icon: Brain, color: '#FFFFFF' },
  { id: 'IDENTITY', label: 'Identity', icon: User, color: '#3B82F6' }, 
  { id: 'PREFERENCES', label: 'Habits', icon: Heart, color: '#EC4899' }, 
  { id: 'HEALTH', label: 'Health', icon: Activity, color: '#10B981' }, 
  { id: 'GOALS', label: 'Goals', icon: Target, color: '#F59E0B' }, 
  { id: 'RELATIONSHIPS', label: 'People', icon: Users, color: '#8B5CF6' }, 
  { id: 'WORK', label: 'Career', icon: Briefcase, color: '#0EA5E9' }, 
  { id: 'SPIRITUAL', label: 'Spirit', icon: Sparkles, color: '#D8B4FE' }, 
  { id: 'OTHER', label: 'Misc', icon: FileText, color: '#64748B' }, 
];

const StarNode: React.FC<{ 
    color: string; 
    memory: Memory; 
    onClick: (m: Memory) => void; 
}> = ({ color, memory, onClick }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div 
            className="absolute flex items-center justify-center cursor-pointer group z-10"
            style={{ transform: 'translate(-50%, -50%)' }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(memory)}
        >
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: hovered ? 1.5 : 1, boxShadow: hovered ? `0 0 20px ${color}` : `0 0 5px ${color}` }}
                className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white transition-shadow"
                style={{ backgroundColor: color }}
            >
                <div className="absolute inset-0 bg-white opacity-50 rounded-full animate-pulse" />
            </motion.div>

            <AnimatePresence>
                {hovered && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 p-3 rounded-xl shadow-2xl z-50 pointer-events-none"
                    >
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{memory.category}</div>
                        <div className="text-xs text-white line-clamp-3 leading-snug font-medium">{memory.content}</div>
                        <div className="text-[9px] text-zinc-500 mt-2 text-right">{new Date(memory.timestamp).toLocaleDateString()}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const MemorySystem: React.FC<MemorySystemProps> = ({ 
  memories, 
  onAddMemory, 
  onUpdateMemory, 
  onDeleteMemory, 
  onBack, 
  onMenuClick 
}) => {
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'CONSTELLATION' | 'WEAVE'>('LIST');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('IDENTITY');

  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      const matchesCategory = activeCategory === 'ALL' || m.category === activeCategory;
      const matchesSearch = m.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [memories, activeCategory, searchTerm]);

  const weaveData = useMemo(() => {
      if (viewMode !== 'WEAVE') return { nodes: [], lines: [] };
      
      const nodes = filteredMemories.map((m, i) => {
          const angle = (i / filteredMemories.length) * 2 * Math.PI;
          const radius = 35 + Math.sin(i * 133) * 10;
          return {
              id: m.id,
              x: 50 + radius * Math.cos(angle),
              y: 50 + radius * Math.sin(angle),
              color: CATEGORIES.find(c => c.id === m.category)?.color || '#FFF',
              memory: m
          };
      });

      const lines: any[] = [];
      for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
              const m1 = nodes[i].memory;
              const m2 = nodes[j].memory;
              
              const sharedWords = m1.content.split(' ').filter(w => w.length > 4 && m2.content.includes(w));
              if (sharedWords.length > 0 || m1.category === m2.category) {
                  lines.push({
                      x1: nodes[i].x, y1: nodes[i].y,
                      x2: nodes[j].x, y2: nodes[j].y,
                      opacity: sharedWords.length > 0 ? 0.4 : 0.1,
                      color: nodes[i].color
                  });
              }
          }
      }
      return { nodes, lines };
  }, [filteredMemories, viewMode]);

  const constellationData = useMemo(() => {
      if (viewMode !== 'CONSTELLATION') return { nodes: [], lines: [] };
      const centerX = 50; 
      const centerY = 50; 
      const validCategories = CATEGORIES.filter(c => c.id !== 'ALL');
      const sectorSize = (2 * Math.PI) / validCategories.length;

      const nodes = filteredMemories.map((m) => {
          const catIndex = validCategories.findIndex(c => c.id === m.category);
          const catConfig = validCategories[catIndex] || validCategories[0];
          const seed = m.content.length;
          const angle = (catIndex * sectorSize) + ((seed % 100) / 100) * sectorSize;
          const radius = 15 + ((seed * 13) % 35);
          return {
              id: m.id,
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
              color: catConfig.color,
              memory: m
          };
      });

      const lines: any[] = [];
      const grouped = nodes.reduce((acc, node) => {
          const cat = node.memory.category;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(node);
          return acc;
      }, {} as Record<string, any[]>);

      (Object.values(grouped) as any[][]).forEach(group => {
          for (let i = 0; i < group.length - 1; i++) {
              lines.push({ x1: group[i].x, y1: group[i].y, x2: group[i+1].x, y2: group[i+1].y, color: group[i].color });
          }
      });
      return { nodes, lines };
  }, [filteredMemories, viewMode]);

  const handleSave = () => {
    if (!newContent.trim()) return;
    if (editingMemory) {
      onUpdateMemory(editingMemory.id, { content: newContent, category: newCategory, timestamp: Date.now() });
    } else {
      onAddMemory({ id: crypto.randomUUID(), content: newContent, category: newCategory, source: 'User', timestamp: Date.now(), isVerified: true });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if(confirm("Purge memory from the matrix?")) {
        onDeleteMemory(id);
        triggerHaptic('heavy');
        playUISound('error');
    }
  };

  const openAddModal = () => {
    setEditingMemory(null); setNewContent('');
    setNewCategory(activeCategory === 'ALL' ? 'IDENTITY' : activeCategory);
    setShowEditModal(true);
  };

  const openEditModal = (m: Memory) => {
    setEditingMemory(m); setNewContent(m.content);
    setNewCategory(m.category); setShowEditModal(true);
  };

  const closeModal = () => { setShowEditModal(false); setEditingMemory(null); };

  const switchMode = (mode: any) => {
      triggerHaptic('light');
      playUISound('click');
      setViewMode(mode);
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full"><ArrowLeft size={20} /></button>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <Brain size={18} className="text-lux-gold" /> Memory Core
          </h2>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button onClick={() => switchMode('LIST')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'LIST' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}><LayoutGrid size={16} /></button>
                <button onClick={() => switchMode('CONSTELLATION')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'CONSTELLATION' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}><Network size={16} /></button>
                <button onClick={() => switchMode('WEAVE')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'WEAVE' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}><Share2 size={16} /></button>
            </div>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full"><Menu size={20} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="p-4 border-b border-zinc-900 shrink-0 space-y-4 relative z-20 bg-black/50 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input type="text" placeholder="Search the weave..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900/50 text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none border border-transparent focus:border-zinc-800" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); triggerHaptic('light'); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${activeCategory === cat.id ? 'bg-zinc-800 text-white border-zinc-700 shadow-lg shadow-white/5' : 'bg-transparent text-zinc-500 border-zinc-800'}`}>
                <cat.icon size={14} style={{ color: activeCategory === cat.id ? cat.color : undefined }} /> {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
            {viewMode === 'WEAVE' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#050505_0%,#000_100%)]" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {weaveData.lines.map((line, i) => (
                            <motion.line key={i} x1={`${line.x1}%`} y1={`${line.y1}%`} x2={`${line.x2}%`} y2={`${line.y2}%`} stroke={line.color} strokeWidth="0.3" opacity={line.opacity} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: i * 0.01 }} />
                        ))}
                    </svg>
                    <div className="absolute inset-0">
                        {weaveData.nodes.map(node => (
                            <div key={node.id} style={{ position: 'absolute', left: `${node.x}%`, top: `${node.y}%` }}> 
                                <StarNode color={node.color} memory={node.memory} onClick={openEditModal} />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {viewMode === 'CONSTELLATION' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]" />
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {constellationData.lines.map((line, i) => (
                            <motion.line key={i} x1={`${line.x1}%`} y1={`${line.y1}%`} x2={`${line.x2}%`} y2={`${line.y2}%`} stroke={line.color} strokeWidth="0.5" strokeOpacity="0.3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
                        ))}
                    </svg>
                    <div className="absolute inset-0 w-full h-full">
                        {constellationData.nodes.map(node => (
                            <div key={node.id} style={{ position: 'absolute', left: `${node.x}%`, top: `${node.y}%` }}> 
                                <StarNode color={node.color} memory={node.memory} onClick={openEditModal} />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {viewMode === 'LIST' && (
                <div className="absolute inset-0 overflow-y-auto p-4 no-scrollbar z-20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                            {activeCategory === 'ALL' ? 'All Memories' : CATEGORIES.find(c => c.id === activeCategory)?.label} ({filteredMemories.length})
                        </h3>
                        <button onClick={openAddModal} className="text-xs flex items-center gap-1 text-lux-gold hover:text-white transition-colors font-medium px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
                            <Plus size={14} /> Add Fact
                        </button>
                    </div>
                    <div className="space-y-3">
                        {filteredMemories.map(memory => {
                            const cat = CATEGORIES.find(c => c.id === memory.category);
                            return (
                            <div key={memory.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 group hover:border-zinc-700 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-zinc-200 text-sm leading-relaxed mb-2 font-medium">{memory.content}</p>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                    {cat && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800"><cat.icon size={10} style={{ color: cat.color }} /> {cat.label}</span>}
                                    <span>{new Date(memory.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(memory)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(memory.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-lg transition-all"><Trash2 size={16} /></button>
                                </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
      </div>

      <AnimatePresence>
        {showEditModal && (
          <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} className="w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-tight">{editingMemory ? 'Modify Thread' : 'New Weave Node'}</h3>
              <div className="space-y-4">
                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-lux-gold outline-none min-h-[120px] resize-none" placeholder="What should the Council remember?" autoFocus />
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-widest">Neural Domain</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c.id !== 'ALL').map(cat => (
                      <button key={cat.id} onClick={() => { triggerHaptic('light'); setNewCategory(cat.id as MemoryCategory); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${newCategory === cat.id ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-black text-zinc-600 border-zinc-900'}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={closeModal} className="flex-1 py-3 bg-zinc-900 text-zinc-500 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-800">Cancel</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-lux-gold text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white transition-all">Seal Node</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
