"use client";

import { FormEvent, useMemo, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/shared/client-analytics";
import type { AskMamaActionType, AskMamaCategory } from "@/lib/ask-mama/knowledge-base";

interface AskMamaApiResponse {
  category: AskMamaCategory;
  answer: string;
  action?: {
    type: AskMamaActionType;
    label: string;
  };
  suggestions: string[];
  unresolved?: boolean;
}

interface AskMamaWidgetProps {
  onStartFamily: () => void;
  onTryDemo: () => void;
}

interface Message {
  id: string;
  role: "mama" | "user";
  text: string;
  action?: AskMamaApiResponse["action"];
}

const welcomeText =
  "Hi! I'm MAMA. I can help you understand MAMAAI, find features, and show you how to get the best meal plan for your family. What would you like to know?";

const defaultQuestions = [
  "How does MAMAAI work?",
  "Plan meals for my family",
  "How are allergies handled?",
  "Show subscription plans"
];

function messageId() {
  return `ask-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function AskMamaWidget({ onStartFamily, onTryDemo }: AskMamaWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState(defaultQuestions);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "mama",
      text: welcomeText
    }
  ]);

  const hasMessages = useMemo(() => messages.length > 1, [messages.length]);

  function openChat() {
    if (!isOpen) {
      trackAnalyticsEvent("ask_mama_open", { category: "assistant" });
    }
    setIsOpen(true);
  }

  function closeChat() {
    setIsOpen(false);
  }

  async function askMama(nextQuestion: string) {
    const trimmed = nextQuestion.trim();
    if (!trimmed || isThinking) return;

    setQuestion("");
    setIsThinking(true);
    setMessages((current) => [...current, { id: messageId(), role: "user", text: trimmed }]);

    try {
      const response = await fetch("/api/ask-mama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed })
      });

      const data = (await response.json()) as AskMamaApiResponse & { error?: { message?: string } };

      if (!response.ok || data.error) {
        throw new Error("Ask MAMA is unavailable.");
      }

      setSuggestions(data.suggestions);
      trackAnalyticsEvent("ask_mama_question", {
        category: data.category,
        label: trimmed.slice(0, 100)
      });

      if (data.unresolved) {
        trackAnalyticsEvent("ask_mama_unresolved", {
          category: data.category,
          label: trimmed.slice(0, 100)
        });
      }

      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "mama",
          text: data.answer,
          action: data.action
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "mama",
          text: "Ask MAMA is temporarily unavailable in this testing version. You can still use the meal planner and Judge Demo."
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askMama(question);
  }

  function handleAction(action: AskMamaApiResponse["action"]) {
    if (!action) return;

    if (action.type === "try_demo") {
      onTryDemo();
      setIsOpen(false);
      return;
    }

    if (action.type === "add_family") {
      onStartFamily();
      setIsOpen(false);
      return;
    }

    return;
  }

  return (
    <div className="ask-mama">
      {isOpen ? (
        <section className="ask-mama-panel" aria-label="Ask MAMA chat">
          <div className="ask-mama-header">
            <div>
              <p className="eyebrow">Ask MAMA</p>
              <h2>Your MAMAAI guide</h2>
            </div>
            <button className="icon-button" type="button" onClick={closeChat} aria-label="Close Ask MAMA">
              x
            </button>
          </div>

          <div className="ask-mama-messages">
            {messages.map((message) => (
              <div className={`ask-message ${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {message.action?.type === "contact_support" ? (
                  <a className="ask-action" href="mailto:support@mamaai.in">
                    {message.action.label}
                  </a>
                ) : message.action && message.action.type !== "none" ? (
                  <button className="ask-action" type="button" onClick={() => handleAction(message.action)}>
                    {message.action.label}
                  </button>
                ) : null}
              </div>
            ))}
            {isThinking ? (
              <div className="ask-message mama">
                <p>MAMA is checking the product guide...</p>
              </div>
            ) : null}
          </div>

          <div className="quick-questions" aria-label="Suggested Ask MAMA questions">
            {!hasMessages ? <span>Try asking:</span> : null}
            {suggestions.slice(0, 4).map((item) => (
              <button type="button" key={item} onClick={() => askMama(item)}>
                {item}
              </button>
            ))}
          </div>

          <form className="ask-form" onSubmit={handleSubmit}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about MAMAAI..."
              maxLength={500}
              aria-label="Ask MAMA question"
            />
            <button className="button" type="submit" disabled={isThinking || !question.trim()}>
              Ask
            </button>
          </form>
        </section>
      ) : null}

      <button className="ask-mama-fab" type="button" onClick={openChat} aria-expanded={isOpen}>
        Ask MAMA
      </button>
    </div>
  );
}
