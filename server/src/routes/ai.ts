import { Router, Request, Response } from 'express';
import { getGeminiClient } from '../config/gemini';
import { db, ConversationRecord, AIMessageRecord } from '../store/memoryDb';
import { authenticateUser } from './auth';

export const aiRouter = Router();

const SYSTEM_INSTRUCTION = `You are the Nexus OS AI Copilot, a futuristic, capable, and helpful browser operating system assistant.
You specialize in:
1. Assisting users with Nexus OS operations, commands, shortcuts, and application capabilities.
2. Writing clean, idiomatic code in TypeScript, JavaScript, Python, Bash, HTML/CSS.
3. Troubleshooting virtual filesystem and terminal operations.
4. Explaining computing concepts concisely with structured markdown, bullet points, and code snippets.
Keep responses concise, clear, and styled beautifully with markdown.`;

// GET /api/ai/conversations - List conversations for user
aiRouter.get('/conversations', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const userId = user?.id || 'usr_guest';

  const userConversations = db.conversations
    .filter((c) => c.userId === userId || (user?.role === 'guest' && c.userId === 'usr_guest'))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((c) => ({
      id: c.id,
      title: c.title,
      messagesCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[c.messages.length - 1] || null,
    }));

  return res.json({ conversations: userConversations });
});

// POST /api/ai/conversations - Create new conversation
aiRouter.post('/conversations', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const userId = user?.id || 'usr_guest';
  const { title } = req.body || {};

  const newConvo: ConversationRecord = {
    id: `conv-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
    userId,
    title: (title && typeof title === 'string') ? title : 'New Conversation',
    messages: [
      {
        id: `m-init-${Date.now()}`,
        sender: 'ai',
        text: 'How can I assist you today? Ask about operating system architecture, code algorithms, or terminal usage.',
        timestamp: Date.now(),
        source: 'local-simulation',
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  db.conversations.unshift(newConvo);
  db.saveConversations();

  return res.status(201).json({ conversation: newConvo });
});

// GET /api/ai/conversations/:id - Get specific conversation with messages
aiRouter.get('/conversations/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;

  const conversation = db.conversations.find((c) => c.id === id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const isOwner = conversation.userId === user?.id || (user?.role === 'guest' && conversation.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to view this conversation' });
  }

  return res.json({ conversation });
});

// DELETE /api/ai/conversations/:id - Delete a conversation
aiRouter.delete('/conversations/:id', authenticateUser, (req: Request, res: Response): any => {
  const user = (req as any).user;
  const { id } = req.params;

  const index = db.conversations.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const conversation = db.conversations[index];
  const isOwner = conversation.userId === user?.id || (user?.role === 'guest' && conversation.userId === 'usr_guest');
  const isAdmin = user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to delete this conversation' });
  }

  db.conversations.splice(index, 1);
  db.saveConversations();

  return res.json({ success: true, message: 'Conversation deleted' });
});

// POST /api/ai/chat
// Supports both Server-Sent Events (streaming) and standard JSON
aiRouter.post('/chat', authenticateUser, async (req: Request, res: Response): Promise<any> => {
  const user = (req as any).user;
  const userId = user?.id || 'usr_guest';
  const { messages, stream = true, conversationId } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Find or create conversation if tracking is enabled
  let convo: ConversationRecord | undefined;
  if (conversationId) {
    convo = db.conversations.find((c) => c.id === conversationId && (c.userId === userId || user?.role === 'admin'));
  }

  const gemini = getGeminiClient();

  // If no Gemini API key is available, generate smart simulated response
  if (!gemini) {
    const lastUserMsg = [...messages].reverse().find((m: any) => m.sender === 'user' || m.role === 'user');
    const query = lastUserMsg?.text || lastUserMsg?.content || 'Hello';

    const mockText = `I have received your prompt: **"${query}"** in Nexus OS.\n\n*Note: Running in local heuristic mode because GEMINI_API_KEY is not configured in this environment.*\n\nHere are some things you can try in Nexus OS:\n- Open the **Terminal** and run \`help\`, \`ls\`, or \`open notes\`\n- Use **Files** to upload and inspect virtual documents\n- Play **Neon Breakout** in Arcade\n- Create notes with live autosave in **Notes**`;

    // Save to conversation if requested
    if (convo) {
      convo.messages.push({
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        text: query,
        timestamp: Date.now(),
      });
      convo.messages.push({
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: mockText,
        timestamp: Date.now(),
        source: 'local-simulation',
      });
      convo.updatedAt = Date.now();
      db.saveConversations();
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const words = mockText.split(/(\s+)/);
      for (const w of words) {
        res.write(`data: ${JSON.stringify({ chunk: w, done: false, source: 'local-simulation' })}\n\n`);
        await new Promise((r) => setTimeout(r, 20));
      }
      res.write(`data: ${JSON.stringify({ chunk: '', done: true, source: 'local-simulation' })}\n\n`);
      return res.end();
    } else {
      return res.json({
        text: mockText,
        source: 'local-simulation',
      });
    }
  }

  // Format messages for @google/genai
  const formattedContents = messages.map((m: any) => ({
    role: m.sender === 'user' || m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text || m.content || '' }],
  }));

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await gemini.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      let fullGenerated = '';
      for await (const chunk of responseStream) {
        const text = chunk.text || '';
        if (text) {
          fullGenerated += text;
          res.write(`data: ${JSON.stringify({ chunk: text, done: false, source: 'cloud-ai' })}\n\n`);
        }
      }

      if (convo) {
        const lastUser = [...messages].reverse().find((m: any) => m.sender === 'user' || m.role === 'user');
        if (lastUser) {
          convo.messages.push({
            id: `msg-${Date.now()}-user`,
            sender: 'user',
            text: lastUser.text || lastUser.content || '',
            timestamp: Date.now(),
          });
        }
        convo.messages.push({
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text: fullGenerated,
          timestamp: Date.now(),
          source: 'cloud-ai',
        });
        convo.updatedAt = Date.now();
        db.saveConversations();
      }

      res.write(`data: ${JSON.stringify({ chunk: '', done: true, source: 'cloud-ai' })}\n\n`);
      return res.end();
    } else {
      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const text = response.text || '';

      if (convo) {
        const lastUser = [...messages].reverse().find((m: any) => m.sender === 'user' || m.role === 'user');
        if (lastUser) {
          convo.messages.push({
            id: `msg-${Date.now()}-user`,
            sender: 'user',
            text: lastUser.text || lastUser.content || '',
            timestamp: Date.now(),
          });
        }
        convo.messages.push({
          id: `msg-${Date.now()}-ai`,
          sender: 'ai',
          text,
          timestamp: Date.now(),
          source: 'cloud-ai',
        });
        convo.updatedAt = Date.now();
        db.saveConversations();
      }

      return res.json({
        text,
        source: 'cloud-ai',
      });
    }
  } catch (err: any) {
    console.warn('Gemini API Error, falling back to local simulation:', err?.message || err);
    const lastUserMsg = [...messages].reverse().find((m: any) => m.sender === 'user' || m.role === 'user');
    const query = lastUserMsg?.text || lastUserMsg?.content || 'Hello';
    const fallbackText = `I have received your prompt: **"${query}"** in Nexus OS.\n\n*Running in offline resilience mode.*\n\nKey Nexus OS features:\n- **Terminal**: Interactive shell with diagnostics\n- **Files**: Windows-style File Explorer with media previews\n- **Notes**: Persistent notepad\n- **Calendar**: Event schedule planner`;

    if (convo) {
      convo.messages.push({
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: fallbackText,
        timestamp: Date.now(),
        source: 'local-simulation',
      });
      convo.updatedAt = Date.now();
      db.saveConversations();
    }

    if (stream && !res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ chunk: fallbackText, done: true, source: 'local-simulation' })}\n\n`);
      return res.end();
    } else if (stream) {
      res.write(`data: ${JSON.stringify({ chunk: '\n' + fallbackText, done: true, source: 'local-simulation' })}\n\n`);
      return res.end();
    }

    return res.json({
      text: fallbackText,
      source: 'local-simulation',
    });
  }
});
