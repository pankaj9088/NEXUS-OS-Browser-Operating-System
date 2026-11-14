import { AIMessage } from '../types/os';
import { api } from './apiClient';

export interface AIServiceStreamOptions {
  messages: AIMessage[];
  conversationId?: string;
  onChunk: (chunkText: string) => void;
  onDone: (fullText: string, source: 'cloud-ai' | 'local-simulation') => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export interface IAIService {
  streamMessage(options: AIServiceStreamOptions): Promise<void>;
}

class FullStackAIService implements IAIService {
  async streamMessage(options: AIServiceStreamOptions): Promise<void> {
    const { messages, conversationId, onChunk, onDone, onError, signal } = options;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = api.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          conversationId,
          messages: messages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          stream: true,
        }),
        signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';
      let detectedSource: 'cloud-ai' | 'local-simulation' = 'cloud-ai';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.source) {
                detectedSource = data.source;
              }
              if (data.chunk) {
                accumulated += data.chunk;
                onChunk(accumulated);
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (err: any) {
              if (err.message && err.message !== 'Unexpected end of JSON input') {
                console.warn('SSE parse error:', err);
              }
            }
          }
        }
      }

      onDone(accumulated || 'Response received.', detectedSource);
    } catch (err: any) {
      if (signal?.aborted) {
        return;
      }
      console.warn('Backend AI stream unavailable, running local simulation:', err);
      // Fallback to local heuristic simulation
      await this.runLocalSimulation(options);
    }
  }

  private async runLocalSimulation(options: AIServiceStreamOptions): Promise<void> {
    const { messages, onChunk, onDone, signal } = options;
    const lastUserMessage = [...messages].reverse().find((m) => m.sender === 'user');
    const prompt = lastUserMessage?.text || 'Hello';
    const lower = prompt.toLowerCase();

    let fullAnswer = '';

    if (lower.includes('schedule') || lower.includes('algorithm') || lower.includes('task')) {
      fullAnswer = `### Task Scheduling Heuristic (WASM Hypervisor)

In **NEXUS OS**, tasks are prioritized according to interactive latency budgets and process ownership.

\`\`\`typescript
export interface ProcessTask {
  pid: number;
  priority: 'realtime' | 'high' | 'normal' | 'idle';
  cpuBudgetMs: number;
  execute: () => Promise<void>;
}

export class NexusScheduler {
  private queue: ProcessTask[] = [];

  public dispatchNext(): ProcessTask | null {
    if (this.queue.length === 0) return null;
    return this.queue.sort((a, b) => (a.priority === 'realtime' ? -1 : 1)).shift() ?? null;
  }
}
\`\`\`

#### Key Characteristics:
1. **Compositor Isolation**: Render loops run with a guaranteed 16.6ms window budget.
2. **Deterministic Preemption**: Long-running computational kernels yield via microtask breaks.`;
    } else if (lower.includes('terminal') || lower.includes('command') || lower.includes('cli')) {
      fullAnswer = `### Nexus Shell Command Reference

The built-in **Nexus Terminal** supports safe sandboxed operations:

- \`help\` — Display manual of available commands
- \`ls\` & \`pwd\` — Inspect working directory path
- \`cat <file>\` — Read virtual text & code files
- \`open <app>\` — Launch desktop apps (e.g., \`open notes\`, \`open files\`, \`open calculator\`)
- \`theme dark\` / \`theme light\` — Switch operating system theme mode
- \`date\` & \`time\` — Display real-time system clock values
- \`clear\` — Reset the console viewport`;
    } else if (lower.includes('file') || lower.includes('storage') || lower.includes('upload')) {
      fullAnswer = `### Virtual Filesystem Architecture

The **Files** application uses a unified storage abstraction layer:

- **Local Sample Files**: Pre-bundled system manifests, markdown docs, and scripts.
- **User Uploads**: Any file uploaded via the upload button is parsed and stored in the virtual filesystem.
- **Download Capability**: Files can be exported as real disk downloads at any time.`;
    } else {
      fullAnswer = `I have analyzed your prompt: **"${prompt}"**.

In **NEXUS OS**, all application windows run as decoupled modular components within an event-driven Zustand state store.

Would you like me to:
1. Generate code for an automation script?
2. Explain filesystem commands for the Terminal?
3. Create a reminder in the Calendar application?`;
    }

    const words = fullAnswer.split(/(\s+)/);
    let accumulated = '';

    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
      if (signal?.aborted) return;

      accumulated += words[i];
      onChunk(accumulated);
    }

    onDone(accumulated, 'local-simulation');
  }
}

export const aiService: IAIService = new FullStackAIService();
