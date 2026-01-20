
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

    async connect(callbacks: any, options: any = {}) {
        const ai = getClient();
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
                onopen: () => {
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
                    if (callbacks.onclose) callbacks.onclose(e);
                }
            }
        });
        return this.sessionPromise;
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
        contents: `Analyze readings: ${JSON.stringify(readings)} and moods: ${JSON.stringify(moods)}. Provide a short metabolic trajectory forecast.`
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
                required: ['question', 'ruling', 'score', 'majorityOpinion', 'votes']
            }
        }
    });
    return JSON.parse(response.text || "{}");
};
