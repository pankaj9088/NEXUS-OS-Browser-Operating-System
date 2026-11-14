import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    aiClient = new GoogleGenAI();
  }
  return aiClient;
}

export const geminiService = {
  isConfigured(): boolean {
    return !!(ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY);
  },

  async generateResponse(prompt: string, history: Array<{ sender: 'ai' | 'user'; text: string }> = []): Promise<string> {
    try {
      const ai = getAIClient();

      const contents = [
        ...history.slice(-8).map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
        { role: 'user', parts: [{ text: prompt }] },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction:
            'You are Nexus Copilot, the autonomous AI assistant for NEXUS OS. Provide concise, clear, and technically precise answers, with code snippets and markdown formatted lists when appropriate.',
        },
      });

      return response.text || 'I have processed your query with nominal status.';
    } catch (error) {
      console.warn('[Nexus Gemini Service]', (error as Error).message);
      throw error;
    }
  },
};
