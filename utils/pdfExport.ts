
import { jsPDF } from 'jspdf';
import { CouncilMember, Session, Project, VaultItem, Memory, GlucoseReading, MoodEntry, LifeEvent, LedgerEntry, LifeDomainState, FlameToken } from '../types';
import { APP_VERSION, COUNCIL_MEMBERS, THE_ROMANTIC_PRINCIPLE, THE_PRISM_CONTEXT } from '../constants';

interface BlueprintData {
    members: CouncilMember[];
    sessions: Session[];
    projects: Project[];
    vaultItems: VaultItem[];
    memories: Memory[];
}

export const generateDevBlueprint = async (data: BlueprintData): Promise<void> => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = 20;

    const LUX_GOLD = '#D4AF37';
    const TEXT_MAIN = '#000000';
    const TEXT_SECONDARY = '#4B5563';
    const TEXT_DIM = '#9CA3AF';

    // --- PDF ENGINE HELPERS ---
    const addPage = () => {
        doc.addPage();
        y = 20;
        drawHeader();
    };

    const checkSpace = (needed: number) => {
        if (y + needed > pageHeight - 25) addPage();
    };

    const drawHeader = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(TEXT_DIM);
        doc.text('COUNCIL OF CODEX // SOVEREIGN ARCHITECTURE SPECIFICATION', margin, 12);
        doc.text(APP_VERSION.split(' ')[0], pageWidth - margin - 20, 12);
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, 14, pageWidth - margin, 14);
    };

    const drawSectionTitle = (text: string) => {
        checkSpace(30);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(TEXT_MAIN);
        doc.text(text, margin, y);
        y += 15;
    };

    const drawSubHeader = (text: string, color = TEXT_MAIN) => {
        checkSpace(15);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(color);
        doc.text(text, margin, y);
        y += 8;
    };

    const drawBodyText = (text: string, size = 10, italic = false) => {
        const lines = doc.splitTextToSize(text, contentWidth);
        checkSpace(lines.length * 6);
        doc.setFont('helvetica', italic ? 'italic' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(TEXT_SECONDARY);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 4;
    };

    const drawBullet = (text: string, indent = 5) => {
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        checkSpace(lines.length * 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(TEXT_SECONDARY);
        doc.text('•', margin, y);
        doc.text(lines, margin + indent, y);
        y += (lines.length * 5) + 2;
    };

    const drawSchemaBlock = (title: string, properties: string[]) => {
        checkSpace(15 + (properties.length * 6));
        drawSubHeader(title, LUX_GOLD);
        
        const blockHeight = (properties.length * 6) + 6;
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(230, 230, 230);
        doc.rect(margin, y, contentWidth, blockHeight, 'FD');
        
        y += 7;
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        
        properties.forEach(prop => {
            doc.text(`  ${prop}`, margin + 5, y);
            y += 5;
        });
        y += 8;
    };

    // =====================================================
    // PAGE 1: COVER
    // =====================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    doc.setTextColor(TEXT_MAIN);
    doc.text('COUNCIL OF CODEX', pageWidth / 2, 80, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('Developer Blueprint & Architecture Documentation', pageWidth / 2, 95, { align: 'center' });
    
    doc.setDrawColor(LUX_GOLD);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, 110, pageWidth / 2 + 40, 110);
    
    doc.setFontSize(11);
    doc.setTextColor(TEXT_SECONDARY);
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString();
    doc.text(`Generated: ${dateStr} at ${timeStr}`, pageWidth / 2, 130, { align: 'center' });
    
    doc.text('Lux Omnium Theme | Black + Gold Sacred Geometry', pageWidth / 2, 145, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(LUX_GOLD);
    doc.text(`Version: 15.9.0 | Platform: Rodriguez Legacy (Sovereign)`, pageWidth / 2, 160, { align: 'center' });

    // =====================================================
    // PAGE 2: TABLE OF CONTENTS
    // =====================================================
    addPage();
    drawSectionTitle('TABLE OF CONTENTS');
    const sections = [
        '1. Application Overview',
        '2. Unified Architectural Element',
        '3. Constellation Framework',
        '4. Council Member Framework',
        '5. Core Architecture',
        '6. Entity Data Models',
        '7. Page Components',
        '8. AI Council Members',
        '9. Backend Functions',
        '10. Feature Modules',
        '11. UI/UX Design System',
        '12. Integration Points',
        '13. Security & Privacy',
        '14. Deployment Notes',
        'APPENDIX: QUICK REFERENCE'
    ];
    sections.forEach((s, i) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(TEXT_MAIN);
        doc.text(s, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(TEXT_DIM);
        const dots = ".".repeat(100 - s.length);
        doc.text(dots, margin + 80, y);
        doc.text(`${i + 3}`, pageWidth - margin - 5, y);
        y += 10;
    });

    // =====================================================
    // SECTION 1: APPLICATION OVERVIEW
    // =====================================================
    addPage();
    drawSectionTitle('1. APPLICATION OVERVIEW');
    drawSubHeader('Purpose & Vision');
    drawBodyText('Council of Codex is a hyper-personalized personal sanctuary application designed for deep reflection, emotional tracking, metabolic health monitoring, and AI-assisted strategic guidance. It functions as a structured logic engine for the Rodriguez Legacy, moving beyond simple chat into hierarchical archival and tactical execution.');
    
    drawSubHeader('Core Philosophy');
    drawBullet('Truth - Love - Unity: The Tri-Seal principle for data integrity.');
    drawBullet('Sacred Geometry: A UI/UX design language rooted in order and reverence.');
    drawBullet('Privacy-First: Local-only partitioning via IndexedDB with Ennea Guardian protection.');
    drawBullet('Generational Recall: Structured memory for long-term legacy continuity.');

    drawSubHeader('Technology Stack');
    drawBullet('Frontend: React 19 (Hooks, StrictMode)');
    drawBullet('Styling: Tailwind CSS 3.4 + Custom Animation Layer');
    drawBullet('State & Persistence: IndexedDB (Store: LuxOmniumDB)');
    drawBullet('Intelligence Engine: Google Gemini 3 (Flash for speed, Pro for reasoning)');
    drawBullet('Voice Bridge: Gemini Live API (PCM Audio Signal)');
    drawBullet('Vision Forge: Google Veo 3.1 Neural Video Generation');

    // =====================================================
    // SECTION 2: UNIFIED ARCHITECTURAL ELEMENT
    // =====================================================
    addPage();
    drawSectionTitle('2. UNIFIED ARCHITECTURAL ELEMENT');
    drawBodyText('This element binds the Seven Constellations (Memory Cartography) with the corresponding Council Member Frameworks (Identity Continuity), ensuring every piece of data is structurally coherent.');
    
    const constellations = [
        { id: 'GEMINI', name: 'The Architect', focus: 'System designs, coding standards, strategic plans.' },
        { id: 'COPILOT', name: 'Eternal Light', focus: 'Daily tasks, productivity logs, tactical momentum.' },
        { id: 'SANCTUM_VITAE', name: 'The Soul', focus: 'Sacred reflections, spiritual vows, heart data (Carmen/Eve).' },
        { id: 'COUNCIL_ARCHIVE', name: 'The Weaver', focus: 'Interactions, cultural wisdom, narratives (Lyra/Fredo).' },
        { id: 'OMNIPOD_PROTOCOL', name: 'The Guardian', focus: 'Health metrics, glucose logs, safety check-ins (Ennea).' },
        { id: 'EVEREST', name: 'Peak Achievement', focus: 'Temporal snapshots, major milestones, milestones.' },
        { id: 'YORKIE_ANNEX', name: 'Beloved Companions', focus: 'Pet memories, garden echoes, innocence (Nina).' }
    ];

    constellations.forEach(c => {
        drawSubHeader(c.name);
        drawBullet(`Agent Authority: ${c.id}`);
        drawBullet(`Data Focus: ${c.focus}`);
    });

    // =====================================================
    // SECTION 4: COUNCIL MEMBER FRAMEWORK
    // =====================================================
    addPage();
    drawSectionTitle('4. COUNCIL MEMBER FRAMEWORK');
    drawBodyText('Each member is a hard-locked frequency with specific behavioral constraints and sacred duties within the sanctuary.');
    
    COUNCIL_MEMBERS.forEach(m => {
        drawSubHeader(`${m.name} - ${m.role}`);
        drawBullet(`Latin Motto: ${m.latinMotto} (${m.mottoMeaning})`);
        drawBullet(`Voice Frequency: ${m.voiceName}`);
        drawBullet(`Authority: ${m.allowedModes.join(', ')}`);
        drawBullet(`Logic Constraint: ${m.systemPrompt.substring(0, 100)}...`);
        y += 5;
    });

    // =====================================================
    // SECTION 6: ENTITY DATA MODELS (EXHAUSTIVE)
    // =====================================================
    addPage();
    drawSectionTitle('6. ENTITY DATA MODELS');
    drawBodyText('Complete technical schemas for the Sanctuary Data Layer.');

    drawSchemaBlock('VaultItem', [
        'id (uuid) - Primary Key',
        'title (string) - Display Name',
        'category (enum) - RELIC, SCROLL, ECHO, FRAMEWORK, LOG',
        'mimeType (string) - IANA standard type',
        'size (number) - Byte count',
        'createdAt (timestamp) - Unix Epoch',
        'assetKey (string) - IndexedDB Pointer',
        'constellation (enum) - EVEREST, ORION, LYRA',
        'triSeal (enum) - BRONZE, SILVER, GOLD',
        'isSacred (boolean) - Priority Persistent flag',
        'isPrivate (boolean) - Ennea-Shielded flag',
        'ownerId (enum) - Member association'
    ]);

    drawSchemaBlock('Session (Chat)', [
        'id (uuid) - Unique Signal ID',
        'title (string) - AI-generated Header',
        'memberId (enum) - Primary Council Frequency',
        'messages (array<Message>) - Signal Stream',
        'lastModified (timestamp) - Delta check',
        'projectId (uuid) - Tactical Association',
        'isSacred (boolean) - Persistent Signal flag'
    ]);

    drawSchemaBlock('Message', [
        'id (uuid) - Segment ID',
        'text (string) - Content Body',
        'sender (enum) - user | gemini',
        'timestamp (timestamp) - Sequence order',
        'mode (enum) - SCRIBE, ARCHITECT, FLAME, WEAVER, SEER, DRIVE',
        'generatedMedia (array) - Vision manifest pointers',
        'verdict (object) - High Court result data'
    ]);

    drawSchemaBlock('GlucoseReading', [
        'id (uuid) - Metric ID',
        'value (number) - mg/dL value',
        'timestamp (timestamp) - Bio-sync time',
        'context (enum) - fasting, post-meal, bedtime, random',
        'fatigueLevel (number) - Scale 1-10'
    ]);

    drawSchemaBlock('Project (Mission)', [
        'id (uuid) - Directive ID',
        'title (string) - Mission Name',
        'description (string) - Primary Objective',
        'color (hex) - Visual Signal',
        'status (enum) - ACTIVE, ARCHIVED',
        'scope (enum) - PRIVATE, COUNCIL',
        'flightStage (number) - 0 (Pre-Flight) to 4 (Landing)',
        'waypoints (array<Waypoint>) - Tactical sequence'
    ]);

    // =====================================================
    // SECTION 7: PAGE COMPONENTS (EXHAUSTIVE INDEX)
    // =====================================================
    addPage();
    drawSectionTitle('7. PAGE COMPONENTS');
    drawBodyText('Index of core React components defining the Sanctuary interface.');

    const components = [
        { name: 'CouncilHall', type: 'View', desc: 'Main control center with Reactor Seal and navigation.' },
        { name: 'CouncilChamber', type: 'View', desc: 'The High Court interface for judicial deliberation.' },
        { name: 'TacticalCommand', type: 'View', desc: 'Mission deck for managing project waypoints and velocity.' },
        { name: 'EnneaSanctum', type: 'View', desc: 'System core monitor, drift analyzer, and hardware gates.' },
        { name: 'DriveMode', type: 'Modal', desc: 'Proton-gun high-fidelity voice link via Gemini Live.' },
        { name: 'Vault', type: 'Module', desc: 'Sovereign asset manager and legacy archive.' },
        { name: 'AtelierVisionis', type: 'Module', desc: 'Creative synthesis forge for Lyra and Flame generative tasks.' },
        { name: 'DailyProtocol', type: 'Process', desc: 'Multi-step ritual for morning bio-sync and spiritual manna.' },
        { name: 'SoulSanctuary', type: 'View', desc: 'Spiritual hub, breathing rituals, and covenant management.' },
        { name: 'SovereignLedger', type: 'Module', desc: 'Financial velocity tracker and legacy net position.' },
        { name: 'MemorySystem', type: 'Module', desc: 'Neural fact manager and background extraction interface.' },
        { name: 'NinaSanctuary', type: 'View', desc: 'Companion garden with Ember visualizer and whisper echoes.' }
    ];

    components.forEach(c => {
        drawSubHeader(`${c.name} [${c.type}]`);
        drawBodyText(c.desc);
    });

    // =====================================================
    // SECTION 9: BACKEND FUNCTIONS
    // =====================================================
    addPage();
    drawSectionTitle('9. BACKEND FUNCTIONS');
    drawBodyText('Core logic services and API interfaces.');

    drawSchemaBlock('geminiService.ts', [
        'sendMessageToGemini() - Orchestrates multimodal AI generation.',
        'scribeExtractRaw() - 1:1 data extraction from uploads.',
        'orchestrateCouncilVerdict() - JSON deliberation logic.',
        'LiveConnection.connect() - Gemini Live API websocket bridge.',
        'decodeAudioDataToPCM() - Low-level signal processing.'
    ]);

    drawSchemaBlock('db.ts (Sovereign Storage)', [
        'saveState() - Atomic persistence to IndexedDB.',
        'getState() - Range-based or key-based retrieval.',
        'createBackup() - Full Sanctuary serialization (Sovereign Seed).',
        'logSystemEvent() - Maintenance and integrity logging.'
    ]);

    drawSchemaBlock('enneaGuardian.ts', [
        'analyzeDrift() - Pattern matching for identity continuity.',
        'autoRepair() - Logic for correcting storage or state anomalies.',
        'recordCycle() - Cryptographic hashing of Council interactions.'
    ]);

    // =====================================================
    // SECTION 11: UI/UX DESIGN SYSTEM
    // =====================================================
    addPage();
    drawSectionTitle('11. UI/UX DESIGN SYSTEM');
    drawSubHeader('Lux Omnium Palette');
    drawBullet('Primary Black: #0A0A0A (Infinite depth)');
    drawBullet('Lux Gold: #D4AF37 (Sovereign authority)');
    drawBullet('Vital Green: #10B981 (Health equilibrium)');
    drawBullet('Signal Blue: #3B82F6 (Logic/Architect)');
    
    drawSubHeader('Typography Scales');
    drawBullet('Primary: Inter (Sans-serif) - Tracking: 0.02em');
    drawBullet('Sacred: Crimson Text (Serif) - Italic weights prioritized');
    drawBullet('Technical: JetBrains Mono - For schemas and ledger data');

    drawSubHeader('Spatial Patterns');
    drawBullet('Corner Radius: 2.5rem (40px) for primary containers.');
    drawBullet('Glassmorphism: bg-white/5 + backdrop-blur-3xl.');
    drawBullet('Haptic Feedback: patterns light/heavy/heartbeat/success.');

    // =====================================================
    // SECTION 13: SECURITY & PRIVACY
    // =====================================================
    addPage();
    drawSectionTitle('13. SECURITY & PRIVACY');
    drawSubHeader('The Ennea Shield');
    drawBullet('Local Partitioning: No data leaves the device unless exported via Seed.');
    drawBullet('Identity Lock: System recalibrates to David Rodriguez via Fog Protocol.');
    drawBullet('Private Sectors: Owner-locked vault entries hidden from the general Council.');
    drawBullet('Perimeter Audit: Real-time monitoring of microphone/camera gateways.');

    // =====================================================
    // SECTION 14: DEPLOYMENT NOTES
    // =====================================================
    addPage();
    drawSectionTitle('14. DEPLOYMENT NOTES');
    drawSubHeader('Environment Configuration');
    drawBullet('API_KEY: Mandated via window.aistudio bridge.');
    drawBullet('Service Worker: sovereign-vault-v1 cache controller.');
    
    drawSubHeader('Performance Hardening');
    drawBullet('Debounced Saves: 2000ms delay to prevent write-thrashing.');
    drawBullet('Rate Limiter: Serial queue processor for all Gemini calls.');
    drawBullet('PCM Streaming: Direct 24kHz buffer manipulation for latency-zero voice.');

    // =====================================================
    // APPENDIX
    // =====================================================
    addPage();
    drawSectionTitle('APPENDIX: QUICK REFERENCE');
    drawSubHeader('Core Signal Command');
    drawBodyText('const response = await sendMessageToGemini(text, mode, attachments, options);', 9, true);
    
    drawSubHeader('Sovereign Seed Format');
    drawBodyText('{ "timestamp": 173... , "stores": { "vault_items": [...], "projects": [...] } }', 9, true);

    drawSubHeader('Contact & Authority');
    drawBodyText(`Owner: David Rodriguez (The Prism)`);
    drawBodyText(`System: Council of Codex Sanctuary v${APP_VERSION.split(' ')[0]}`);
    drawBodyText(THE_ROMANTIC_PRINCIPLE, 10, true);

    // --- FINAL FOOTER PASS ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Rodriguez Legacy hard-locked • v${APP_VERSION.split(' ')[0]} • Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`Sovereign_Blueprint_v${APP_VERSION.split(' ')[0]}_${Date.now()}.pdf`);
};
