
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
import { initDB, saveState, getState, getAsset, saveAsset } from './utils/db';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { createSystemSnapshot } from './utils/snapshots';
import { playUISound } from './utils/sound';
import { triggerHaptic } from './utils/haptics';
import { showToast } from './utils/events';
import { debounce } from './utils/debounce';
import { ErrorBoundary } from './components/ErrorBoundary';

// --- STATIC CORE COMPONENTS ---
import { LatticeBackground } from './components/LatticeBackground';
import { CameraBackdrop } from './components/CameraBackdrop';
import { Sidebar } from './components/Sidebar';
import { CouncilHall } from './components/CouncilHall';
import { WelcomeSequence } from './components/WelcomeSequence';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ToastContainer } from './components/ToastContainer';
import { SacredSeal } from './components/SacredSeal';

// --- LAZY COMPONENTS (Phase 4 Optimization) ---
const CouncilMemberPage = lazy(() => import('./components/CouncilMemberPage').then(m => ({ default: m.CouncilMemberPage })));
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
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
const DriveMode = lazy(() => import('./components/DriveMode').then(m => ({ default: m.DriveMode })));
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
  showDreamOracle: true
};

/**
 * Sanctuary Loading Component
 */
const SanctuaryLoader = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
        <SacredSeal size={100} isAnimated={true} color="#D4AF37" mode="simple" />
        <p className="mt-4 text-[10px] text-lux-gold font-mono uppercase tracking-[0.4em] animate-pulse">Synchronizing Signals...</p>
    </div>
);

export const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CouncilHall);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWelcomeComplete, setIsWelcomeComplete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRealityBridgeActive, setIsRealityBridgeActive] = useState(false);
  const [isNightlySealActive, setIsNightlySealActive] = useState(false);
  const [isSanctumLocked, setIsSanctumLocked] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState | null>(null);
  const [showDriveMode, setShowDriveMode] = useState(false);
  const [activeDriveMember, setActiveDriveMember] = useState<CouncilMemberId>('GEMINI');

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [members, setMembers] = useState<CouncilMember[]>(COUNCIL_MEMBERS);
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

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        const isFirstRun = !localStorage.getItem('lux_omnium_welcome_complete');
        const savedSettings = await getState<UserSettings>('assets', 'user_settings');
        if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
        const savedMembers = await getState<CouncilMember[]>('council_members');
        if (savedMembers && savedMembers.length > 0) setMembers(savedMembers);
        setSessions(await getState<Session[]>('council_sessions') || []);
        const savedMemories = await getState<Memory[]>('council_memories');
        setMemories(savedMemories || (isFirstRun ? MOCK_MEMORIES : []));
        const savedReadings = await getState<GlucoseReading[]>('health_readings');
        setReadings(savedReadings || (isFirstRun ? MOCK_GLUCOSE_READINGS : []));
        const savedProjects = await getState<Project[]>('projects');
        setProjects(savedProjects || (isFirstRun ? MOCK_PROJECTS.map(p => ({ ...p, scope: p.scope || 'COUNCIL' })) as Project[] : []));
        setLedgerEntries(await getState<LedgerEntry[]>('sovereign_ledger') || []);
        const savedVaultItems = await getState<VaultItem[]>('vault_items');
        setVaultItems(savedVaultItems || (isFirstRun ? MOCK_VAULT_ITEMS : []));
        const savedLifeEvents = await getState<LifeEvent[]>('life_events');
        setLifeEvents(savedLifeEvents || (isFirstRun ? MOCK_LIFE_EVENTS : []));
        setMoodHistory(await getState<MoodEntry[]>('emotional_logs') || []);
        setCompanionMemories(await getState<any[]>('companion_memories') || []);
        setDreams(await getState<Dream[]>('dream_oracle') || []);
        setFlameTokens(await getState<any[]>('flame_tokens') || []);
        const domains = await getState<LifeDomainState[]>('life_domains');
        if (domains) setLifeDomains(domains);
        const savedSeal = await getAsset('prism_seal_image');
        setPrismSealImage(savedSeal);

        const lastAutoSeal = localStorage.getItem('last_auto_seal');
        const now = Date.now();
        if (!lastAutoSeal || now - parseInt(lastAutoSeal) > 24 * 60 * 60 * 1000) {
            const snap = await createSystemSnapshot(true);
            setVaultItems(prev => [snap, ...prev]);
            localStorage.setItem('last_auto_seal', now.toString());
            showToast("Daily Cognitive Snapshot Sealed", "info");
        }
        if (localStorage.getItem('lux_omnium_welcome_complete')) setIsWelcomeComplete(true);
        setIsLoaded(true);
      } catch (e) { 
        setIsLoaded(true); 
      }
    };
    init();
  }, []);

  const debouncedSave = useRef(
    debounce(() => {
      saveState('assets', settings, 'user_settings');
      saveState('council_sessions', sessions);
      saveState('council_memories', memories);
      saveState('health_readings', readings);
      saveState('projects', projects);
      saveState('sovereign_ledger', ledgerEntries);
      saveState('vault_items', vaultItems);
      saveState('life_events', lifeEvents);
      saveState('emotional_logs', moodHistory);
      saveState('life_domains', lifeDomains);
      saveState('dream_oracle', dreams);
      saveState('companion_memories', companionMemories);
      saveState('council_members', members);
      saveState('flame_tokens', flameTokens);
    }, 2000)
  ).current;

  useEffect(() => {
    if (isLoaded) debouncedSave();
  }, [settings, sessions, memories, readings, projects, ledgerEntries, vaultItems, lifeEvents, moodHistory, lifeDomains, dreams, companionMemories, members, flameTokens, isLoaded, debouncedSave]);

  useEffect(() => {
    const scale = settings.typographyScale || 1.0;
    document.documentElement.style.fontSize = `${scale * 16}px`;
  }, [settings.typographyScale]);

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
      setView(newView); 
      setIsSidebarOpen(false);
      if (id) {
          if (newView === ViewState.CouncilMember) {
              const session = sessions.find(s => s.id === id);
              if (session) setActiveSessionId(id);
              else { setActiveSessionId(null); setActiveDriveMember(id as CouncilMemberId); }
          }
          if (newView === ViewState.TacticalCommand) setActiveProjectId(id);
      }
  };

  const handleCreateSession = (memberId: CouncilMemberId) => {
      const newSession: Session = { id: crypto.randomUUID(), title: `Signal with ${members.find(m => m.id === memberId)?.name || 'Member'}`, messages: [], lastModified: Date.now(), memberId };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setView(ViewState.CouncilMember);
  };

  const renderView = () => {
      if (showDriveMode) return null; 
      const activeSession = sessions.find(s => s.id === activeSessionId);
      const activeProject = projects.find(p => p.id === activeProjectId);

      switch (view) {
          case ViewState.CouncilHall:
              return <CouncilHall onNavigate={handleNavigate} onMenuClick={() => setIsSidebarOpen(true)} prismSealImage={prismSealImage} onSealUpload={async (f) => { await saveAsset('prism_seal_image', f); setPrismSealImage(URL.createObjectURL(f)); }} healthReadings={readings} onEnterDriveMode={(id) => { setActiveDriveMember(id); setShowDriveMode(true); }} isRealityBridgeActive={isRealityBridgeActive} onToggleRealityBridge={() => setIsRealityBridgeActive(!isRealityBridgeActive)} onNightlySeal={() => setIsNightlySealActive(true)} />;
          
          case ViewState.CouncilMember:
              const memberId = activeSession?.memberId || activeDriveMember || 'GEMINI'; 
              const member = members.find(m => m.id === memberId) || members[0];
              return <CouncilMemberPage member={member} members={members} onUpdateMember={(id, u) => setMembers(prev => prev.map(m => m.id === id ? { ...m, ...u } : m))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onNavigate={handleNavigate} sessions={sessions.filter(s => s.memberId === member.id)} activeSession={activeSession || null} onOpenSession={setActiveSessionId} onCreateSession={handleCreateSession} onDeleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))} onUpdateSession={handleUpdateSession} onMessagesChange={handleMessagesChange} healthReadings={readings} memories={memories} projects={projects} vaultItems={vaultItems} onAddVaultItem={(i) => setVaultItems([i, ...vaultItems])} onAddProject={(p) => setProjects([p, ...projects])} useTurboMode={settings.useTurboMode} onEnterDriveMode={() => { setActiveDriveMember(member.id); setShowDriveMode(true); }} />;
          
          case ViewState.CouncilChamber:
              return <CouncilChamber onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onNavigate={handleNavigate} sessions={sessions.filter(s => s.memberId !== 'ENNEA')} activeSession={activeSession || null} onOpenSession={setActiveSessionId} onCreateSession={handleCreateSession} onDeleteSession={(id) => setSessions(prev => prev.filter(s => s.id !== id))} onUpdateSession={handleUpdateSession} onMessagesChange={handleMessagesChange} memories={memories} vaultItems={vaultItems} projects={projects} onAddProject={(p) => setProjects([p, ...projects])} voiceName="Kore" useTurboMode={settings.useTurboMode} onEnterDriveMode={() => { setActiveDriveMember('GEMINI'); setShowDriveMode(true); }} />;

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
              return <TacticalCommand project={activeProject!} onUpdate={(id, u) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...u } : p))} onBack={() => setView(ViewState.Projects)} onMenuClick={() => setIsSidebarOpen(true)} onEnterDriveMode={(mid) => { setActiveDriveMember(mid); setShowDriveMode(true); }} />;

          case ViewState.SovereignLedger:
              return <SovereignLedger entries={ledgerEntries} onAddEntry={(e) => setLedgerEntries([e, ...ledgerEntries])} onDeleteEntry={(id) => setLedgerEntries(prev => prev.filter(e => e.id !== id))} onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onCreateSnapshot={async () => { const snap = await createSystemSnapshot(false); setVaultItems([snap, ...vaultItems]); }} onAddMemory={(m) => setMemories([m, ...memories])} />;

          case ViewState.EnneaSanctum:
              return <EnneaSanctum onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} messages={activeSession?.messages || []} onMessagesChange={handleMessagesChange} healthReadings={readings} memories={memories} projects={projects} vaultItems={vaultItems} moodHistory={moodHistory} sessions={sessions} onAddMemory={(m) => setMemories([m, ...memories])} />;

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
              return <SettingsPanel settings={settings} onUpdate={setSettings} onClose={() => setView(ViewState.CouncilHall)} onSaveToVault={(i) => setVaultItems([i, ...vaultItems])} onCreateSnapshot={async () => { const snap = await createSystemSnapshot(false); setVaultItems([snap, ...vaultItems]); }} onEnterDriveMode={(id) => { setActiveDriveMember(id); setShowDriveMode(true); }} stats={{ memories: memories.length, sessions: sessions.length, vault: vaultItems.length, projects: projects.length }} prismSealImage={prismSealImage} onSealUpload={async (f) => { await saveAsset('prism_seal_image', f); setPrismSealImage(URL.createObjectURL(f)); }} members={members} onUpdateMember={(id, u) => setMembers(prev => prev.map(m => m.id === id ? { ...m, ...u } : m))} />;

          case ViewState.FlameQuestions:
              return <FlameQuestions onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} onSaveMemory={m => setMemories([m, ...memories])} />;

          case ViewState.BookOfLife:
              return <BookOfLife onBack={() => setView(ViewState.CouncilHall)} onMenuClick={() => setIsSidebarOpen(true)} memories={memories} />;

          case ViewState.DevBlueprint:
              return <DevBlueprintModal onClose={() => setView(ViewState.CouncilHall)} data={{ members, sessions, projects, vaultItems, memories }} />;

          default:
              return <CouncilHall onNavigate={handleNavigate} onMenuClick={() => setIsSidebarOpen(true)} prismSealImage={prismSealImage} onSealUpload={async (f) => { await saveAsset('prism_seal_image', f); setPrismSealImage(URL.createObjectURL(f)); }} healthReadings={readings} onEnterDriveMode={(id) => { setActiveDriveMember(id); setShowDriveMode(true); }} isRealityBridgeActive={isRealityBridgeActive} onToggleRealityBridge={() => setIsRealityBridgeActive(!isRealityBridgeActive)} onNightlySeal={() => setIsNightlySealActive(true)} />;
      }
  };

  if (!isWelcomeComplete) return <WelcomeSequence settings={settings} onComplete={() => { setIsWelcomeComplete(true); localStorage.setItem('lux_omnium_welcome_complete', 'true'); }} />;

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden flex font-sans text-white bg-black">
      <div 
        id="root-scaler" 
        style={{ 
            zoom: settings.interfaceZoom,
            transform: `scale(${settings.interfaceZoom})`,
            transformOrigin: 'top left',
            width: `${100 / settings.interfaceZoom}%`,
            height: `${100 / settings.interfaceZoom}%`
        } as any}
      >
        <LatticeBackground hide={isRealityBridgeActive} />
        {isRealityBridgeActive && <CameraBackdrop />}
        <OfflineIndicator />
        <ToastContainer />
        
        <Suspense fallback={<SanctuaryLoader />}>
            <AnimatePresence>
                {showDriveMode && (
                    <DriveMode onClose={() => setShowDriveMode(false)} initialMemberId={activeDriveMember} members={members} healthReadings={readings} projects={projects} activeSession={sessions.find(s => s.id === activeSessionId)} />
                )}
            </AnimatePresence>
            
            <AnimatePresence>
                {isNightlySealActive && <NightlySeal onConfirm={async () => { const snap = await createSystemSnapshot(false); setVaultItems(prev => [snap, ...prev]); }} onReopen={() => setIsNightlySealActive(false)} />}
            </AnimatePresence>
            
            <AnimatePresence>
                {isSanctumLocked && <SanctumLock onUnlock={() => { if (pendingView) setView(pendingView); setIsSanctumLocked(false); setPendingView(null); setIsSidebarOpen(false); }} />}
            </AnimatePresence>
            
            <Sidebar currentView={view} onViewChange={handleNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} sessions={sessions} activeSessionId={activeSessionId} onSelectSession={(id) => { setActiveSessionId(id); setIsSidebarOpen(false); }} onCreateSession={() => handleCreateSession('GEMINI')} settings={settings} members={members} onSelectMember={(id) => { setView(ViewState.CouncilMember); setActiveDriveMember(id); setActiveSessionId(null); setIsSidebarOpen(false); }} onMemberAvatarUpload={() => {}} onNightlySeal={() => { setIsNightlySealActive(true); setIsSidebarOpen(false); }} memories={memories} vaultItems={vaultItems} onToggleGuestMode={() => setSettings({ ...settings, guestMode: !settings.guestMode })} />
            
            <main 
                className="flex-1 relative z-10 flex flex-col h-full overflow-hidden transition-all duration-300" 
                style={{ 
                    transform: isSidebarOpen ? 'translateX(10px) scale(0.98)' : 'none', 
                    opacity: isSidebarOpen ? 0.5 : 1
                }}
            >
                <ErrorBoundary>
                    {renderView()}
                </ErrorBoundary>
            </main>
        </Suspense>
      </div>
    </div>
  );
};
