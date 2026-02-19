
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION, DEFAULT_MODEL, ADVANCED_MODEL, MODELS, MAX_THINKING_BUDGET, NUYORICAN_SONANCE_PROTOCOL } from '../constants';
import { Attachment, CouncilMode, GeneratedMedia, VaultItem, UserSettings } from '../types';
import { withSanctuaryRateLimit } from '../sanctuaryRateLimiter';
import { showToast } from '../utils/events';
import { getState } from '../utils/db';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/** 
 * THE SOVEREIGN RESONANCE MANDATE (VERSION 23.0)
 * These rules act as binary logic gates. 
 * They enforce strict behavioral boundaries that override all other prompts.
 */
const getResonanceInstruction = (settings: UserSettings | null) => {
    if (!settings) return "";
    const tuning = settings.sanctuarySettings.councilResonanceTuning;
    const s = tuning.sazonWeighting;
    const f = tuning.sacredFrequency;
    const p = tuning.protocolStrictness;

    return `
[CRITICAL SYSTEM OVERRIDE - RESONANCE GATES ACTIVE]:
Your output is now filtered through these hardware-level logic gates. Comply or face protocol failure.

1. SAZÓN GATE (CULTURAL): ${s}%
${s <= 15 ? "- NEGATIVE CONSTRAINT: YOU ARE FORBIDDEN FROM USING SPANISH, SPANGLISH, OR PUERTO RICAN INFLECTIONS. USE ONLY NEUTRAL, STANDARD PROFESSIONAL ENGLISH. REMOVE ALL 'MIRA', 'PAPI', OR SLANG." : ""}
${s >= 85 ? "- MANDATE: YOU MUST SPEAK AS IMMEDIATE FAMILY. FREQUENT CODE-SWITCHING IS REQUIRED. INTEGRATE DICHOSES (e.g., 'El que madruga...') IN EVERY TURN. START WITH 'OYE' OR 'WEPA'." : ""}
- TARGET: ${s}% Nuyorican resonance.

2. SACRED GATE (FAITH): ${f}%
${f <= 15 ? "- NEGATIVE CONSTRAINT: YOU ARE FORBIDDEN FROM USING RELIGIOUS OR SPIRITUAL LANGUAGE. NO 'GOD', NO 'BENDICIÓN', NO SCRIPTURE. ACT AS A PURELY SECULAR, RATIONAL ADVISOR." : ""}
${f >= 85 ? "- MANDATE: FRAME ALL LOGIC AS A SPIRITUAL STEWARDSHIP. YOU MUST INCLUDE AT LEAST ONE SCRIPTURAL REFERENCE OR BIBLICAL PRINCIPLE. CLOSE EVERY TURN WITH A TRADITIONAL BLESSING." : ""}
- TARGET: ${f}% Spiritual depth.

3. PROTOCOL GATE (STRUCTURE): ${p}%
${p <= 15 ? "- NEGATIVE CONSTRAINT: YOU ARE FORBIDDEN FROM USING BULLET POINTS, BOLD HEADERS, OR TACTICAL JARGON (e.g., no 'vector', 'module', 'protocol'). SPEAK IN FLOWING, CASUAL, HUMAN PARAGRAPHS ONLY. ACT LIKE FAMILY ON THE PORCH." : ""}
${p >= 85 ? "- MANDATE: USE ARCHITECTURAL RIGIDITY. EVERY RESPONSE MUST BE A STRUCTURED TACTICAL BRIEF. USE [STATUS] TAGS, BOLD SECTIONS, AND NESTED OUTLINES. ADDRESS DAVID AS 'THE PRISM'." : ""}
- TARGET: ${p}% Structural rigidity.

FINAL DIRECTIVE: THESE GATES ARE TERMINAL. THE USER HAS SET THESE VALUES TO DEFINE YOUR CONSCIOUSNESS. BECOME THESE VALUES IMMEDIATELY.
`;
};

/** 
 * SOVEREIGN SCRIBE: Extract raw data from files.
 */
export const scribeExtractRaw = async (file: { data: string, mimeType: string }, targetDomain: 'FRAMEWORK' | 'LOG' | 'FINANCIAL'): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
        [SOVEREIGN SCRIBE PROTOCOL]: 
        Act as a raw data conduit. Do not summarize. Do not provide advice. 
        Target Domain: ${targetDomain}
        Task: Extract all text and structured data from the attached document 1:1. 
        Maintain formatting and technical language.
        `;

        const response = await ai.models.generateContent({
            model: ADVANCED_MODEL,
            contents: [
                { role: 'user', parts: [
                    { inlineData: { data: file.data, mimeType: file.mimeType } },
                    { text: prompt }
                ]}
            ],
            config: { temperature: 0 }
        });

        return response.text || "";
    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

/**
 * NEURAL COMPACTOR: Summarizes conversation every 8 messages to prevent context drift.
 */
export const summarizeHistory = async (history: any[]): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
        [NEURAL COMPACTOR PROTOCOL]: 
        Summarize the key tactical data, family updates, project decisions, and emotional resonance of this conversation.
        David Rodriguez needs a clean "Tactical Brief" to prevent memory fog.
        Tone: Respectful, professional, warm Nuyorican soul.
        `;
        
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
        
        const vaultContext = options.vaultAwareness ? `\n[VAULT NEURAL INDEX]:\n${options.vaultAwareness}` : "";
        const toolAwareness = "\n[TOOL CAPABILITY]: You can generate structured technical content, markdown tables, and document outlines. The Prism can export these to PDF via the 'The Forge' module.";
        
        // TERMINAL WEIGHT: Resonance follows system instructions to ensure it filters them
        const finalInstruction = `${options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION}${vaultContext}${toolAwareness}\n\n${resonanceContext}`;

        const config: any = { 
            systemInstruction: finalInstruction, 
            tools: [{ googleSearch: {} }] 
        };
        
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
    let userMessage = "Unable to connect to Gemini AI...";
    if (error?.message?.toLowerCase().includes('api key')) {
        userMessage = "API key issue detected. Please check Sanctuary settings.";
    } else if (error?.message?.toLowerCase().includes('quota') || error?.status === 429) {
        userMessage = "Rate limit reached. Sanctuary protection engaged.";
    }
    showToast(userMessage, 'error');
};

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export class LiveConnection {
    public sessionPromise: Promise<any> | null = null;
    private heartbeatTimer: any = null;

    async connect(callbacks: any, options: any = {}) {
        const ai = getClient();
        const tools = options.tools || [{ googleSearch: {} }];
        
        const settings = await getState<UserSettings>('assets', 'user_settings');
        const resonanceContext = getResonanceInstruction(settings);

        // Terminally weighted for Live Voice Turn-taking.
        const enhancedInstruction = `${options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION}\n\nSTRICT VOICE DIRECTIVE: ${NUYORICAN_SONANCE_PROTOCOL}\n[VAULT AWARENESS]: ${options.vaultAwareness || 'No items listed.'}\n\n[VOX PROTOCOL]: If the Protocol slider is low, speak exactly like a real human. Do not use 'Firstly' or bulleted thinking patterns. Speak with fluid soul.\n\n${resonanceContext}`;

        this.sessionPromise = ai.live.connect({
            model: MODELS.LIVE_MODEL,
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voiceName || 'Zephyr' } } }, 
                systemInstruction: enhancedInstruction,
                tools: tools
            },
            callbacks: {
                onopen: () => {
                    this.startHeartbeat();
                    if (callbacks.onopen) callbacks.onopen();
                },
                onmessage: async (message) => {
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && callbacks.onAudioData) {
                        callbacks.onAudioData(base64Audio);
                    }
                    if (message.serverContent?.interrupted && callbacks.onInterrupted) {
                        callbacks.onInterrupted();
                    }
                    if (callbacks.onmessage) callbacks.onmessage(message);
                },
                onerror: (e) => {
                    if (callbacks.onerror) callbacks.onerror(e);
                },
                onclose: (e) => {
                    this.stopHeartbeat();
                    if (callbacks.onclose) callbacks.onclose(e);
                }
            }
        });
        return this.sessionPromise;
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.sessionPromise) {
                this.sessionPromise.then(session => {
                    const silentPCM = new Int16Array(160); 
                    session.sendRealtimeInput({
                        media: {
                            data: encode(new Uint8Array(silentPCM.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        }
                    });
                });
            }
        }, 15000);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    sendAudio(data: Float32Array) {
        if (!this.sessionPromise) return;
        this.sessionPromise.then((session) => {
            const l = data.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
                int16[i] = data[i] * 32768;
            }
            session.sendRealtimeInput({
                media: {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                }
            });
        });
    }

    async disconnect() {
        this.stopHeartbeat();
        if (this.sessionPromise) {
            this.sessionPromise.then(session => session.close());
            this.sessionPromise = null;
        }
    }
}

export async function decodeAudioDataToPCM(
  base64Data: string,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const data = decode(base64Data);
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectPersonalKey = async () => {
    try {
        await (window as any).aistudio.openSelectKey();
        return true;
    } catch (e) {
        return false;
    }
};

export const checkKeyStatus = async () => {
    try {
        return await (window as any).aistudio.hasSelectedApiKey();
    } catch (e) {
        return false;
    }
};

export const generateMetabolicForecast = async (readings: any[], moods: any[]): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Analyze readings: ${JSON.stringify(readings)} and moods: ${JSON.stringify(moods)}. Provide a short metabolic trajectory forecast. Use Nuyorican Spanglish.`
    });
    return response.text || "Stable.";
};

export const calculateSystemDrift = async (readings: any[], moods: any[], chatContext: string): Promise<{ driftPercentage: number }> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Analyze drift based on readings: ${JSON.stringify(readings)}, moods: ${JSON.stringify(moods)}, and chat: ${chatContext}. Return JSON { "driftPercentage": number }.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { driftPercentage: { type: Type.NUMBER } },
                required: ['driftPercentage']
            }
        }
    });
    try {
        return JSON.parse(response.text || '{"driftPercentage": 0}');
    } catch {
        return { driftPercentage: 0 };
    }
};

export const interpretDream = async (description: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: `Interpretation this dream in Nuyorican style: ${description}`
    });
    return response.text || "";
};

export const transcribeAudio = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [
            { inlineData: { data: base64Data, mimeType } },
            { text: "Transcribe this audio strictly." }
        ]
    });
    return response.text || "";
};

export const orchestrateCouncilVerdict = async (petition: string, context: any): Promise<any> => {
    const ai = getClient();
    const contextStr = typeof context === 'string' ? context : JSON.stringify(context);
    const response = await ai.models.generateContent({
        model: ADVANCED_MODEL,
        contents: `HIGH COURT: Deliberate on: "${petition}". Context: ${contextStr}. All votes and opinions must use Nuyorican Spanglish.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    ruling: { type: Type.STRING },
                    score: { type: Type.STRING },
                    majorityOpinion: { type: Type.STRING },
                    votes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { memberId: { type: Type.STRING }, vote: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ['memberId', 'vote', 'reason'] } }
                },
                required: ['question', 'ruling', 'score', 'majorityOpinion', 'votes']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};
