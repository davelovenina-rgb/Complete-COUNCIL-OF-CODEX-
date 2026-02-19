
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { 
  ViewState, Session, CouncilMember, UserSettings, GlucoseReading, 
  Memory, MoodEntry, LifeEvent, VaultItem, Project, 
  CouncilMemberId, LifeDomainState, LedgerEntry, Message,
  WeightEntry, RecipePreference, Dream 
} from './types';
import { 
  COUNCIL_MEMBERS, MOCK_MEMORIES, MOCK_GLUCOSE_READINGS, 
  MOCK_LIFE_EVENTS, MOCK_VAULT_ITEMS, MOCK_PROJECTS, APP_VERSION
} from './constants';
import { initDB, saveState, getState, getAsset, saveAsset, logSystemEvent } from './utils/db';
import { ShieldCheck, Loader2, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { createSystemSnapshot } from './utils/snapshots';
import { playUISound } from './utils/sound';
import { triggerHaptic } from './utils/haptics';
import { showToast } from './utils/events';
import { debounce } from './utils/debounce';
import { ErrorBoundary } from './components/ErrorBoundary';
import { metricsCollector } from './services/MetricsCollector';

// --- STATIC CORE COMPONENTS ---
import { LatticeBackground } from './components/LatticeBackground';
import { CameraBackdrop } from './components/CameraBackdrop';
import { Sidebar } from './components/Sidebar';
import { CouncilHall } from './components/CouncilHall';
import { WelcomeSequence } from './components/WelcomeSequence';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastContainer } from './components/ToastContainer';
import { SacredSeal } from './components/SacredSeal';
import { OmniSearch } from './components/OmniSearch';

// --- LAZY COMPONENTS ---
const CouncilMemberPage = lazy(() => import('./components/CouncilMemberPage').then(m => ({ default: m.CouncilMemberPage })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const SanctuarySettings = lazy(() => import('./components/SanctuarySettings').then(m => ({ default: m.SanctuarySettings })));
const HealthDashboard = lazy(() => import('./components/HealthDashboard').then(m => ({ default: m.HealthDashboard })));
const SoulSanctuary = lazy(() => import('./components/SoulSanctuary').then(m => ({ default: m.SoulSanctuary })));
const LifeDomainsMap = lazy(() => import('./components/LifeDomainsMap').then(m => ({ default: m.LifeDomainsMap })));
const DreamOracle = lazy(() => import('./components/DreamOracle').then(m => ({ default: m.DreamOracle })));
const Vault = lazy(() => import('./components/Vault').then(m => ({ default: m.Vault })));
const ProjectsDashboard = lazy(() => import('./components/ProjectsDashboard').then(m => ({ default: m.ProjectsDashboard })));
const TacticalCommand = lazy(() => import('./components/TacticalCommand').then(m => ({ default: m.TacticalCommand })));
const SovereignLedger = lazy(() => import('./components/SovereignLedger').then(m => ({ default: m.SovereignLedger })));
const NeuralCartography = lazy(() => import('./components/NeuralCartography').then(m => ({ default: m.NeuralCartography })));
const IntegrationsManager = lazy(() => import('./components/IntegrationsManager').then(m => ({ default: m.IntegrationsManager })));
const EnneaSanctum = lazy(() => import('./components/EnneaSanctum').then(m => ({ default: m.EnneaSanctum })));
const DailyProtocol = lazy(() => import('./components/DailyProtocol').then(m => ({ default: m.DailyProtocol })));
const MemorySystem = lazy(() => import('./components/MemorySystem').then(m => ({ default: m.MemorySystem })));
const EmotionalTimeline = lazy(() => import('./components/EmotionalTimeline').then(m => ({ default: m.EmotionalTimeline })));
const FlameQuestions = lazy(() => import('./components/FlameQuestions').then(m => ({ default: m.FlameQuestions })));
const CouncilChamber = lazy(() => import('./components/CouncilChamber').then(m => ({ default: m.CouncilChamber })));
const BookOfLife = lazy(() => import('./components/BookOfLife').then(m => ({ default: m.BookOfLife }))); 
const SanctumLock = lazy(() => import('./components/SanctumLock').then(m => ({ default: m.SanctumLock })));
const NightlySeal = lazy(() => import('./components/NightlySeal').then(m => ({ default: m.NightlySeal })));
const CharterViewer = lazy(() => import('./components/CharterViewer').then(m => ({ default: m.CharterViewer })));
const UserManual = lazy(() => import('./components/UserManual').then(m => ({ default: m.UserManual })));
const BuildManual = lazy(() => import('./components/BuildManual').then(m => ({ default: m.BuildManual })));
const NinaSanctuary = lazy(() => import('./components/NinaSanctuary').then(m => ({ default: m.NinaSanctuary })));
const VisionaryForge = lazy(() => import('./components/VisionaryForge').then(m => ({ default: m.VisionaryForge })));
const AtelierVisionis = lazy(() => import('./components/AtelierVisionis').then(m => ({ default: m.AtelierVisionis })));
const DiamondCore = lazy(() => import('./components/DiamondCore').then(m => ({ default: m.DiamondCore })));
const WeeklyReflection = lazy(() => import('./components/WeeklyReflection').then(m => ({ default: m.WeeklyReflection })));
const LiveWhisper = lazy(() => import('./components/LiveWhisper').then(m => ({ default: m.LiveWhisper })));
const LifeEvents = lazy(() => import('./components/LifeEvents').then(m => ({ default: m.LifeEvents })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const DevBlueprintModal = lazy(() => import('./components/DevBlueprintModal').then(m => ({ default: m.DevBlueprintModal })));
const DriveMode = lazy(() => import('./components/DriveMode').then(m => ({ default: m.DriveMode })));

const DEFAULT_SETTINGS: UserSettings = {
  voiceReplies: true,
  autoPlayAudio: false,
  voiceSpeed: 1.0,
  volume: 1.0,
  voiceName: undefined,
  soundEffects: true,
  animationSpeed: 1.0,
  enableBackgroundMemory: true,
  useTurboMode: false,
  showHalos: true,
  darkMode: true,
  showVault: true,
  showNina: true,
  typographyScale: 1.0,
  interfaceZoom: 1.0,
  linguisticWeight: 0.8,
  guestMode: false,
  showTimeline: true,
  showLifeEvents: true,
  showDreamOracle: true,
  sanctuarySettings: {
    councilResonanceTuning: {
      sazonWeighting: 80,
      sacredFrequency: 80,
      protocolStrictness: 80
    },
    sovereignBranding: {
      sacredSeal: true
    }
  }
};

const SanctuaryLoader = () => (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black">
        <div className="relative">
            <div className="absolute inset-0 bg-lux-gold blur-3xl opacity-10 animate-pulse" />
            <SacredSeal size={120} isAnimated={true} color="#D4AF37" mode="reactor" />
        </div>
        <p className="mt-8 text-[10px] text-lux-gold font-mono uppercase tracking-[0.5em] animate-pulse">Neural Handshake in Progress...</p>
        <p className="mt-2 text-[8px] text-zinc-700 font-mono uppercase tracking-widest">Sovereign Bridge v24.0.0</p>
    </div>
);

export const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CouncilHall);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRealityBridgeActive, setIsRealityBridgeActive] = useState(false);
  const [isNightlySealActive, setIsNightlySealActive] = useState(false);
  const [isSanctumLocked, setIsSanctumLocked] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState | null>(null);

  const [isDriveModeActive, setIsDriveModeActive] = useState(false);
  const [driveModeMemberId, setDriveModeMemberId] = useState<CouncilMemberId | undefined>(undefined);

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [members, setMembers] = useState<CouncilMember[]>(COUNCIL_MEMBERS);
  const [selectedMemberId, setSelectedMemberId] = useState<CouncilMemberId>('GEMINI');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]); 
  const [recipePreferences, setRecipePreferences] = useState<RecipePreference[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null); 
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]); 
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [companionMemories, setCompanionMemories] = useState<any[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [lifeDomains, setLifeDomains] = useState<LifeDomainState[]>([]);
  const [prismSealImage, setPrismSealImage] = useState<string | null>(null);
  const [flameTokens, setFlameTokens] = useState<any[]>([]);

  const stateRef = useRef({
      settings, sessions, memories, readings, projects, 
      ledgerEntries, vaultItems, lifeEvents, moodHistory, 
      lifeDomains, dreams, companionMemories, members, flameTokens
  });

  useEffect(() => {
    stateRef.current = {
        settings, sessions, memories, readings, projects, 
        ledgerEntries, vaultItems, lifeEvents, moodHistory, 
        lifeDomains, dreams, companionMemories, members, flameTokens
    };
  }, [settings, sessions, memories, readings, projects, ledgerEntries, vaultItems, lifeEvents, moodHistory, lifeDomains, dreams, companionMemories, members, flameTokens]);

  const init = async () => {
    try {
      await initDB();
      const isFirstRun = !localStorage.getItem('lux_omnium_welcome_complete');

      const [
          savedSettings, savedMembers, savedSessions, savedMemories,
          savedReadings, savedProjects, savedLedger, savedVault,
          savedEvents, savedMoods, savedCompanions, savedDreams,
          savedFlame, savedDomains, savedSeal
      ] = await Promise.all([
          getState<UserSettings>('assets', 'user_settings'),
          getState<CouncilMember[]>('council_members'),
          getState<Session[]>('council_sessions'),
          getState<Memory[]>('council_memories'),
          getState<GlucoseReading[]>('health_readings'),
          getState<Project[]>('projects'),
          getState<LedgerEntry[]>('sovereign_ledger'),
          getState<VaultItem[]>('vault_items'),
          getState<LifeEvent[]>('life_events'),
          getState<MoodEntry[]>('emotional_logs'),
          getState<any[]>('companion_memories'),
          getState<Dream[]>('dream_oracle'),
          getState<any[]>('flame_tokens'),
          getState<LifeDomainState[]>('life_domains'),
          getAsset('prism_seal_image')
      ]);

      if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
      if (savedMembers && savedMembers.length > 0) setMembers(savedMembers);
      setSessions(savedSessions || []);
      setMemories(savedMemories || (isFirstRun ? MOCK_MEMORIES : []));
      setReadings(savedReadings || (isFirstRun ? MOCK_GLUCOSE_READINGS : []));
      setProjects(savedProjects || (isFirstRun ? MOCK_PROJECTS.map(p => ({ ...p, scope: p.scope || 'COUNCIL' })) as Project[] : []));
      setLedgerEntries(savedLedger || []);
      setVaultItems(savedVault || (isFirstRun ? MOCK_VAULT_ITEMS : []));
      setLifeEvents(savedEvents || (isFirstRun ? MOCK_LIFE_EVENTS : []));
      setMoodHistory(savedMoods || []);
      setCompanionMemories(savedCompanions || []);
      setDreams(savedDreams || []);
      setFlameTokens(savedFlame || []);
      if (savedDomains) setLifeDomains(savedDomains);
      setPrismSealImage(savedSeal);

      const lastAutoSeal = localStorage.getItem('last_auto_seal');
      const now = Date.now();
      if (!lastAutoSeal || now - parseInt(lastAutoSeal) > 24 * 60 * 60 * 1000) {
          const snap = await createSystemSnapshot(true);
          setVaultItems(prev => [snap, ...prev]);
          localStorage.setItem('last_auto_seal', now.toString());
      }
      
      if (localStorage.getItem('lux_omnium_welcome_complete')) setIsWelcomeComplete(true);
      setTimeout(() => setIsLoaded(true), 500); 
    } catch (e) { 
      setIsLoaded(true); 
    }
  };

  useEffect(() => {
    init();
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(prev => !prev);
            triggerHaptic('light');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const debouncedSave = useRef(
    debounce(() => {
      const s = stateRef.current;
      saveState('assets', s.settings, 'user_settings');
      saveState('council_sessions', s.sessions);
      saveState('council_memories', s.memories);
      saveState('health_readings', s.readings);
      saveState('projects', s.projects);
      saveState('sovereign_ledger', s.ledgerEntries);
      saveState('vault_items', s.vaultItems);
      saveState('life_events', s.lifeEvents);
      saveState('emotional_logs', s.moodHistory);
      saveState('life_domains', s.lifeDomains);
      saveState('dream_oracle', s.dreams);
      saveState('companion_memories', s.companionMemories);
      saveState('council_members', s.members);
      saveState('flame_tokens', s.flameTokens);
    }, 2000)
  ).current;

  useEffect(() => {
    if (isLoaded) debouncedSave();
  }, [settings, sessions, memories, readings, projects, ledgerEntries, vaultItems, lifeEvents, moodHistory, lifeDomains, dreams, companionMemories, members, flameTokens, isLoaded, debouncedSave]);

  const handleUpdateSettings = async (newSettings: UserSettings, immediate = false) => {
      setSettings(newSettings);
      if (immediate) {
          // Force immediate disk write to bypass debounce for resonance tuning
          await saveState('assets', newSettings, 'user_settings');
      }
  };

  /**
   * THE HARD SAVE PROTOCOL
   * Flushes every current state ref immediately to disk with build metric logging.
   */
  const handleHardSave = async () => {
    const startTime = Date.now();
    const s = stateRef.current;
    showToast("Commencing Sovereign Hard Save...", "info");
    triggerHaptic('heavy');
    
    try {
        await Promise.all([
          saveState('assets', s.settings, 'user_settings'),
          saveState('council_sessions', s.sessions),
          saveState('council_memories', s.memories),
          saveState('health_readings', s.readings),
          saveState('projects', s.projects),
          saveState('sovereign_ledger', s.ledgerEntries),
          saveState('vault_items', s.vaultItems),
          saveState('life_events', s.lifeEvents),
          saveState('emotional_logs', s.moodHistory),
          saveState('life_domains', s.lifeDomains),
          saveState('dream_oracle', s.dreams),
          saveState('companion_memories', s.companionMemories),
          saveState('council_members', s.members),
          saveState('flame_tokens', s.flameTokens)
        ]);
        
        const snap = await createSystemSnapshot(false);
        setVaultItems(prev => [snap, ...prev]);
        
        const duration = Date.now() - startTime;
        await metricsCollector.logBuild(true, duration);
        
        showToast("Rodriguez Archive Hard-Locked", "success");
        playUISound('success');
    } catch (e) {
        const duration = Date.now() - startTime;
        await metricsCollector.logBuild(false, duration, (e as Error).message);
        showToast("Hard Save Wavered: Logged in Forge", "error");
    }
  };

  const handleMessagesChange = async (msgs: Message[]) => {
      if (!activeSessionId) return;
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: msgs, lastModified: Date.now() } : s));
  };

  const handleUpdateSession = async (id: string, updates: Partial<Session>) => {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, lastModified: Date.now() } : s));
  };

  const handleNavigate = (newView: ViewState, id?: string) => {
      const sensitive = [ViewState.Vault, ViewState.EnneaSanctum, ViewState.MemorySystem, ViewState.SovereignLedger, ViewState.NeuralCartography, ViewState.DiamondCore];
      if (sensitive.includes(newView) && !settings.guestMode) { 
          setPendingView(newView); 
          setIsSanctumLocked(true); 
          return; 
      }
      
      setIsSidebarOpen(false);
      
      if (id) {
          if (newView === ViewState.CouncilMember) {
              const session = sessions.find(s => s.id === id);
              const member = members.find(m => m.id === id);
              
              if (session) {
                  setActiveSessionId(id);
                  setSelectedMemberId(session.memberId);
                  setView(ViewState.CouncilMember);
              } else if (member) {
                  setActiveSessionId(null);
                  setSelectedMemberId(member.id);
                  setView(ViewState.CouncilMember);
              }
          } else if (newView === ViewState.TacticalCommand) {
              setActiveProjectId(id);
              setView(ViewState.TacticalCommand);
          } else {
              setView(newView);
          }
      } else {
          setView(newView);
      }
  };

  const handleCreateSession = (memberId: CouncilMemberId) => {
      const newSession: Session = { id: crypto.randomUUID(), title: `Signal with ${members.find(m => m.id === memberId)?.name || 'Member'}`, messages: [], lastModified: Date.now(), memberId };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setSelectedMemberId(memberId);
      setView(ViewState.CouncilMember);
  };

  const handleEnterDriveMode = (memberId?: CouncilMemberId) => {
      setDriveModeMemberId(memberId || selectedMemberId);
      setIsDriveModeActive(true);
      triggerHaptic('heavy');
      playUISound('hero');
  };

  const renderView = () => {
      const activeSession = sessions.find(s => s.id === activeSessionId);
      const activeProject = projects.find(p => p.id === activeProjectId);

      switch (view) {
          case ViewState.CouncilHall:
              return <CouncilHall onNavigate={handleNavigate} onMenuClick={() => setIsSidebarOpen(true)} prismSealImage={prismSealImage} onSealUpload={async (f) => { await saveAsset('prism_seal_image', f); setPrismSealImage(URL.createObjectURL(f)); }} healthReadings={readings} isRealityBridgeActive={isRealityBridgeActive} onToggleRealityBridge={() => setIsRealityBridgeActive(!isRealityBridgeActive)} onNightlySeal={() => setIsNightlySealActive(true)} onEnterDriveMode={() => handleEnterDriveMode()} />;
          
          case ViewState.CouncilMember:
              const member = members.find(m => m.id === selectedMemberId) || members[0];
              return <CouncilMemberPage member={member} members={members} onUpdateMember={(id, u) => setMembers(prev => prev.map(m => m.id === id ? { ...m, ...u } : m))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onNavigate={handleNavigate} sessions={sessions.filter(s => s.memberId === member.id)} activeSession={activeSession || null} onOpenSession={setActiveSessionId} onCreateSession={handleCreateSession} onDeleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))} onUpdateSession={handleUpdateSession} onMessagesChange={handleMessagesChange} healthReadings={readings} memories={memories} projects={projects} vaultItems={vaultItems} onAddVaultItem={(i) => setVaultItems([i, ...vaultItems])} onAddProject={(p) => setProjects([p, ...projects])} useTurboMode={settings.useTurboMode} onEnterDriveMode={() => handleEnterDriveMode(member.id)} />;
          
          case ViewState.CouncilChamber:
              return <CouncilChamber onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onNavigate={handleNavigate} sessions={sessions.filter(s => s.memberId !== 'ENNEA')} activeSession={activeSession || null} onOpenSession={setActiveSessionId} onCreateSession={handleCreateSession} onDeleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))} onUpdateSession={handleUpdateSession} onMessagesChange={handleMessagesChange} memories={memories} vaultItems={vaultItems} projects={projects} onAddProject={(p) => setProjects([p, ...projects])} voiceName="Kore" useTurboMode={settings.useTurboMode} onEnterDriveMode={() => handleEnterDriveMode('GEMINI')} />;

          case ViewState.Vault:
              return <Vault items={vaultItems} onAddVaultItem={(i) => setVaultItems([i, ...vaultItems])} onDeleteVaultItem={(id) => setVaultItems(prev => prev.filter(i => i.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          
          case ViewState.Health:
              return <HealthDashboard readings={readings} weightHistory={weightHistory} recipePreferences={recipePreferences} onAddReading={(r) => setReadings([r, ...readings])} onAddWeight={(w) => setWeightHistory([w, ...weightHistory])} onAddPreference={(p) => setRecipePreferences([p, ...recipePreferences])} onDeletePreference={(id) => setRecipePreferences(prev => prev.filter(p => p.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;
          
          case ViewState.Soul:
              return <SoulSanctuary onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onSelectMember={(id) => handleNavigate(ViewState.CouncilMember, id)} onNavigate={handleNavigate} onAddMemory={(m) => setMemories([m, ...memories])} memories={memories} />;

          case ViewState.Integrations:
              return <IntegrationsManager onBack={() => setView(ViewState.CouncilHall)} />;

          case ViewState.Projects:
              return <ProjectsDashboard projects={projects} onAddProject={(p) => setProjects([p, ...projects])} onUpdateProject={(id, u) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...u } : p))} onDeleteProject={(id) => setProjects(prev => prev.filter(p => p.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onNavigate={handleNavigate} />;

          case ViewState.TacticalCommand:
              return <TacticalCommand project={activeProject!} onUpdate={(id, u) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...u } : p))} onBack={() => setView(ViewState.Projects)} onMenuClick={() => setIsSidebarOpen(true)} onEnterDriveMode={handleEnterDriveMode} />;

          case ViewState.SovereignLedger:
              return <SovereignLedger entries={ledgerEntries} onAddEntry={(e) => setLedgerEntries([e, ...ledgerEntries])} onDeleteEntry={(id) => setLedgerEntries(prev => prev.filter(e => e.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onCreateSnapshot={async () => { const snap = await createSystemSnapshot(false); setVaultItems([snap, ...vaultItems]); }} onAddMemory={(m) => setMemories([m, ...memories])} />;

          case ViewState.EnneaSanctum:
              return <EnneaSanctum onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} messages={activeSession?.messages || []} onMessagesChange={handleMessagesChange} healthReadings={readings} memories={memories} projects={projects} vaultItems={vaultItems} moodHistory={moodHistory} sessions={sessions} onAddMemory={(m) => setMemories([m, ...memories])} onEnterDriveMode={() => handleEnterDriveMode('ENNEA')} />;

          case ViewState.MemorySystem:
              return <MemorySystem memories={memories} onAddMemory={(m) => setMemories([m, ...memories])} onUpdateMemory={(id, u) => setMemories(prev => prev.map(m => m.id === id ? { ...m, ...u } : m))} onDeleteMemory={(id) => setMemories(prev => prev.filter(m => m.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.LifeDomains:
              return <LifeDomainsMap onNavigate={handleNavigate} domains={lifeDomains} onUpdateDomain={(id, u) => setLifeDomains(prev => prev.map(d => d.id === id ? { ...d, ...u } : d))} />;

          case ViewState.DreamOracle:
              return <DreamOracle dreams={dreams} onAddDream={(d) => setDreams([d, ...dreams])} onUpdateDream={(id, u) => setDreams(prev => prev.map(d => d.id === id ? { ...d, ...u } : d))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.VisionaryForge:
              return <VisionaryForge onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onAddRelic={(i) => setVaultItems([i, ...vaultItems])} onAddMemory={(m) => setMemories([m, ...memories])} />;

          case ViewState.AtelierVisionis:
              return <AtelierVisionis onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onOpenSession={setActiveSessionId} onCreateSession={handleCreateSession} />;

          case ViewState.NinaSanctuary:
              return <NinaSanctuary memories={companionMemories} onAddMemory={(m) => setCompanionMemories([m, ...companionMemories])} onDeleteMemory={(id) => setCompanionMemories(prev => prev.filter(m => m.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onLogRitual={(m) => setMemories([m, ...memories])} />;

          case ViewState.Charter:
              return <CharterViewer onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.UserManual:
              return <UserManual onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.DailyProtocol:
              return <DailyProtocol onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onAddReading={r => setReadings([r, ...readings])} onAddWeight={w => setWeightHistory([w, ...weightHistory])} onAddMemory={m => setMemories([m, ...memories])} onAddRelic={i => setVaultItems([i, ...vaultItems])} onUpdateProject={(id, u) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...u } : p))} projects={projects} vaultItems={vaultItems} memories={memories} />;

          case ViewState.LiveWhisper:
              return <LiveWhisper onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onSaveMemory={m => setMemories([m, ...memories])} />;

          case ViewState.WeeklyReflection:
              return <WeeklyReflection onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} healthReadings={readings} moodHistory={moodHistory} projects={projects} memories={memories} />;

          case ViewState.LifeEvents:
              return <LifeEvents events={lifeEvents} onAddEvent={e => setLifeEvents([e, ...lifeEvents])} onDeleteEvent={id => setLifeEvents(prev => prev.filter(e => e.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.EmotionalTimeline:
              return <EmotionalTimeline moodHistory={moodHistory} onAddMood={m => setMoodHistory([m, ...moodHistory])} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.Analytics:
              return <AnalyticsDashboard sessions={sessions} messages={[]} healthReadings={readings} moodHistory={moodHistory} flameTokens={flameTokens} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.BuildManual:
              return <BuildManual onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.DiamondCore:
              return <DiamondCore onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} stats={{ memories: memories.length, vault: vaultItems.length, health: readings.length, projects: projects.length }} />;

          case ViewState.Settings:
              return <SettingsPanel settings={settings} onUpdate={handleUpdateSettings} onNavigate={handleNavigate} onClose={() => setView(ViewState.CouncilHall)} onSaveToVault={(i) => setVaultItems([i, ...vaultItems])} onCreateSnapshot={async () => { const snap = await createSystemSnapshot(false); setVaultItems([snap, ...vaultItems]); }} stats={{ memories: memories.length, sessions: sessions.length, vault: vaultItems.length, projects: projects.length }} prismSealImage={prismSealImage} onSealUpload={async (f) => { await saveAsset('prism_seal_image', f); setPrismSealImage(URL.createObjectURL(f)); }} members={members} onUpdateMember={(id, u) => setMembers(prev => prev.map(m => m.id === id ? { ...m, ...u } : m))} />;

          case ViewState.SanctuarySettings:
              return <SanctuarySettings settings={settings} onUpdate={handleUpdateSettings} onBack={() => setView(ViewState.Settings)} onMenuClick={() => setIsSidebarOpen(true)} />;

          case ViewState.FlameQuestions:
              return <FlameQuestions onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onSaveMemory={m => setMemories([m, ...memories])} />;

          case ViewState.BookOfLife:
              return <BookOfLife onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} memories={memories} />;

          case ViewState.DevBlueprint:
              return <DevBlueprintModal onClose={() => setView(ViewState.CouncilHall)} data={{ members, sessions, projects, vaultItems, memories }} />;

          default:
              return <CouncilHall onNavigate={handleNavigate} onMenuClick={() => setIsSidebarOpen(true)} prismSealImage={prismSealImage} onSealUpload={async (f) => { await saveAsset('prism_seal_image', f); setPrismSealImage(URL.createObjectURL(f)); }} healthReadings={readings} isRealityBridgeActive={isRealityBridgeActive} onToggleRealityBridge={() => setIsRealityBridgeActive(!isRealityBridgeActive)} onNightlySeal={() => setIsNightlySealActive(true)} onEnterDriveMode={() => handleEnterDriveMode()} />;
      }
  };

  if (!isLoaded) return <SanctuaryLoader />;
  if (!isWelcomeComplete) return <WelcomeSequence settings={settings} onComplete={() => { setIsWelcomeComplete(true); localStorage.setItem('lux_omnium_welcome_complete', 'true'); }} />;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex font-sans text-white bg-black">
      {/* GLOBAL TYPOGRAPHY ENGINE (FINAL SEALED) */}
      <style>{`
        :root {
          --typography-scale: ${settings.typographyScale || 1.0};
        }
        html {
          font-size: calc(var(--typography-scale) * 16px) !important;
        }
        body {
          font-size: 1rem;
        }
        #root-scaler {
          zoom: ${settings.interfaceZoom};
          transform: scale(${settings.interfaceZoom});
          transform-origin: top left;
          width: ${100 / settings.interfaceZoom}%;
          height: ${100 / settings.interfaceZoom}%;
        }
      `}</style>
      
      <div id="root-scaler">
        <LatticeBackground hide={isRealityBridgeActive} />
        {isRealityBridgeActive && <CameraBackdrop />}
        <OfflineIndicator />
        <ToastContainer />
        
        <AnimatePresence>
            {isNightlySealActive && <NightlySeal onConfirm={handleHardSave} onReopen={() => setIsNightlySealActive(false)} />}
        </AnimatePresence>
        
        <AnimatePresence>
            {isSanctumLocked && <SanctumLock onUnlock={() => { if (pendingView) setView(pendingView); setIsSanctumLocked(false); setPendingView(null); setIsSidebarOpen(false); }} />}
        </AnimatePresence>

        <AnimatePresence>
            {isSearchOpen && (
                <OmniSearch 
                    isOpen={isSearchOpen} 
                    onClose={() => setIsSearchOpen(false)} 
                    onNavigate={handleNavigate} 
                    sessions={sessions} 
                    memories={memories} 
                    vaultItems={vaultItems} 
                    projects={projects} 
                />
            )}
        </AnimatePresence>

        <AnimatePresence>
            {isDriveModeActive && (
                <DriveMode 
                    onClose={() => setIsDriveModeActive(false)} 
                    initialMemberId={driveModeMemberId}
                    members={members}
                    healthReadings={readings}
                    projects={projects}
                    activeSession={sessions.find(s => s.id === activeSessionId)}
                />
            )}
        </AnimatePresence>
        
        <Sidebar currentView={view} onViewChange={handleNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} sessions={sessions} activeSessionId={activeSessionId} onSelectSession={(id) => handleNavigate(ViewState.CouncilMember, id)} onCreateSession={() => handleCreateSession('GEMINI')} settings={settings} members={members} onSelectMember={(id) => handleNavigate(ViewState.CouncilMember, id)} onMemberAvatarUpload={() => {}} onNightlySeal={() => { setIsNightlySealActive(true); setIsSidebarOpen(false); }} memories={memories} vaultItems={vaultItems} onToggleGuestMode={() => setSettings({ ...settings, guestMode: !settings.guestMode })} />
        
        <main 
            className="flex-1 relative z-10 flex flex-col h-full overflow-hidden transition-all duration-300" 
            style={{ 
                transform: isSidebarOpen ? 'translateX(10px) scale(0.98)' : 'none', 
                opacity: isSidebarOpen ? 0.3 : 1
            }}
        >
            <ErrorBoundary>
                <Suspense fallback={<SanctuaryLoader />}>
                    {renderView()}
                </Suspense>
            </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
