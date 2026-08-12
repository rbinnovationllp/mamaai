'use client';

import React, { useState } from 'react';

export default function AskMamaPage() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'mama'; text: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userMessage = query.trim();
    setChatHistory((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask-mama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errorMsg = data.error?.message || 'MAMA is having trouble connecting right now. Please try again shortly.';
        setChatHistory((prev) => [...prev, { sender: 'mama', text: errorMsg }]);
      } else {
        setChatHistory((prev) => [...prev, { sender: 'mama', text: data.answer || 'MAMA has processed your request.' }]);
      }
    } catch {
      setChatHistory((prev) => [...prev, { sender: 'mama', text: 'MAMA is having trouble connecting right now. Your family information is safe. Please try again shortly.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ask MAMA Assistant</h1>
      <p className="text-sm text-gray-600 mb-6">Ask about today's dinner, pantry stock, or pet safety checks.</p>

      <div className="bg-white border rounded-xl p-4 min-h-[380px] shadow-sm flex flex-col justify-between">
        <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2">
          {chatHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-gray-400 italic">
                Try asking: "What can I cook with what I have?" or "Is onion curry safe for Bruno?" 🐾
              </p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs sm:max-w-md rounded-lg p-3 text-sm leading-relaxed ${
                    msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your kitchen or pet food question..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSend}
            disabled={loading || !query.trim()}
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </main>
  );
}