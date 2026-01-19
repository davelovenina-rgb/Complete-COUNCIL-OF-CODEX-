
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION, DEFAULT_MODEL, ADVANCED_MODEL, MODELS, MAX_THINKING_BUDGET } from '../constants';
import { Attachment, CouncilMode, GeneratedMedia, VaultItem } from '../types';
import { withSanctuaryRateLimit } from '../sanctuaryRateLimiter';
import { showToast } from '../utils/events';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/** 
 * SOVEREIGN SCRIBE: Extract raw data from files without re-interpretation.
 */
export const scribeExtractRaw = async (file: { data: string, mimeType: string }, targetDomain: 'FRAMEWORK' | 'LOG' | 'FINANCIAL'): Promise<string> => {
    try {
        const ai = getClient();
        const prompt = `
        [SOVEREIGN SCRIBE PROTOCOL]: 
        Act as a raw data conduit. Do not summarize. Do not provide advice. 
        Target Domain: ${targetDomain}
        Task: Extract all text and structured data from the attached document 1:1. 
        Maintain formatting and technical language. If it is a framework, extract the rules. If a log, extract the timestamps and values.
        `;

        const response = await ai.models.generateContent({
            model: ADVANCED_MODEL,
            contents: [
                { role: 'user', parts: [
                    { inlineData: { data: file.data, mimeType: file.mimeType } },
                    { text: prompt }
                ]}
            ],
            config: { temperature: 0 } // Rigid extraction
        });

        return response.text || "";
    } catch (error: any) {
        handleGeminiError(error);
        throw error;
    }
};

export const sendMessageToGemini = async (text: string, mode: CouncilMode, attachments: Attachment[] = [], options: { 
    aspectRatio?: string; 
    imageSize?: '1K' | '2K' | '4K';
    systemInstruction?: string; 
    useTurboMode?: boolean; 
    history?: any[];
    highQuality?: boolean;
    vaultAwareness?: string; // Neural Index of the Vault
    linguisticWeight?: number; // Sazón Weighting
} = {}): Promise<{ text: string; generatedMedia: GeneratedMedia[]; groundingMetadata?: any; }> => {
    try {
        const ai = getClient(); 
        
        // Handle specialized generative modes...
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
            const videoUrl = `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
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

        // Build Augmented Instruction
        const vaultContext = options.vaultAwareness ? `\n[VAULT NEURAL INDEX]:\n${options.vaultAwareness}` : "";
        const sazonContext = options.linguisticWeight !== undefined ? `\n[SAZÓN RESONANCE LEVEL]: ${Math.round(options.linguisticWeight * 100)}%. ${options.linguisticWeight > 0.6 ? "Prioritize Nuyorican flavor and Spanglish." : "Prioritize analytical precision."}` : "";
        
        const finalInstruction = `${options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION}${vaultContext}${sazonContext}`;

        const config: any = { systemInstruction: finalInstruction, tools: [{ googleSearch: {} }] };
        if (mode === 'ARCHITECT') config.thinkingConfig = { thinkingBudget: MAX_THINKING_BUDGET };

        const contents = options.history ? [...options.history, { role: 'user', parts }] : [{ role: 'user', parts }];
        const response = await withSanctuaryRateLimit<GenerateContentResponse>(() => ai.models.generateContent({ model, contents, config }));
        
        return { text: response.text || "", generatedMedia: [], groundingMetadata: response.candidates?.[0]?.groundingMetadata };
    } catch (error: any) { 
        handleGeminiError(error);
        throw error;
    }
};

/**
 * Enhanced Error Detection & User Feedback
 */
const handleGeminiError = (error: any) => {
    console.error("[Gemini Service Error]:", error);
    let userMessage = "Unable to connect to Gemini AI...";
    
    // Detect specific error types
    if (error?.message?.toLowerCase().includes('api key')) {
        userMessage = "API key issue detected. Please check Sanctuary settings.";
        showToast(userMessage, 'error');
    } else if (error?.message?.toLowerCase().includes('quota') || error?.message?.toLowerCase().includes('rate limit')) {
        userMessage = "Rate limit reached. Please wait a moment and try again.";
        showToast(userMessage, 'error');
    } else if (error?.status === 429) {
        userMessage = "Too many requests. The Sanctuary rate limiter is protecting your quota.";
        showToast(userMessage, 'error');
    } else if (error?.status === 401 || error?.status === 403) {
        userMessage = "Authentication failed. Signal access denied.";
        showToast(userMessage, 'error');
    }

    const enhancedError = new Error(userMessage);
    (enhancedError as any).originalError = error;
};

/**
 * PCM ENCODING: Guideline-compliant manual implementation.
 */
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * PCM DECODING: Guideline-compliant manual implementation.
 */
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
    private session: any = null;

    async connect(callbacks: any, options: any = {}) {
        const ai = getClient();
        
        // Grounding Protocol: Enable Google Search for Live Voice
        const tools = options.tools || [{ googleSearch: {} }];

        this.sessionPromise = ai.live.connect({
            model: MODELS.LIVE_MODEL,
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: options.voiceName || 'Zephyr' } } }, 
                systemInstruction: options.systemInstruction || GEMINI_SYSTEM_INSTRUCTION,
                tools: tools
            },
            callbacks: {
                ...callbacks,
                onopen: () => {
                    this.sessionPromise?.then(s => {
                        this.session = s;
                        if (callbacks.onopen) callbacks.onopen();
                    });
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
                }
            }
        });
        return this.sessionPromise;
    }

    /**
     * Sends audio data through the active session.
     */
    sendAudio(data: Float32Array) {
        this.sessionPromise?.then((session) => {
            const l = data.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
                int16[i] = data[i] * 32768;
            }
            const base64 = encode(new Uint8Array(int16.buffer));
            session.sendRealtimeInput({
                media: {
                    data: base64,
                    mimeType: 'audio/pcm;rate=16000',
                }
            });
        });
    }

    async disconnect() {
        if (this.session) {
            this.session.close();
            this.session = null;
        }
        this.sessionPromise = null;
    }
}

/**
 * EXPORTED PCM DECODER: Required by DriveMode component.
 */
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

/**
 * MANDATORY API KEY SELECTION
 * Guideline compliant window.aistudio interaction.
 */
export const connectPersonalKey = async () => {
    try {
        await (window as any).aistudio.openSelectKey();
        return true;
    } catch (e) {
        console.error("Key selection failed:", e);
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
        contents: `Analyze readings: ${JSON.stringify(readings)} and moods: ${JSON.stringify(moods)}. Provide a short metabolic trajectory forecast.`
    });
    return response.text || "Stable.";
};

export const calculateSystemDrift = async (readings: any[], moods: any[], chatContext: string): Promise<{ driftPercentage: number }> => {
    const ai = getClient();
    const prompt = `Analyze drift based on readings: ${JSON.stringify(readings)}, moods: ${JSON.stringify(moods)}, and chat: ${chatContext}. Return JSON { "driftPercentage": number }.`;
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { driftPercentage: { type: Type.NUMBER } },
                required: ['driftPercentage'],
                propertyOrdering: ['driftPercentage']
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
        contents: `Interpret this dream: ${description}`
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
        contents: `HIGH COURT: Deliberate on: "${petition}". Context: ${contextStr}`,
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
                required: ['question', 'ruling', 'score', 'majorityOpinion', 'votes'],
                propertyOrdering: ["question", "ruling", "score", "majorityOpinion", "votes"]
            }
        }
    });
    return JSON.parse(response.text || "{}");
};
