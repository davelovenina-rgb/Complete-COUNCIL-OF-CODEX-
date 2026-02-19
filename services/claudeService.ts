
import { getState } from '../utils/db';
import { ConnectorConfig } from '../types';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

export const sendMessageToClaude = async (
    text: string, 
    systemInstruction?: string,
    history: any[] = []
) => {
    const configs = await getState<Record<string, ConnectorConfig>>('connector_configs') || {};
    const config = configs['claude-api'];

    if (!config || !config.apiKey) {
        throw new Error("Claude Pillar is not seated.");
    }

    // Convert history format to Claude format
    const messages = history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
    }));

    // Add current message
    messages.push({ role: 'user', content: text });

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
                // CRITICAL FIX: The old dangerously-allow-browser is deprecated. Use the specific Anthropic header.
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 4096,
                system: systemInstruction,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`[Claude 400] ${errorData.error?.message || 'Signal Error'}`);
        }

        const data = await response.json();
        return {
            text: data.content[0].text,
            generatedMedia: []
        };
    } catch (error: any) {
        console.error("Claude Service Error:", error);
        throw error;
    }
};
