'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'mama';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  "How does MAMAAI work?",
  "Plan meals for my family",
  "How are allergies handled?",
  "Show subscription plans",
  "What should I cook tonight with pantry staples?",
];

export default function AskMamaPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'mama',
      text: "Namaste! I am MAMA, your kitchen companion and MAMAAI support agent. How can I help you plan, cook, or navigate your family's meals today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Build history for multi-turn chat
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: m.text,
        }));

      const res = await fetch('/api/ask-mama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history,
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

      setMessages((prev) => [...prev, mamaMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'mama',
        text: `⚠️ ${err instanceof Error ? err.message : 'Something went wrong. Please check your connection and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              👩‍🍳
            </div>
            <div>
              <h1 className="text-base font-bold">Ask MAMA</h1>
              <p className="text-xs text-emerald-100">Live AI Support & Personal Kitchen Companion</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500 text-white">
            ● Active
          </span>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[60vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
            <div className="flex items-center gap-2 text-xs text-gray-400 italic">
              <span className="animate-spin text-emerald-600">🌀</span> MAMA is preparing your answer...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-emerald-500 hover:text-emerald-700 text-gray-600 transition disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 border-t border-gray-100 bg-white flex gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about app features, dinner suggestions, recipes, or dietary swaps..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            Send
          </button>
        </form>

      </div>
    </main>
  );
}