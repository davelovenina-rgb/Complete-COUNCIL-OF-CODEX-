import { getState } from '../utils/db';
import { ConnectorConfig } from '../types';

const CLAUDE_MODEL = 'claude-3-haiku-20240307';

export const sendMessageToClaude = async (
    text: string, 
    systemInstruction?: string
) => {
    const configs = await getState<Record<string, ConnectorConfig>>('connector_configs') || {};
    const config = configs['claude-api'];

    if (!config || !config.apiKey) {
        throw new Error("Claude Pillar is not seated.");
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
                'dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                system: systemInstruction,
                messages: [
                    { role: 'user', content: text }
                ]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        return {
            text: data.content[0].text,
            generatedMedia: []
        };
    } catch (error: any) {
        console.error("Claude Error:", error);
        throw error;
    }
};