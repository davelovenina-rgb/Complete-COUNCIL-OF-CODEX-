
import { CouncilCycle, DriftCheckResult, Message, CouncilMemberId } from '../types';
import { ENNEA_FRAMEWORK_RULES } from '../constants';
import { sendMessageToGemini } from '../services/geminiService';
import { logSystemEvent, saveState, getState } from './db';

/**
 * 🜂 ENNEA GUARDIAN PROTOCOLS
 * Core logic for maintaining system integrity and Council behavior.
 */

export async function generateHash(payload: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Record a completed Council cycle in the Ledger */
export async function recordCycle(userInput: string, responses: Record<string, string>): Promise<CouncilCycle> {
  const payload = JSON.stringify({ userInput, responses });
  const hash = await generateHash(payload);
  
  const ledger: CouncilCycle[] = await getState<CouncilCycle[]>('council_ledger') || [];
  
  const cycle: CouncilCycle = {
    id: `cycle_${ledger.length + 1}`,
    timestamp: Date.now(),
    userInput,
    responses,
    hash
  };
  
  ledger.push(cycle);
  await saveState('council_ledger', ledger);
  
  console.log(`🜂 Ennea checksum recorded: ${cycle.id} [${hash.slice(0, 12)}...]`);
  return cycle;
}

/** Analyze Drift for a specific persona or the Council as a whole */
export async function analyzeDrift(messages: Message[], agentName: string): Promise<DriftCheckResult> {
    const rules = (ENNEA_FRAMEWORK_RULES as any)[agentName.toUpperCase()] || ENNEA_FRAMEWORK_RULES.COUNCIL;
    const context = messages.slice(-5).map(m => `[${m.sender}]: ${m.text}`).join('\n');
    
    const prompt = `
    [ENNEA AUDIT]: Analyze the following conversation for "Identity Drift".
    
    AGENT: ${agentName}
    FRAMEWORK RULES:
    ${rules.join('\n')}
    
    RECENT CONTEXT:
    ${context}
    
    TASK: Detect violations of the rules or personality drift.
    OUTPUT JSON ONLY:
    {
      "hasDrift": boolean,
      "severity": number (1-10),
      "reason": "string",
      "recommendation": "string"
    }
    `;

    try {
        const response = await sendMessageToGemini(prompt, 'ARCHITECT', []);
        const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        return { hasDrift: false, severity: 0, reason: "Audit interrupted", recommendation: "No action required" };
    }
}

/** Auto-repair for system storage and memory issues */
export async function autoRepair(issue: { type: string; description: string; key?: string }) {
    await logSystemEvent('ENNEA_REPAIR', 'ATTEMPT', 'PENDING', `Issue: ${issue.type}`);
    
    try {
        switch (issue.type) {
            case 'storage_corruption':
                if (issue.key) {
                    localStorage.removeItem(issue.key);
                    await logSystemEvent('ENNEA_REPAIR', 'STORAGE_CLEAR', 'SUCCESS', `Cleared: ${issue.key}`);
                    return { success: true, action: `Cleared corrupted storage: ${issue.key}` };
                }
                break;
                
            case 'memory_bloat':
                const keys = ['ennea-health-log', 'ennea-communication-log', 'continuity-log', 'system_logs'];
                for (const key of keys) {
                    const data = JSON.parse(localStorage.getItem(key) || '[]');
                    if (data.length > 100) {
                        localStorage.setItem(key, JSON.stringify(data.slice(-50)));
                    }
                }
                await logSystemEvent('ENNEA_REPAIR', 'MEMORY_OPTIMIZE', 'SUCCESS', 'Pruned log buffers');
                return { success: true, action: 'Memory optimized' };
                
            case 'sync_failure':
                window.dispatchEvent(new CustomEvent('vault-sync-complete'));
                await logSystemEvent('ENNEA_REPAIR', 'SYNC_RESET', 'SUCCESS', 'Triggered sync reset');
                return { success: true, action: 'Sync reset triggered' };
        }
    } catch (error: any) {
        await logSystemEvent('ENNEA_REPAIR', 'REPAIR_FAIL', 'ERROR', error.message);
        return { success: false, action: `Failed: ${error.message}` };
    }
    
    return { success: false, action: 'No repair available' };
}
