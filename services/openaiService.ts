import { getState } from '../utils/db';
import { ConnectorConfig } from '../types';

export const sendMessageToOpenAI = async (text: string, systemInstruction?: string) => {
    const configs = await getState<Record<string, ConnectorConfig>>('connector_configs') || {};
    const config = configs['openai-api'];

    if (!config || !config.apiKey) {
        throw new Error("OpenAI Pillar is not seated.");
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: text }
                ]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        return {
            text: data.choices[0].message.content,
            generatedMedia: []
        };
    } catch (error: any) {
        console.error("OpenAI Error:", error);
        throw error;
    }
};