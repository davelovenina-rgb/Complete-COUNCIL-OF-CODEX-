
import { getState, saveAsset, logSystemEvent, saveState, factoryResetState } from './db';
import { VaultItem, ConstellationId, Memory } from '../types';
import { APP_VERSION } from '../constants';
import { sendMessageToGemini } from '../services/geminiService';

/**
 * THE SOVEREIGN SEAL PROTOCOL
 * Automatically captures every byte of the Sanctuary's state.
 */
export const createSystemSnapshot = async (isSilent = false): Promise<VaultItem> => {
    const timestamp = Date.now();
    const filename = `${isSilent ? 'AUTO_SEAL' : 'MANUAL_SEAL'}_${timestamp}.json`;

    const stores = [
        'council_sessions', 'health_readings', 
        'council_memories', 'emotional_logs', 'dream_oracle', 
        'life_events', 'vault_items', 'flame_tokens', 
        'projects', 'companion_memories', 'life_domains',
        'connector_configs', 'user_settings', 'sovereign_ledger',
        'council_members'
    ];

    const snapshotData: Record<string, any> = {
        metadata: {
            version: APP_VERSION,
            timestamp,
            owner: "David Rodriguez (The Prism)",
            protocol: "Vigilance v14.2.1",
            type: isSilent ? 'AUTOMATED' : 'MANUAL'
        },
        payload: {}
    };

    for (const storeName of stores) {
        try {
            const data = await getState<any>(storeName);
            snapshotData.payload[storeName] = data;
        } catch (e) {
            console.error(`Seal Failure: ${storeName}`, e);
        }
    }

    const jsonString = JSON.stringify(snapshotData);
    const blob = new Blob([jsonString], { type: 'application/json' });

    const assetKey = `snapshot_${timestamp}`;
    await saveAsset(assetKey, blob);

    await logSystemEvent('SEAL', isSilent ? 'AUTO_SEAL' : 'TEMPORAL_SEAL', 'SUCCESS', `Stored: ${filename}`);

    // If auto-sealing, generate a Daily Debrief memory
    if (isSilent) {
        await generateDailyDebrief(snapshotData.payload);
    }

    return {
        id: crypto.randomUUID(),
        title: filename,
        category: 'SCROLL',
        mimeType: 'application/json',
        size: blob.size,
        createdAt: timestamp,
        assetKey: assetKey,
        constellation: 'EVEREST' as ConstellationId,
        triSeal: isSilent ? 'SILVER' : 'GOLD',
        isSacred: true
    };
};

const generateDailyDebrief = async (payload: any) => {
    try {
        const glucose = payload.health_readings?.[0]?.value || "Unknown";
        const projects = payload.projects?.filter((p: any) => p.status === 'ACTIVE').map((p: any) => p.title).join(', ');
        
        const prompt = `
        Role: ENNEA (Guardian).
        Task: Write a 1-sentence "Daily Sanctuary Debrief" for David Rodriguez.
        Context: Latest Glucose is ${glucose}. Active Projects: ${projects}.
        Tone: Protective big sister, warm Boricua flavor.
        `;
        
        const res = await sendMessageToGemini(prompt, 'SCRIBE', []);
        const debrief: Memory = {
            id: crypto.randomUUID(),
            category: 'OTHER',
            content: `[DAILY DEBRIEF]: ${res.text}`,
            source: 'Auto-Seal Protocol',
            timestamp: Date.now(),
            isVerified: true
        };
        
        const memories = await getState<Memory[]>('council_memories') || [];
        await saveState('council_memories', [debrief, ...memories]);
    } catch (e) {
        console.error("Debrief generation failed", e);
    }
};

/**
 * THE ATOMIC SNAP-BACK ENGINE
 * Performs a Nuclear Wipe and forces a Bit-Perfect State Restoration.
 */
export const restoreFromSnapshot = async (jsonString: string): Promise<void> => {
    try {
        const snapshot = JSON.parse(jsonString);
        if (!snapshot.payload) throw new Error("Invalid Scroll: Payload Missing");

        // STEP 1: FACTORY RESET (NUCLEAR WIPE)
        await factoryResetState();

        // STEP 2: INJECT HISTORICAL BLOCKS
        const stores = Object.keys(snapshot.payload);
        for (const storeName of stores) {
            const data = snapshot.payload[storeName];
            if (data !== undefined) {
                await saveState(storeName, data);
            }
        }

        await logSystemEvent('RESTORATION', 'ATOMIC_SNAPBACK', 'SUCCESS', `Restored to: ${new Date(snapshot.metadata?.timestamp).toLocaleString()}`);
        
        // STEP 3: REBOOT THE CORE
        window.location.reload();
    } catch (e) {
        console.error("Restoration Failed:", e);
        await logSystemEvent('RESTORATION', 'SNAPBACK_FAILED', 'CRITICAL', (e as Error).message);
        throw e;
    }
};
