
import { getState } from '../utils/db';
import { ConnectorConfig } from '../types';

export const sendMessageToOpenAI = async (text: string, systemInstruction?: string, history: any[] = []) => {
    const configs = await getState<Record<string, ConnectorConfig>>('connector_configs') || {};
    const config = configs['openai-api'];

    if (!config || !config.apiKey) {
        throw new Error("OpenAI Pillar is not seated.");
    }

    const messages: any[] = [
        { role: 'system', content: systemInstruction }
    ];

    // Add history
    history.forEach(h => {
        messages.push({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts[0].text
        });
    });

    // Add current message
    messages.push({ role: 'user', content: text });

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messages
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`[OpenAI Error] ${err.error?.message || 'Signal Lost'}`);
        }

        const data = await response.json();
        return {
            text: data.choices[0].message.content,
            generatedMedia: []
        };
    } catch (error: any) {
        console.error("OpenAI Error:", error);
        throw error;
    }
};
