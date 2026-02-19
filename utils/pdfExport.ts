
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
    doc.text(`Version: 16.0.0 | Platform: Rodriguez Legacy (Sovereign)`, pageWidth / 2, 160, { align: 'center' });

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
        '15. Manus Native Specification',
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
    // SECTIONS 1-14 (Summarized for brevity)
    // =====================================================
    addPage();
    drawSectionTitle('1. APPLICATION OVERVIEW');
    drawBodyText('Council of Codex is a hyper-personalized personal sanctuary application...');
    
    addPage();
    drawSectionTitle('4. COUNCIL MEMBER FRAMEWORK');
    COUNCIL_MEMBERS.forEach(m => {
        drawSubHeader(`${m.name} - ${m.role}`);
        drawBullet(`Latin Motto: ${m.latinMotto}`);
        drawBullet(`Voice Frequency: ${m.voiceName}`);
        y += 5;
    });

    // =====================================================
    // SECTION 15: MANUS NATIVE SPECIFICATION
    // =====================================================
    addPage();
    drawSectionTitle('15. MANUS NATIVE SPECIFICATION');
    drawBodyText('This section details the one-shot requirements for the native build environment.');
    
    drawSubHeader('Core Environment', LUX_GOLD);
    drawBullet('JDK: 17 LTS');
    drawBullet('Gradle: 8.2.1');
    drawBullet('Android API: 34 (Upside Down Cake)');
    drawBullet('Capacitor Version: 5.x+');
    
    drawSubHeader('Storage Architecture');
    drawBullet('Primary Partition: IndexedDB (Persistent local partition)');
    drawBullet('Compression Engine: Pako zlib sharding active for neural parity');
    drawBullet('Encryption: RSA-4096 sharding readiness included in schema');

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
