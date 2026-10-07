import React, { useState, useRef, useEffect } from 'react';
import { AIMessage, Task, TimelineEvent } from '../types';

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveVoice: () => void;
  onOpenProModal?: () => void;
  isPro?: boolean;
  tasks: Task[];
  timeline: TimelineEvent[];
}

export const AICoachModal: React.FC<AICoachModalProps> = ({
  isOpen,
  onClose,
  onOpenLiveVoice,
  onOpenProModal,
  isPro = false,
  tasks,
  timeline,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        'Peace to your workflow. I am your Monastic AI Flow Coach. How may I assist your focus today? I can help decompose heavy tasks, plan silent periods, or ground advice in the latest productivity science.',
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.8-flash' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'
  >('gemini-3.8-flash');
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Prepare context snapshot of current tasks & schedule
  const contextSummary = `
Active Tasks: ${tasks.map((t) => `${t.title} (${t.priority} priority, ${t.durationMin}m, ${t.completed ? 'Completed' : 'Pending'})`).join('; ')}
Timeline Events: ${timeline.map((e) => `${e.time}: ${e.title} [${e.status}]`).join('; ')}
`.trim();

  const handleSendMessage = async (userText = input) => {
    const textToSend = userText.trim();
    if (!textToSend || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation payload for multi-turn
      const payloadMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Automatically enable search if prompt hints at news, research, studies, or explicit grounding
      const isSearchQuery =
        useSearchGrounding ||
        /search|latest|research|study|news|trend|recent|terbaru|studi/i.test(textToSend);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages,
          model: isSearchQuery ? 'gemini-3.5-flash' : selectedModel,
          useSearch: isSearchQuery,
          context: contextSummary,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const rawErr = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error || '');
        if (res.status === 429 || rawErr.includes('429') || rawErr.includes('RESOURCE_EXHAUSTED') || rawErr.includes('quota')) {
          throw new Error('QUOTA_EXHAUSTED');
        }
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      const assistantMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'No response generated.',
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error('Error in chat:', err);
      let content = 'Apologies, I encountered an issue connecting to the AI service. Please try again shortly.';
      
      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes('QUOTA_EXHAUSTED') || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
        content = `### 🕊️ Monastic Advice (Offline Reflection)

Current live API quota is momentarily exhausted. To increase limits, you can select or connect a billing-enabled API key in **Settings > Secrets**.

**In the meantime, consider this focus rule:**
1. Pick your top priority from today's list.
2. Set a timer for 25 minutes of silent work.
3. Keep all notification channels muted until the timer chimes.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content,
          timestamp: Date.now(),
          modelUsed: 'offline-coach',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      label: '⚡ Deconstruct next task',
      prompt: 'Deconstruct my "Finish marketing research proposal" into 3 calm sub-sprints of 15-20 minutes each.',
    },
    {
      label: '🌐 Search attention research',
      prompt: 'Search latest neuroscience research on focus duration and optimal break intervals.',
    },
    {
      label: '🧘 Plan silent period',
      prompt: 'Suggest an optimal silent period schedule given my current agenda for today.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        className="w-full max-w-xl bg-surface-container-lowest border border-surface-container-highest rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[680px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-surface-container-high bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-[15px] font-semibold text-on-surface leading-tight">
                  NOTO AI Flow Coach
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Monastic productivity &amp; deep momentum
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenProModal && !isPro && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProModal();
                }}
                className="px-2.5 py-1 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary text-[11px] font-bold tracking-wider transition-colors cursor-pointer"
                title="Unlock Unlimited AI Chat with NOTO Pro"
              >
                PRO
              </button>
            )}

            {/* Live Voice button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveVoice();
              }}
              title="Open Gemini 3.8 Live Voice conversation"
              className="px-2.5 py-1.5 rounded-full bg-secondary/15 hover:bg-secondary/25 text-secondary text-[11px] font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
              <span className="hidden sm:inline">Voice Mode</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="px-5 py-2 bg-surface-container-low border-b border-surface-container-highest flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="text-on-surface-variant font-medium">Model:</span>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`px-2 py-0.5 rounded-full font-semibold transition-all ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
              title="3.8 Flash (High Quota & Stability)"
            >
              3.8 Flash
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.5-flash')}
              className={`px-2 py-0.5 rounded-full font-semibold transition-all ${
                selectedModel === 'gemini-3.5-flash'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
              title="General tasks & Search Grounding"
            >
              3.5 Flash
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`px-2 py-0.5 rounded-full font-semibold transition-all ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
              title="Fast tasks & micro-advice"
            >
              3.1 Lite (Fast)
            </button>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`px-2 py-0.5 rounded-full font-semibold transition-all ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
              title="Complex strategic reasoning"
            >
              3.1 Pro
            </button>
          </div>

          {/* Search Grounding toggle */}
          <button
            type="button"
            onClick={() => setUseSearchGrounding(!useSearchGrounding)}
            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-semibold transition-all ${
              useSearchGrounding
                ? 'bg-[#3a674f] text-white'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            title="Toggle Google Search data grounding"
          >
            <span className="material-symbols-outlined text-[13px]">travel_explore</span>
            <span>Google Search {useSearchGrounding ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-[14px] leading-relaxed ${
                    isUser
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-surface-container-lowest border border-surface-container-highest text-on-surface rounded-bl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Web Search Sources / Grounding Links */}
                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-surface-container-high space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant flex items-center space-x-1">
                        <span className="material-symbols-outlined text-[12px] text-secondary">
                          travel_explore
                        </span>
                        <span>Google Search Grounding Sources:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-surface-container text-[11px] text-secondary hover:underline truncate max-w-xs"
                          >
                            <span className="material-symbols-outlined text-[11px]">link</span>
                            <span className="truncate">{src.title || src.uri}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtext info */}
                <span className="text-[10px] text-outline px-1">
                  {isUser
                    ? 'You'
                    : `NOTO Coach • ${msg.modelUsed || selectedModel}`}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-y-1">
              <div className="bg-surface-container-lowest border border-surface-container-highest rounded-2xl rounded-bl-xs p-3.5 shadow-xs flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-100"></span>
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse delay-200"></span>
                <span className="text-[12px] text-on-surface-variant pl-1">
                  Synthesizing calm guidance...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-1.5 bg-surface-container-low/70 border-t border-surface-container-highest flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(qp.prompt)}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container-lowest border border-surface-container-highest text-[11px] font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 bg-surface-container-lowest border-t border-surface-container-high shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for advice, task deconstruction, or search latest research..."
              className="flex-1 px-4 py-2.5 rounded-full border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[13px] text-on-surface placeholder:text-outline-variant outline-none focus:border-on-surface transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-[#222] cursor-pointer shrink-0 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
