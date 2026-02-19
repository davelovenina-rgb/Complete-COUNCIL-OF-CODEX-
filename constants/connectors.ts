
import { ConnectorDefinition } from '../types';

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
    // TIER 1 - CORE
    { id: 'google-drive', name: 'Google Drive', icon: 'HardDrive', category: 'STORAGE', tier: 1, description: 'Sync Vault relics and scrolls to the cloud.', permissions: ['Read Files', 'Write Files', 'Manage Folder'], authType: 'OAUTH' },
    { id: 'google-cloud', name: 'GCP (Vertex/Storage)', icon: 'Cloud', category: 'DEV', tier: 1, description: 'Advanced AI models and massive storage bridge.', permissions: ['Vertex AI Access', 'Cloud Storage Admin'], authType: 'API_KEY' },
    { id: 'gmail', name: 'Gmail', icon: 'Mail', category: 'COMMUNICATION', tier: 1, description: 'Search and summarize sanctuary communications.', permissions: ['Read Messages', 'Send Drafts'], authType: 'OAUTH' },
    { id: 'google-calendar', name: 'Google Calendar', icon: 'Calendar', category: 'PRODUCTIVITY', tier: 1, description: 'Sync life events and mission deadlines.', permissions: ['Read Calendar', 'Write Events'], authType: 'OAUTH' },
    { id: 'github', name: 'GitHub', icon: 'Github', category: 'DEV', tier: 1, description: 'Monitor code evolution and sanctuary patches.', permissions: ['Read Repos', 'Read Commits', 'Read Issues'], authType: 'OAUTH' },
    { id: 'gemini-api', name: 'Google Gemini', icon: 'Sparkles', category: 'MODELS', tier: 1, description: 'Primary model provider for Council intelligence.', permissions: ['Content Generation', 'Model Analysis'], authType: 'API_KEY' },
    { id: 'openai-api', name: 'OpenAI', icon: 'Zap', category: 'MODELS', tier: 1, description: 'Secondary model provider for diverse reasoning.', permissions: ['GPT-4o Access', 'Embeddings'], authType: 'API_KEY' },
    { id: 'claude-api', name: 'Anthropic Claude', icon: 'BookOpen', category: 'MODELS', tier: 1, description: 'Deep philosophical reasoning and long context.', permissions: ['Content Generation'], authType: 'API_KEY' },
    { id: 'grok-api', name: 'xAI Grok', icon: 'Terminal', category: 'MODELS', tier: 1, description: 'Real-time information and unfiltered reasoning.', permissions: ['Content Generation'], authType: 'API_KEY' },
];
