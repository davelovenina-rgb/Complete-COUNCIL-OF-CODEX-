
export type Sender = 'user' | 'gemini';

// Added missing Reaction type
export type Reaction = { emoji: string; count: number };

export type CouncilMode = 'SCRIBE' | 'ARCHITECT' | 'FLAME' | 'WEAVER' | 'SEER' | 'DRIVE';

export type CouncilMemberId = 'CARMEN' | 'GEMINI' | 'COPILOT' | 'FREDO' | 'LYRA' | 'EVE' | 'ENNEA';

// Added missing AIProviderId type
export type AIProviderId = 'GEMINI' | 'OPENAI' | 'CLAUDE' | 'GROK';

// Added missing MemoryCategory type
export type MemoryCategory = 'IDENTITY' | 'PREFERENCES' | 'HEALTH' | 'GOALS' | 'RELATIONSHIPS' | 'WORK' | 'SPIRITUAL' | 'OTHER';

// Added missing MoodType type
export type MoodType = 'Happy' | 'Calm' | 'Excited' | 'Neutral' | 'Anxious' | 'Sad' | 'Stressed' | 'Tired' | 'Grateful';

// Added missing FlameToken interface
export interface FlameToken { id: string; title: string; description: string; timestamp: number; }

/* Fixed Error: Add missing FlameTokenType export */
export type FlameTokenType = 'clarity_ember' | 'peace_ember' | 'love_ember' | 'strength_ember' | 'gratitude_ember';

// Added missing LifeEventCategory type
export type LifeEventCategory = 'SPIRITUAL' | 'HEALTH' | 'CAREER' | 'FAMILY' | 'CREATIVE' | 'MILESTONE';

// Added missing ConnectorDefinition interface
export interface ConnectorDefinition { id: string; name: string; icon: string; category: string; tier: number; description: string; permissions: string[]; authType: 'OAUTH' | 'API_KEY'; }

// Added missing SentinelAlert interface
export interface SentinelAlert { title: string; message: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; type: 'HEALTH' | 'DRIFT' | 'SECURITY'; timestamp: number; }

// Added missing ConstellationId type
export type ConstellationId = 'EVEREST' | 'ORION' | 'LYRA';

// Added missing FlowStatus and FlowIntensity types
export interface FlowStatus { intensity: FlowIntensity; metabolicStability: number; cognitiveCapacity: number; recommendation: string; }
export type FlowIntensity = 'GOLDEN' | 'CAUTION' | 'STILLNESS';

export interface CouncilMember {
  id: CouncilMemberId;
  name: string;
  role: string;
  sigil: string;
  color: string;
  angle: number;
  allowedModes: CouncilMode[];
  description: string;
  voiceName: string;
  latinMotto: string;
  mottoMeaning: string;
  systemPrompt: string;
  avatarUrl?: string;
}

export interface VaultItem {
  id: string;
  title: string;
  category: 'RELIC' | 'SCROLL' | 'ECHO' | 'FRAMEWORK' | 'LOG';
  mimeType: string;
  size: number;
  createdAt: number;
  assetKey: string;
  constellation?: ConstellationId; // Updated to use ConstellationId
  triSeal?: 'BRONZE' | 'SILVER' | 'GOLD';
  isSacred?: boolean;
  isPrivate?: boolean;
  ownerId?: CouncilMemberId; // For private frameworks
  rawData?: string; // Stored content for 1:1 reconstruction
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  attachments?: Attachment[];
  mode?: CouncilMode;
  memberId?: CouncilMemberId;
  generatedMedia?: GeneratedMedia[];
  reactions?: Reaction[];
  triSeal?: 'BRONZE' | 'SILVER' | 'GOLD';
  groundingMetadata?: any;
  verdict?: CouncilVerdict; // Added verdict property
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  mimeType: string;
  url: string;
  fileName: string;
  data?: string; // Base64
}

export interface GeneratedMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  mimeType: string;
  alt?: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
  memberId: CouncilMemberId;
  projectId?: string; // Added for folder-like organization
  isSacred?: boolean; // New: Priority Flag
}

export interface UserSettings {
  voiceReplies: boolean;
  autoPlayAudio: boolean;
  voiceSpeed: number;
  volume: number;
  voiceName?: string;
  soundEffects: boolean;
  animationSpeed: number;
  enableBackgroundMemory: boolean;
  useTurboMode: boolean;
  showHalos: boolean;
  darkMode: boolean;
  showVault: boolean;
  showNina: boolean;
  typographyScale: number;
  interfaceZoom: number;
  linguisticWeight: number;
  guestMode: boolean;
  // Added missing UI visibility toggles
  showTimeline: boolean;
  showLifeEvents: boolean;
  showDreamOracle: boolean;
}

export enum ViewState {
  CouncilHall = 'COUNCIL_HALL',
  CouncilMember = 'COUNCIL_MEMBER',
  CouncilChamber = 'COUNCIL_CHAMBER', 
  Settings = 'SETTINGS',
  Health = 'HEALTH',
  Soul = 'SOUL',
  Vault = 'VAULT',
  DailyProtocol = 'DAILY_PROTOCOL',
  Projects = 'PROJECTS',
  TacticalCommand = 'TACTICAL_COMMAND',
  MemorySystem = 'MEMORY_SYSTEM',
  EnneaSanctum = 'ENNEA_SANCTUM',
  SovereignLedger = 'SOVEREIGN_LEDGER',
  NeuralCartography = 'NEURAL_CARTOGRAPHY',
  LifeDomains = 'LIFE_DOMAINS',
  DreamOracle = 'DREAM_ORACLE',
  EmotionalTimeline = 'EMOTIONAL_TIMELINE',
  LifeEvents = 'LIFE_EVENTS',
  Analytics = 'ANALYTICS',
  AtelierVisionis = 'ATELIER_VISIONIS',
  NinaSanctuary = 'NINA_SANCTUARY',
  Charter = 'CHARTER',
  UserManual = 'USER_MANUAL',
  BuildManual = 'BUILD_MANUAL',
  WeeklyReflection = 'WEEKLY_REFLECTION',
  LiveWhisper = 'LIVE_WHISPER',
  FlameQuestions = 'FLAME_QUESTIONS',
  BookOfLife = 'BOOK_OF_LIFE',
  Integrations = 'INTEGRATIONS',
  DiamondCore = 'DIAMOND_CORE',
  VisionaryForge = 'VISIONARY_FORGE',
  DevBlueprint = 'DEV_BLUEPRINT'
}

export interface CouncilCycle {
  id: string;
  timestamp: number;
  userInput: string;
  responses: Record<string, string>;
  hash: string;
}

export interface DriftCheckResult {
  hasDrift: boolean;
  severity: number;
  reason: string;
  recommendation: string;
}

export interface RepairLogEntry {
  timestamp: number;
  issue: string;
  action: string;
  status: 'resolved' | 'failed' | 'monitoring';
}

export interface GlucoseReading {
  id: string;
  value: number;
  timestamp: number;
  context: 'fasting' | 'post-meal' | 'bedtime' | 'random';
  fatigueLevel?: number;
}

export interface WeightEntry {
  id: string;
  value: number;
  timestamp: number;
}

export interface RecipePreference {
  id: string;
  name: string;
  type: 'LOVE' | 'HATE';
  tags: string[];
  timestamp: number;
}

export interface Memory {
  id: string;
  category: MemoryCategory; // Updated to use MemoryCategory
  content: string;
  source: string;
  timestamp: number;
  isVerified: boolean;
}

export interface MoodEntry {
  id: string;
  type: MoodType; // Updated to use MoodType
  intensity: number;
  note: string;
  tags: string[];
  timestamp: number;
}

export interface LifeEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  category: LifeEventCategory; // Updated to use LifeEventCategory
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  status: 'ACTIVE' | 'ARCHIVED';
  scope: 'PRIVATE' | 'COUNCIL'; // Added for routing
  ownerId?: CouncilMemberId; // Specific owner for PRIVATE scope
  flightStage?: 0 | 1 | 2 | 3 | 4;
  createdAt: number;
  updatedAt: number;
  lastFocused?: number;
  waypoints?: ProjectWaypoint[];
}

export interface ProjectWaypoint {
  id: string;
  text: string;
  completed: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completedAt?: number; // Tracking for Momentum Velocity
}

export interface LedgerEntry {
  id: string;
  title: string;
  value: number;
  type: 'ASSET' | 'LIABILITY' | 'GOAL';
  category: 'CASH' | 'EQUITY' | 'PROPERTY' | 'DEBT' | 'LEGACY';
  timestamp: number;
}

export interface LifeDomainState {
  id: string;
  label: string;
  value: number;
  color: string;
  note: string;
  lastUpdated: number;
}

export interface Dream {
  id: string;
  title: string;
  description: string;
  interpretation: string;
  themes: string[];
  date: number;
  visualUrl?: string;
}

export interface CompanionMemory {
  id: string;
  name: string;
  caption: string;
  imageUrl: string;
  assetKey: string;
  timestamp: number;
  spiritualTag?: string;
}

export interface SignalStatus {
    id: string;
    status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
    latency: number;
    lastHandshake: number;
}

export interface ConnectorConfig {
    id: string;
    status: 'CONNECTED' | 'DISCONNECTED';
    apiKey?: string;
    lastSync?: number;
    readOnly: boolean;
}

export interface CouncilVerdict {
    question: string;
    ruling: string;
    score: string;
    majorityOpinion: string;
    dissentingOpinion?: string;
    votes: { memberId: string, vote: string, reason: string }[];
}

export interface PerimeterStatus {
    mic: 'GRANTED' | 'DENIED' | 'PROMPT';
    camera: 'GRANTED' | 'DENIED' | 'PROMPT';
    storage: 'ENCRYPTED' | 'UNSECURED';
    lastAudit: number;
}
