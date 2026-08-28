'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface Message {
    sender: 'user' | 'mama';
    text: string;
}

export function AskMamaModal({ isOpen, onClose }: Props) {
    const { language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const labels = {
        en: {
            title: 'Ask MAMA',
            subtitle: 'Your family meal planning and MAMAAI assistant',
            placeholder: 'Ask anything about MAMAAI, your meals, or plans...',
            send: 'Ask',
            thinking: 'MAMA is thinking...',
            error: 'Could not retrieve an answer right now. Please try again.',
            initialGreeting: 'Hello! I am MAMA. How can I help you with your family meal planning today?',
        },
        hi: {
            title: 'Ask MAMA (मामा से पूछें)',
            subtitle: 'आपकी पारिवारिक भोजन योजना और MAMAAI सहायक',
            placeholder: 'MAMAAI, अपने भोजन या प्लान के बारे में कुछ भी पूछें...',
            send: 'पूछें',
            thinking: 'MAMA उत्तर तैयार कर रही हैं...',
            error: 'अभी उत्तर प्राप्त नहीं हो सका। कृपया पुनः प्रयास करें।',
            initialGreeting: 'नमस्ते! मैं MAMA हूँ। आज मैं आपके परिवार के भोजन नियोजन में कैसे मदद कर सकती हूँ?',
        },
        kn: {
            title: 'Ask MAMA (ಮಾಮಾ ಬಳಿ ಕೇಳಿ)',
            subtitle: 'ನಿಮ್ಮ ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆ ಮತ್ತು MAMAAI ಸಹಾಯಕ',
            placeholder: 'MAMAAI, ನಿಮ್ಮ ಊಟ ಅಥವಾ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ...',
            send: 'ಕೇಳಿ',
            thinking: 'MAMA ಉತ್ತರಿಸುತ್ತಿದ್ದಾರೆ...',
            error: 'ಈಗ ಉತ್ತರ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
            initialGreeting: 'ನಮಸ್ಕಾರ! ನಾನು MAMA. ಇಂದು ನಿಮ್ಮ ಕುಟುಂಬದ ಊಟದ ಯೋಜನೆಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
        },
    }[language];

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ask-mama', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage,
                    responseLanguage: language,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error?.message || labels.error);
            }

            setMessages((prev) => [...prev, { sender: 'mama', text: data.answer }]);
        } catch (err: any) {
            setMessages((prev) => [...prev, { sender: 'mama', text: labels.error }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="flex h-[580px] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">{labels.title}</h2>
                        <p className="text-xs text-slate-500">{labels.subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Message Thread */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                    <div className="max-w-[85%] rounded-2xl bg-emerald-50 p-3 text-emerald-950">
                        {labels.initialGreeting}
                    </div>

                    {messages.map((m, idx) => (
                        <div
                            key={idx}
                            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl p-3 ${m.sender === 'user'
                                        ? 'bg-emerald-800 text-white'
                                        : 'bg-slate-100 text-slate-900'
                                    }`}
                            >
                                {m.text}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="rounded-2xl bg-slate-100 p-3 text-xs text-slate-500 italic">
                                {labels.thinking}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Bar */}
                <div className="border-t border-slate-100 p-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={labels.placeholder}
                            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-900 disabled:opacity-50"
                        >
                            {labels.send}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}