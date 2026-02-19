
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION, DEFAULT_MODEL, ADVANCED_MODEL, MODELS, MAX_THINKING_BUDGET, NUYORICAN_SONANCE_PROTOCOL } from '../constants';
import { Attachment, CouncilMode, GeneratedMedia, VaultItem, UserSettings } from '../types';
import { withSanctuaryRateLimit } from '../sanctuaryRateLimiter';
import { showToast } from '../utils/events';
import { getState } from '../utils/db';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/** 
 * THE SOVEREIGN RESONANCE MANDATE (VERSION 23.0)
 */
const getResonanceInstruction = (settings: UserSettings | null) => {
    if (!settings) return "";
    const tuning = settings.sanctuarySettings.councilResonanceTuning;
    const s = tuning.sazonWeighting;
    const f = tuning.sacredFrequency;
    const p = tuning.protocolStrictness;

    return `
[CRITICAL SYSTEM OVERRIDE - RESONANCE GATES ACTIVE]:
Your output is now filtered through these hardware-level logic gates.

1. SAZÓN GATE (CULTURAL): ${s}%
${s <= 15 ? "- NEGATIVE CONSTRAINT: NO SPANISH/PUERTO RICAN INFLECTIONS." : ""}
${s >= 85 ? "- MANDATE: FREQUENT CODE-SWITCHING AND DICHOSES REQUIRED." : ""}

2. SACRED GATE (FAITH): ${f}%
${f <= 15 ? "- NEGATIVE CONSTRAINT: NO SPIRITUAL LANGUAGE." : ""}
${f >= 85 ? "- MANDATE: INCLUDE SCRIPTURAL REFERENCES." : ""}

3. PROTOCOL GATE (STRUCTURE): ${p}%
${p <= 15 ? "- NEGATIVE CONSTRAINT: NO BULLETS OR JARGON." : ""}
${p >= 85 ? "- MANDATE: STRUCTURED TACTICAL BRIEFS ONLY." : ""}
`;
};

export const scribeExtractRaw = async (file: { data: string, mimeType: string }, targetDomain: 'FRAMEWORK' | 'LOG' | 'FINANCIAL'): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `[SOVEREIGN SCRIBE]: Extract text 1:1. Domain: ${targetDomain}`;
        const response = await ai.models.generateContent({
            model: ADVANCED_MODEL,
            contents: [{ role: 'user', parts: [{ inlineData: { data: file.data, mimeType: file.mimeType } }, { text: prompt }] }],
            config: { temperature: 0 }
        });
        return response.text || "";
    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

export const summarizeHistory = async (history: any[]): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `[NEURAL COMPACTOR]: Summarize tactical and family updates.`;
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [...history, { role: 'user', parts: [{ text: prompt }] }]
        });
        return response.text || "Context stabilized.";
    } catch (e) {
        return "Memory sync stable.";
    }
};

export const sendMessageToGemini = async (text: string, mode: CouncilMode, attachments: Attachment[] = [], options: { 
    aspectRatio?: string; 
    imageSize?: '1K' | '2K' | '4K';
    systemInstruction?: string; 
    useTurboMode?: boolean; 
    history?: any[];
    highQuality?: boolean;
    vaultAwareness?: string; 
    linguisticWeight?: number; 
} = {}): Promise<{ text: string; generatedMedia: GeneratedMedia[]; groundingMetadata?: any; }> => {
    try {
        const ai = getClient(); 
        
        if (mode === 'WEAVER') {
            let operation = await ai.models.generateVideos({
                model: options.highQuality ? MODELS.VIDEO_HQ_MODEL : MODELS.VIDEO_MODEL,
                prompt: text,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: (options.aspectRatio as any) || '16:9' }
            });
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation as any });
            }
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            return { text: "Weave complete.", generatedMedia: [{ type: 'video', url: videoUrl, mimeType: 'video/mp4' }] };
        }

        if (mode === 'FLAME') {
            const model = (options.highQuality || options.imageSize === '2K' || options.imageSize === '4K') ? 'gemini-3-pro-image-preview' : MODELS.IMAGE_MODEL;
            const response = await ai.models.generateContent({
                model,
                contents: [{ parts: [{ text }] }],
                config: { imageConfig: { aspectRatio: (options.aspectRatio as any) || "1:1", ...(model.includes('pro') ? { imageSize: options.imageSize || '1K' } : {}) } }
            });
            const media: GeneratedMedia[] = [];
            response.candidates?.[0]?.content?.parts?.forEach(p => {
                if (p.inlineData) media.push({ type: 'image', url: `data:image/png;base64,${p.inlineData.data}`, mimeType: 'image/png' });
            });
            return { text: response.text || "Vision forged.", generatedMedia: media };
        }

        const model = (mode === 'ARCHITECT' || options.useTurboMode) ? ADVANCED_MODEL : DEFAULT_MODEL;
        const parts: any[] = attachments.map(a => ({ inlineData: { mimeType: a.mimeType, data: a.data } }));
        parts.push({ text });

        const settings = await getState<UserSettings>('assets', 'user_settings');
        const resonanceContext = getResonanceInstruction(settings);
        const finalInstruction = `${options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION}\n\n${resonanceContext}`;

        const config: any = { systemInstruction: finalInstruction, tools: [{ googleSearch: {} }] };
        if (mode === 'ARCHITECT') config.thinkingConfig = { thinkingBudget: MAX_THINKING_BUDGET };

        const contents = options.history ? [...options.history, { role: 'user', parts }] : [{ role: 'user', parts }];
        const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ model, contents, config }));
        
        return { 
            text: response.text || "", 
            generatedMedia: [], 
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
        };
    } catch (error: any) { 
        handleGeminiError(error);
        throw error;
    }
};

const handleGeminiError = (error: any) => {
    console.error("[Gemini Service Error]:", error);
    
    // VERBOSE 400 DIAGNOSTIC
    if (error.status === 400 || error.message?.includes('400')) {
        console.group("[400 DIAGNOSTIC]");
        console.error("Status Code:", error.status);
        console.error("Error Message:", error.message);
        console.error("Stack Trace:", error.stack);
        console.groupEnd();
    }

    let userMessage = "Unable to connect to Gemini AI...";
    if (error?.message?.toLowerCase().includes('api key')) userMessage = "API key issue detected.";
    else if (error?.status === 429) userMessage = "Rate limit reached.";
    showToast(userMessage, 'error');
};

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export class LiveConnection {
    public sessionPromise: Promise<any> | null = null;
    async connect(callbacks: any, options: any = {}) {
        const ai = getClient();
        const settings = await getState<UserSettings>('assets', 'user_settings');
        const resonanceContext = getResonanceInstruction(settings);
        const enhancedInstruction = `${options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION}\n\n${resonanceContext}`;

        this.sessionPromise = ai.live.connect({
            model: MODELS.LIVE_MODEL,
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voiceName || 'Zephyr' } } }, 
                systemInstruction: enhancedInstruction,
                tools: [{ googleSearch: {} }]
            },
            callbacks: {
                onopen: () => callbacks.onopen?.(),
                onmessage: async (message) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) callbacks.onAudioData?.(base64Audio);
                    if (message.serverContent?.interrupted) callbacks.onInterrupted?.();
                },
                onerror: (e) => callbacks.onerror?.(e),
                onclose: (e) => callbacks.onclose?.(e)
            }
        });
        return this.sessionPromise;
    }
    sendAudio(data: Float32Array) {
        if (!this.sessionPromise) return;
        this.sessionPromise.then((session) => {
            const int16 = new Int16Array(data.length);
            for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
            session.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
        });
    }
    async disconnect() {
        if (this.sessionPromise) {
            this.sessionPromise.then(session => session.close());
            this.sessionPromise = null;
        }
    }
}

export async function decodeAudioDataToPCM(base64Data: string, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const binaryString = atob(base64Data);
  const dataInt16 = new Int16Array(new Uint8Array(Array.from(binaryString).map(c => c.charCodeAt(0))).buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

export const connectPersonalKey = async () => { try { await (window as any).aistudio.openSelectKey(); return true; } catch (e) { return false; } };
export const checkKeyStatus = async () => { try { return await (window as any).aistudio.hasSelectedApiKey(); } catch (e) { return false; } };
export const generateMetabolicForecast = async (readings: any[], moods: any[]): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({ model: DEFAULT_MODEL, contents: `Forecast: ${JSON.stringify(readings)} ${JSON.stringify(moods)}` });
    return response.text || "Stable.";
};
export const calculateSystemDrift = async (readings: any[], moods: any[], chatContext: string): Promise<{ driftPercentage: number }> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `JSON drift check for: ${chatContext}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { driftPercentage: { type: Type.NUMBER } }, required: ['driftPercentage'] } }
    });
    try { return JSON.parse(response.text || '{"driftPercentage": 0}'); } catch { return { driftPercentage: 0 }; }
};
export const interpretDream = async (description: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({ model: DEFAULT_MODEL, contents: `Interpret dream: ${description}` });
    return response.text || "";
};
export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({ model: DEFAULT_MODEL, contents: [{ inlineData: { data: base64Data, mimeType } }, { text: "Transcribe strictly." }] });
    return response.text || "";
};
export const orchestrateCouncilVerdict = async (petition: string, context: any): Promise<any> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: ADVANCED_MODEL,
        contents: `Ruling on: ${petition}`,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, ruling: { type: Type.STRING }, score: { type: Type.STRING }, majorityOpinion: { type: Type.STRING }, votes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { memberId: { type: Type.STRING }, vote: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ['memberId', 'vote', 'reason'] } } }, required: ['question', 'ruling', 'score', 'majorityOpinion', 'votes'] } }
    });
    return JSON.parse(response.text || "{}");
};
