'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AppPageNav } from '@/components/AppPageNav';
import { useLanguage } from '@/components/LanguageProvider';
import { VoiceTextInput } from '@/components/VoiceTextInput';

interface ChatMessage {
  id: string;
  sender: 'user' | 'mama';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'How does MAMAAI work?',
  'Plan meals for my family',
  'How are allergies handled?',
  'Show subscription plans',
  'What should I cook tonight with pantry staples?',
];

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';
const CUSTOMER_STORAGE_KEY = 'mamaai_customer_account_v1';

export default function HomePage() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'mama',
      text: "Namaste! I am MAMA, your kitchen companion and MAMAAI support assistant. How can I help you plan, cook, or balance your family's meals today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileContext, setProfileContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      const members = JSON.parse(window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY) || '[]');
      const customer = JSON.parse(window.localStorage.getItem(CUSTOMER_STORAGE_KEY) || '{}');
      setProfileContext({
        householdFoodPreference: customer.householdFoodPreference,
        cookingHabit: customer.cookingHabit,
        members: Array.isArray(members)
          ? members.map((member) => ({
              name: member.name,
              relation: member.relation,
              foodPreference: member.foodPreference,
              allergies: member.allergies,
              doctorAdvisedRestrictions: member.doctorAdvisedRestrictions,
              dislikes: member.dislikes,
            }))
          : [],
      });
    } catch {
      setProfileContext(null);
    }
  }, []);

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
      // Build conversation history for multi-turn context
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
          isJudgeMode: true,
          language,
          profileContext,
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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl w-full mx-auto">
        <AppPageNav />
      </div>

      {/* Top Banner Navigation */}
      <div className="max-w-4xl w-full mx-auto mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Family Nutrition Operating System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            MAMAAI Assistant
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/profile/family"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            Family Profiles
          </Link>
          <Link
            href="/subscription"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
          >
            Plans
          </Link>
        </div>
      </div>

      {/* Main Interactive Card */}
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col bg-white rounded-3xl border border-gray-200/80 shadow-xl overflow-hidden min-h-[600px]">
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/80 backdrop-blur-sm text-white border border-emerald-400">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Live Assistant
            </span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[58vh]">
          {messages.map((msg) => (
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
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:border-emerald-500 hover:text-emerald-700 text-gray-600 font-medium transition disabled:opacity-50 shadow-2xs"
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
          <VoiceTextInput
            type="text"
            value={inputMessage}
            onValueChange={setInputMessage}
            placeholder="Ask about app features, dinner ideas, recipes, or dietary swaps..."
            disabled={isLoading}
            className="flex-1"
            inputClassName="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-sm font-bold transition disabled:opacity-50 shadow-sm"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
