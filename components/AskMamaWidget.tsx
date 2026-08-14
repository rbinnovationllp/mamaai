'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mama';
  text: string;
  timestamp: string;
}

export interface AskMamaWidgetProps {
  onStartFamily?: () => void;
  onTryDemo?: () => Promise<void> | void;
}

const SUGGESTED_QUESTIONS: string[] = [
  'How does MAMAAI work?',
  'Plan meals for my family',
  'How are allergies handled?',
  'Show subscription plans',
  'What can I cook tonight with pantry staples?',
];

export function AskMamaWidget({ onStartFamily, onTryDemo }: AskMamaWidgetProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'mama',
      text: "Namaste! I am MAMA, your kitchen companion and MAMAAI support assistant. How can I help you plan, cook, or balance your family's meals today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string): Promise<void> => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev: ChatMessage[]) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages
        .filter((m: ChatMessage) => m.id !== 'welcome')
        .map((m: ChatMessage) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: m.text,
        }));

      const res = await fetch('/api/ask-mama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
          isJudgeMode: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || 'Failed to get a response from MAMA.');
      }

      const mamaMsg: ChatMessage = {
        id: `m_${Date.now()}`,
        sender: 'mama',
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev: ChatMessage[]) => [...prev, mamaMsg]);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'mama',
        text: `⚠️ ${err instanceof Error ? err.message : 'Something went wrong. Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev: ChatMessage[]) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden min-h-[550px]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-emerald-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-xl shadow-inner">
            👩‍🍳
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Ask MAMA</h2>
            <p className="text-xs text-emerald-100">Live AI Support & Personal Kitchen Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onTryDemo && (
            <button
              type="button"
              onClick={() => onTryDemo()}
              className="text-xs font-semibold px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg transition"
            >
              Demo Mode
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/80 backdrop-blur-sm text-white border border-emerald-400">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Live Assistant
          </span>
        </div>
      </div>

      {/* Message Log */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[50vh]">
        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none whitespace-pre-wrap'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 italic bg-gray-50 px-3 py-2 rounded-xl w-fit border border-gray-100">
            <span className="inline-block animate-spin text-emerald-600 font-bold">🌀</span>
            MAMA is formulating your answer...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
        {SUGGESTED_QUESTIONS.map((q: string, idx: number) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-xs whitespace-nowrap px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:border-emerald-500 hover:text-emerald-700 text-gray-600 font-medium transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 border-t border-gray-100 bg-white flex gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
          placeholder="Ask about app features, dinner ideas, recipes, or dietary swaps..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50 shadow-sm cursor-pointer"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default AskMamaWidget;