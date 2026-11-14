import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Square, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Cpu
} from 'lucide-react';
import { useAIStore } from '../../../store/aiStore';
import { AIMessage } from '../../../types/os';
import { aiService } from '../../../services/aiService';

export const AssistantApp: React.FC = () => {
  const conversations = useAIStore((s) => s.conversations);
  const activeConvoId = useAIStore((s) => s.activeConvoId);
  const isStreaming = useAIStore((s) => s.isStreaming);
  const createConversation = useAIStore((s) => s.createConversation);
  const deleteConversation = useAIStore((s) => s.deleteConversation);
  const clearConversation = useAIStore((s) => s.clearConversation);
  const setActiveConvoId = useAIStore((s) => s.setActiveConvoId);
  const addMessage = useAIStore((s) => s.addMessage);
  const updateMessageText = useAIStore((s) => s.updateMessageText);
  const finalizeMessage = useAIStore((s) => s.finalizeMessage);
  const setStreaming = useAIStore((s) => s.setStreaming);
  const fetchConversations = useAIStore((s) => s.fetchConversations);

  useEffect(() => {
    fetchConversations?.();
  }, [fetchConversations]);

  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = conversations.find((c) => c.id === activeConvoId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages, isStreaming]);

  const handleNewConversation = () => {
    createConversation();
  };

  const handleClearCurrentConversation = () => {
    if (!activeConvo) return;
    clearConversation(activeConvo.id);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStreaming(false);
    }
  };

  const sendMessage = async (promptToSend?: string) => {
    const query = (promptToSend || input).trim();
    if (!query || isStreaming || !activeConvo) return;

    const userMessage: AIMessage = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    const aiMessageId = `m-ai-${Date.now()}`;
    const placeholderAIMessage: AIMessage = {
      id: aiMessageId,
      sender: 'ai',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      source: 'local-simulation',
    };

    addMessage(activeConvo.id, userMessage);
    addMessage(activeConvo.id, placeholderAIMessage);

    if (!promptToSend) setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await aiService.streamMessage({
        conversationId: activeConvo.id,
        messages: [...activeConvo.messages, userMessage],
        signal: controller.signal,
        onChunk: (chunkText) => {
          updateMessageText(activeConvo.id, aiMessageId, chunkText);
        },
        onDone: (fullText, source) => {
          finalizeMessage(activeConvo.id, aiMessageId, fullText, source);
          abortControllerRef.current = null;
        },
        onError: (err) => {
          updateMessageText(activeConvo.id, aiMessageId, `Error during stream generation: ${err.message}`);
          setStreaming(false);
          abortControllerRef.current = null;
        },
      });
    } catch {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (!activeConvo || isStreaming) return;
    const lastUserMsg = [...activeConvo.messages].reverse().find((m) => m.sender === 'user');
    if (lastUserMsg) {
      sendMessage(lastUserMsg.text);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 1500);
  };

  // Simple Markdown Parser with Code Block detection
  const renderMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = language ? lines.slice(1).join('\n') : lines.join('\n');
        const codeId = `code-${idx}-${part.length}`;

        return (
          <div key={idx} className="my-2.5 rounded-xl bg-slate-950/90 border border-white/10 overflow-hidden font-mono text-xs">
            <div className="px-3 py-1.5 bg-white/5 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-cyan-400">{language || 'code'}</span>
              <button
                onClick={() => copyText(code, codeId)}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Copy Code"
              >
                {copiedMessageId === codeId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-cyan-300 leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Prose formatting: render headers, bullets, bold
      const formattedLines = part.split('\n').map((line, lIdx) => {
        if (line.startsWith('### ')) {
          return <h4 key={lIdx} className="text-sm font-bold text-white mt-2 mb-1">{line.slice(4)}</h4>;
        }
        if (line.startsWith('#### ')) {
          return <h5 key={lIdx} className="text-xs font-bold text-slate-200 mt-2 mb-0.5">{line.slice(5)}</h5>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-2 my-0.5">
              <span className="text-cyan-400 leading-tight">·</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        return <p key={lIdx} className="my-1 leading-relaxed">{line}</p>;
      });

      return <div key={idx}>{formattedLines}</div>;
    });
  };

  return (
    <div className="flex h-full w-full bg-[#070b14] text-slate-200 select-text font-sans">
      {/* Sidebar: Conversations */}
      <div
        className={`${
          isSidebarOpen ? 'w-56' : 'w-0'
        } bg-slate-950/70 border-r border-white/5 flex flex-col shrink-0 transition-all duration-200 overflow-hidden select-none`}
      >
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={handleNewConversation}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((convo) => {
            const isActive = convo.id === activeConvo?.id;
            return (
              <div
                key={convo.id}
                onClick={() => setActiveConvoId(convo.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white font-medium border border-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{convo.title}</span>
                </div>
                {conversations.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteConversation(convo.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-rose-400 transition-opacity ml-1"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Bar */}
        <div className="h-10 px-3 bg-slate-950/80 border-b border-white/5 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>{activeConvo?.title || 'Nexus Copilot'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation mode indicator badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-300 font-mono">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>Local Kernel Stream Mode</span>
            </div>

            <button
              onClick={handleClearCurrentConversation}
              className="p-1 rounded text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeConvo?.messages.map((m) => {
            const isAI = m.sender === 'ai';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                    isAI
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isAI
                      ? 'bg-slate-900/80 border border-white/5 text-slate-200'
                      : 'bg-cyan-600/30 border border-cyan-500/30 text-white'
                  }`}
                >
                  {/* Origin tag for AI responses */}
                  {isAI && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 text-[10px] text-slate-400 font-mono">
                      <span>Nexus Copilot</span>
                      <span className="text-cyan-400/80">Local Simulation</span>
                    </div>
                  )}

                  {/* Body Content */}
                  <div>{renderMessageContent(m.text || '...')}</div>

                  {/* Actions row */}
                  {isAI && !m.isStreaming && m.text && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyText(m.text, m.id)}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          {copiedMessageId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Response</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Streaming Controls */}
        <div className="p-3 bg-slate-950/80 border-t border-white/5 select-none">
          {/* Stop / Regenerate buttons */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  onClick={handleStopGeneration}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-300" />
                  <span>Stop Generation</span>
                </button>
              ) : (
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Regenerate Response</span>
                </button>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Tokens streamed with WebEngine worker
            </div>
          </div>

          {/* Prompt form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Nexus Copilot (e.g. 'Write a task queue algorithm' or 'List terminal commands')..."
              disabled={isStreaming}
              className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-100 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
