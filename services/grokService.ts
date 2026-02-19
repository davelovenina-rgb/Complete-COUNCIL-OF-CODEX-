
import { getState } from '../utils/db';
import { ConnectorConfig } from '../types';

export const sendMessageToGrok = async (text: string, systemInstruction?: string, history: any[] = []) => {
    const configs = await getState<Record<string, ConnectorConfig>>('connector_configs') || {};
    const config = configs['grok-api'];

    if (!config || !config.apiKey) {
        throw new Error("Grok Pillar is not seated.");
    }

    const messages: any[] = [
        { role: 'system', content: systemInstruction }
    ];

    history.forEach(h => {
        messages.push({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts[0].text
        });
    });

    messages.push({ role: 'user', content: text });

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: 'grok-2',
                messages: messages
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`[Grok Error] ${err.error?.message || 'Signal Lost'}`);
        }

        const data = await response.json();
        return {
            text: data.choices[0].message.content,
            generatedMedia: []
        };
    } catch (error: any) {
        console.error("Grok Error:", error);
        throw error;
    }
};
