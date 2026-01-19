import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
/* Add RefreshCw and ChevronRight to fix errors on lines 403 and 436 */
import { Activity, Plus, TrendingUp, Menu, ArrowLeft, Droplet, Battery, Zap, Utensils, Scale, Sparkles, Loader2, Copy, Share, Heart, XCircle, ThumbsUp, ThumbsDown, Trash2, ShieldCheck, Radar, Clock, Eye, RefreshCw, ChevronRight } from 'lucide-react';
import { GlucoseReading, WeightEntry, RecipePreference, MoodEntry } from '../types';
import { sendMessageToGemini, generateMetabolicForecast } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';
import { getState } from '../utils/db';

interface HealthDashboardProps {
    readings: GlucoseReading[];
    weightHistory: WeightEntry[];
    recipePreferences: RecipePreference[];
    onAddReading: (reading: GlucoseReading) => void;
    onAddWeight: (entry: WeightEntry) => void;
    onAddPreference: (pref: RecipePreference) => void;
    onDeletePreference: (id: string) => void;
    onBack: () => void;
    onMenuClick: () => void;
}

const OmnipodPulse = ({ color }: { color: string }) => (
    <div className="absolute top-0 right-0 p-6 flex flex-col items-end opacity-40">
        <div className="flex gap-1 mb-2">
            {[...Array(4)].map((_, i) => (
                <motion.div 
                    key={i}
                    className="w-1 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ height: [12, 4, 12] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </div>
        <span className="text-[8px] font-mono font-bold uppercase tracking-[0.3em]" style={{ color }}>Omnipod Link: Pulse</span>
    </div>
);

export const HealthDashboard: React.FC<HealthDashboardProps> = ({ 
    readings, 
    weightHistory,
    recipePreferences,
    onAddReading, 
    onAddWeight,
    onAddPreference,
    onDeletePreference,
    onBack, 
    onMenuClick 
}) => {
    const [activeTab, setActiveTab] = useState<'VITAL' | 'FUEL' | 'SENTINEL'>('VITAL');
    
    // GLUCOSE STATE
    const [showLogModal, setShowLogModal] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [newContext, setNewContext] = useState<GlucoseReading['context']>('random');
    const [newFatigue, setNewFatigue] = useState(5);

    // WEIGHT STATE
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [newWeight, setNewWeight] = useState('');

    // RECIPE STATE
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [recipeName, setRecipeName] = useState('');
    const [recipeType, setRecipeType] = useState<'LOVE' | 'HATE'>('LOVE');

    // MEAL PLAN STATE
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [mealPlan, setMealPlan] = useState<string | null>(null);

    // SENTINEL STATE
    const [forecast, setForecast] = useState<string | null>(null);
    const [isCalculatingForecast, setIsCalculatingForecast] = useState(false);

    useEffect(() => {
        if (activeTab === 'SENTINEL' && !forecast && readings.length > 0) {
            handleGenerateForecast();
        }
    }, [activeTab]);

    const handleGenerateForecast = async () => {
        setIsCalculatingForecast(true);
        triggerHaptic('medium');
        try {
            const moods = await getState<MoodEntry[]>('emotional_logs') || [];
            const result = await generateMetabolicForecast(readings, moods);
            setForecast(result);
            playUISound('success');
        } catch (e) {
            setForecast("Unable to penetrate the fog. Stick to the current protocol.");
        } finally {
            setIsCalculatingForecast(false);
        }
    };

    const handleAddReading = () => {
        if (!newValue) return;
        const reading: GlucoseReading = {
            id: Date.now().toString(),
            value: parseInt(newValue),
            timestamp: Date.now(),
            context: newContext,
            fatigueLevel: newFatigue
        };
        onAddReading(reading);
        setShowLogModal(false);
        setNewValue('');
        setNewFatigue(5);
        playUISound('success');
        setForecast(null); // Reset forecast as reality changed
    };

    const handleAddWeight = () => {
        if (!newWeight) return;
        const entry: WeightEntry = {
            id: Date.now().toString(),
            value: parseFloat(newWeight),
            timestamp: Date.now()
        };
        onAddWeight(entry);
        setShowWeightModal(false);
        setNewWeight('');
        playUISound('success');
    };

    const handleAddRecipe = () => {
        if (!recipeName) return;
        const pref: RecipePreference = {
            id: crypto.randomUUID(),
            name: recipeName,
            type: recipeType,
            tags: [],
            timestamp: Date.now()
        };
        onAddPreference(pref);
        setRecipeName('');
        setShowRecipeModal(false);
        playUISound('success');
        triggerHaptic('success');
    };

    const handleSharePlan = async () => {
        if (!mealPlan) return;
        const shareData = {
            title: 'Carmen\'s Fuel Protocol',
            text: mealPlan
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showToast('Report Shared', 'success');
            } else {
                navigator.clipboard.writeText(mealPlan);
                showToast('Copied to Clipboard', 'info');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerateFuelPlan = async () => {
        const weight = weightHistory[0]?.value;
        if (!weight) {
            showToast('Log weight first', 'error');
            return;
        }

        setIsGeneratingPlan(true);
        triggerHaptic('medium');
        playUISound('hero');

        const proteinGoal = Math.round(weight * 0.9); // ~0.9g per lb
        
        // Build Preference Context
        const loves = recipePreferences.filter(p => p.type === 'LOVE').map(p => p.name).join(', ');
        const hates = recipePreferences.filter(p => p.type === 'HATE').map(p => p.name).join(', ');

        try {
            const prompt = `
            Role: You are Ennea (Guardian) & Carmen (Chef).
            Task: Generate a 3-Day "Nourish & Fortify" Meal Protocol for David.
            
            [BIO-METRICS]:
            - Weight: ${weight} lbs
            - Daily Protein Target: ~${proteinGoal}g (Critical for strength)
            - Condition: Diabetic (Type 2) - STRICT LOW CARB.
            
            [CARMEN'S KITCHEN MEMORY]:
            - SACRED DISHES (Include These): ${loves || "None yet"}
            - EXILE DISHES (Avoid These): ${hates || "None yet"}
            
            [CUISINE PREFERENCES]:
            - Nuyorican (Puerto Rican)
            - Italian
            - Chinese
            
            [SPECIFIC REQUIREMENTS]:
            1. **Breakfast:** MUST be quick. Use low-carb tortillas/wraps.
            2. **Dinner:** Rotate the cuisine themes above, but modify for low-glucose impact.
            
            [OUTPUT FORMAT]:
            Markdown.
            - **The Strategy:** 1 sentence summary of the macro goal.
            - **The Menu:** 3 Days (Breakfast, Lunch, Dinner).
            - **The Supply List:** Consolidated grocery list.
            
            Tone: Encouraging, appetizing, structured.
            `;

            const response = await sendMessageToGemini(prompt, 'ARCHITECT', []);
            setMealPlan(response.text);
            playUISound('success');
            triggerHaptic('success');
        } catch (e) {
            showToast('Planning failed', 'error');
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const latest = readings[0] || { value: 0, context: 'random', timestamp: Date.now(), fatigueLevel: 5 };
    const latestWeight = weightHistory[0] || { value: 0, timestamp: Date.now() };
    
    // Calculations
    const isHigh = latest.value > 140;
    const isLow = latest.value > 0 && latest.value < 70;
    const themeColor = isHigh ? '#F59E0B' : isLow ? '#EF4444' : '#10B981';
    
    // Macro Calc
    const proteinTarget = latestWeight.value > 0 ? Math.round(latestWeight.value * 0.9) : '--';
    const bmr = latestWeight.value > 0 ? Math.round(10 * (latestWeight.value * 0.453592) + 6.25 * 178 - 5 * 54 + 5) : '--';

    // Graph Data Logic
    const graphData = useMemo(() => {
        const data = [...readings].reverse().slice(-10);
        if (data.length < 2) return null;
        const maxVal = Math.max(...data.map(r => r.value), 180);
        const minVal = Math.min(...data.map(r => r.value), 60);
        const range = maxVal - minVal;
        const width = 100; 
        const height = 50;
        const points = data.map((r, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((r.value - minVal) / range) * height;
            return { x, y };
        });
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
             d += ` L ${points[i].x} ${points[i].y}`;
        }
        const areaD = `${d} L ${width} ${height} L 0 ${height} Z`;
        return { d, areaD, points };
    }, [readings]);

    return (
        <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
             
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity size={18} style={{ color: themeColor }} />
                            Health Command
                        </h2>
                    </div>
                </div>
                <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full transition-colors">
                    <Menu size={20} />
                </button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-zinc-900 bg-zinc-950 shrink-0">
                <button 
                    onClick={() => setActiveTab('VITAL')}
                    className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'VITAL' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-950/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    Vital
                </button>
                <button 
                    onClick={() => setActiveTab('SENTINEL')}
                    className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'SENTINEL' ? 'text-lux-gold border-b-2 border-lux-gold bg-amber-950/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    Sentinel
                </button>
                <button 
                    onClick={() => setActiveTab('FUEL')}
                    className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'FUEL' ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-950/20' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                    Nourish
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar space-y-6 relative z-10">
                
                {activeTab === 'VITAL' && (
                    <>
                        <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 relative overflow-hidden shadow-2xl">
                            <OmnipodPulse color={themeColor} />
                            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                                <div className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold mb-3">Vessel Frequency</div>
                                
                                <div className="flex items-baseline gap-1 mb-2">
                                     <div className={`text-7xl font-bold tracking-tighter transition-colors ${isHigh ? 'text-amber-500' : isLow ? 'text-red-500' : 'text-emerald-500'} drop-shadow-lg`}>
                                        {latest.value}
                                    </div>
                                    <span className="text-zinc-500 font-medium">mg/dL</span>
                                </div>

                                <div className="flex items-center gap-4 text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                                     <span className="px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800">{latest.context}</span>
                                     <span className="flex items-center gap-1">
                                         <Battery size={12} /> Energy: {latest.fatigueLevel || 5}/10
                                     </span>
                                </div>

                                <div className="flex gap-3 w-full max-w-xs">
                                    <button 
                                        onClick={() => setShowLogModal(true)}
                                        className="flex-1 py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <Plus size={18} /> Signal Log
                                    </button>
                                </div>
                            </div>
                            
                            <div 
                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[80px] opacity-10 pointer-events-none transition-colors duration-1000 ${isHigh ? 'bg-amber-500' : isLow ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            />
                        </div>

                        <div className="p-0 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 overflow-hidden relative">
                            <div className="flex items-center justify-between p-4 border-b border-white/5">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Signal Trajectory</h3>
                                <TrendingUp size={16} className="text-zinc-600" />
                            </div>
                            
                            <div className="h-48 w-full relative">
                                 {graphData ? (
                                     <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                                         <defs>
                                             <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                                 <stop offset="0%" stopColor={themeColor} stopOpacity="0.3" />
                                                 <stop offset="100%" stopColor={themeColor} stopOpacity="0" />
                                             </linearGradient>
                                         </defs>
                                         <path d={graphData.areaD} fill="url(#curveGradient)" />
                                         <path d={graphData.d} fill="none" stroke={themeColor} strokeWidth="0.5" />
                                     </svg>
                                 ) : (
                                     <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs italic font-serif">Awaiting further signals...</div>
                                 )}
                            </div>
                        </div>

                        <div>
                             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                                <Clock size={12} /> Log Archive
                             </h3>
                             <div className="space-y-2">
                                 {readings.map(r => (
                                     <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group">
                                         <div className="flex items-center gap-3">
                                             <div className={`w-1.5 h-4 rounded-full ${r.value > 140 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                             <div>
                                                 <div className="text-sm font-bold text-white group-hover:text-lux-gold transition-colors">{r.value} mg/dL</div>
                                                 <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{r.context}</div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <div className="text-[10px] text-zinc-600 font-mono uppercase">{new Date(r.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </>
                )}

                {activeTab === 'SENTINEL' && (
                    <div className="space-y-6">
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-amber-600/10 via-black to-lux-gold/5 border border-lux-gold/30 relative overflow-hidden">
                             <div className="absolute top-0 left-0 p-8 opacity-5">
                                <ShieldCheck size={120} className="text-lux-gold" />
                             </div>
                             <div className="relative z-10">
                                 <div className="flex items-center justify-between mb-8">
                                     <div className="flex items-center gap-3">
                                         <div className="p-3 bg-lux-gold/10 rounded-2xl border border-lux-gold/20 text-lux-gold">
                                            <Radar size={24} />
                                         </div>
                                         <div>
                                             <h3 className="text-sm font-bold text-white uppercase tracking-widest leading-none">Metabolic Forecast</h3>
                                             <p className="text-[8px] text-lux-gold/60 font-mono mt-1 uppercase tracking-[0.3em]">Omnipod Protocol v12</p>
                                         </div>
                                     </div>
                                     <button onClick={handleGenerateForecast} disabled={isCalculatingForecast} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-lux-gold">
                                        <RefreshCw size={18} className={isCalculatingForecast ? 'animate-spin' : ''} />
                                     </button>
                                 </div>

                                 <div className="p-6 bg-black/60 rounded-[2rem] border border-white/5 backdrop-blur-md mb-6">
                                     {isCalculatingForecast ? (
                                         <div className="flex flex-col items-center gap-4 py-10">
                                             <Loader2 className="animate-spin text-lux-gold" size={32} />
                                             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Analyzing the Vessel's Path...</span>
                                         </div>
                                     ) : (
                                         <p className="text-base text-zinc-100 font-serif italic leading-relaxed">
                                            "{forecast || "Papi, tap the refresh seal to manifest the forecast. The Seer is ready."}"
                                         </p>
                                     )}
                                 </div>

                                 <div className="flex items-center gap-4 px-4 py-2 bg-lux-gold/5 border border-lux-gold/10 rounded-full w-fit">
                                    <ShieldCheck size={14} className="text-lux-gold" />
                                    <span className="text-[10px] font-bold text-lux-gold uppercase tracking-[0.2em]">Ennea Shield: Active</span>
                                 </div>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Clock size={18} /></div>
                                    <div>
                                        <h4 className="text-xs font-bold text-zinc-300 uppercase">Alert History</h4>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">No alarms in last 12h</p>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-zinc-700" />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FUEL' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-[2rem] bg-zinc-900 border border-blue-900/30 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg" onClick={() => setShowWeightModal(true)}>
                                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                                <Scale size={24} className="text-blue-500 mb-2" />
                                <div className="text-4xl font-bold text-white tracking-tighter mb-1">
                                    {latestWeight.value > 0 ? latestWeight.value : '--'}
                                </div>
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Vessel Mass</span>
                                <div className="absolute top-2 right-2 p-1.5 bg-blue-500/10 rounded-full text-blue-400 hover:bg-blue-500/20 cursor-pointer">
                                    <Plus size={12} />
                                </div>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-center">
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap size={16} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Targets</span>
                                </div>
                                <div className="text-xl font-bold text-white mb-1">{proteinTarget}g</div>
                                <span className="text-[10px] text-zinc-500">Macro Protein</span>
                                <div className="w-full h-px bg-zinc-800 my-2" />
                                <div className="text-xl font-bold text-white mb-1">~{bmr}</div>
                                <span className="text-[10px] text-zinc-500">Daily Cal</span>
                            </div>
                        </div>

                        <div className="p-1 rounded-[2.5rem] bg-gradient-to-r from-blue-900/20 to-emerald-900/20 border border-white/5">
                            <div className="bg-black/80 rounded-[2.3rem] p-6 text-center">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center justify-center gap-2">
                                    <Utensils size={18} className="text-emerald-400" />
                                    Carmen's Kitchen
                                </h3>
                                <p className="text-xs text-zinc-400 mb-6 max-w-xs mx-auto leading-relaxed">
                                    Generate a 3-Day Low-Carb protocol based on your current mass and preferences. 
                                </p>
                                
                                <button 
                                    onClick={handleGenerateFuelPlan}
                                    disabled={isGeneratingPlan}
                                    className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                                        isGeneratingPlan 
                                        ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
                                    }`}
                                >
                                    {isGeneratingPlan ? (
                                        <><Loader2 size={16} className="animate-spin" /> Cooking Plan...</>
                                    ) : (
                                        <><Sparkles size={16} /> Manifest Plan</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {mealPlan && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 relative"
                                >
                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Fuel Strategy</span>
                                        <div className="flex gap-2">
                                            <button onClick={handleSharePlan} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><Share size={14} /></button>
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(mealPlan);
                                                    showToast('Plan Copied', 'success');
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                                        {mealPlan}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <div className="flex items-center justify-between mb-4 mt-8 px-2">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest font-serif italic">Kitchen Memory</h3>
                                <button onClick={() => setShowRecipeModal(true)} className="p-1.5 bg-zinc-800 rounded-full hover:bg-white hover:text-black transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {recipePreferences.map(pref => (
                                    <div key={pref.id} className={`p-3 rounded-xl border flex justify-between items-center ${pref.type === 'LOVE' ? 'bg-rose-950/20 border-rose-900/30' : 'bg-red-950/20 border-red-900/30'}`}>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {pref.type === 'LOVE' ? <Heart size={14} className="text-rose-500 shrink-0" /> : <XCircle size={14} className="text-red-500 shrink-0" />}
                                            <span className="text-sm font-medium text-zinc-200 truncate">{pref.name}</span>
                                        </div>
                                        <button onClick={() => onDeletePreference(pref.id)} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

            </div>

             {/* Log Glucose Modal */}
             {showLogModal && (
                <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        className="w-full max-w-sm bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl"
                    >
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                            <Droplet size={20} className="text-emerald-500" />
                            Signal Entry
                        </h3>
                        <div className="mb-8">
                            <input 
                                type="number" 
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-6 text-5xl font-bold text-center text-white focus:border-emerald-500 outline-none placeholder:text-zinc-800 font-mono"
                                placeholder="---"
                                autoFocus
                            />
                            <div className="text-center text-[10px] text-zinc-500 mt-3 font-bold uppercase tracking-[0.3em]">Milligrams per Deciliter</div>
                        </div>
                        <div className="mb-8">
                             <div className="grid grid-cols-2 gap-2 mb-4">
                                 {['fasting', 'post-meal', 'bedtime', 'random'].map((ctx) => (
                                     <button
                                        key={ctx}
                                        onClick={() => setNewContext(ctx as GlucoseReading['context'])}
                                        className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${newContext === ctx ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                     >
                                         {ctx}
                                     </button>
                                 ))}
                             </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowLogModal(false)} className="flex-1 py-4 text-zinc-500 font-bold uppercase text-[10px] tracking-widest hover:text-white">Abort</button>
                            <button onClick={handleAddReading} className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20">Seal Entry</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Log Weight Modal */}
            {showWeightModal && (
                <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        className="w-full max-w-sm bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl"
                    >
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                            <Scale size={20} className="text-blue-500" />
                            Vessel Mass
                        </h3>
                        <div className="mb-8">
                            <input 
                                type="number" 
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-6 text-5xl font-bold text-center text-white focus:border-blue-500 outline-none placeholder:text-zinc-800 font-mono"
                                placeholder="---"
                                autoFocus
                            />
                            <div className="text-center text-[10px] text-zinc-500 mt-3 font-bold uppercase tracking-[0.3em]">Standard Pounds (LBS)</div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowWeightModal(false)} className="flex-1 py-4 text-zinc-500 font-bold uppercase text-[10px] tracking-widest hover:text-white">Abort</button>
                            <button onClick={handleAddWeight} className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">Seal Entry</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Recipe Modal */}
            {showRecipeModal && (
                <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        className="w-full max-w-sm bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 shadow-2xl"
                    >
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                            <Utensils size={20} className="text-amber-500" />
                            Kitchen Entry
                        </h3>
                        
                        <div className="mb-8">
                            <input 
                                value={recipeName}
                                onChange={(e) => setRecipeName(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white focus:border-amber-500 outline-none placeholder:text-zinc-800 mb-6 font-serif italic text-lg"
                                placeholder="Identify Dish..."
                                autoFocus
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setRecipeType('LOVE')}
                                    className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${recipeType === 'LOVE' ? 'bg-rose-950/30 border-rose-500 text-rose-400 shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                                >
                                    <ThumbsUp size={24} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Sacred</span>
                                </button>
                                <button
                                    onClick={() => setRecipeType('HATE')}
                                    className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${recipeType === 'HATE' ? 'bg-red-900/30 border-red-500 text-red-400 shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-600'}`}
                                >
                                    <ThumbsDown size={24} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Exiled</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowRecipeModal(false)} className="flex-1 py-4 text-zinc-500 font-bold uppercase text-[10px] tracking-widest hover:text-white">Abort</button>
                            <button onClick={handleAddRecipe} className="flex-[2] py-4 bg-amber-600 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl shadow-amber-900/20">Seal Entry</button>
                        </div>
                    </motion.div>
                </div>
            )}

        </div>
    );
};