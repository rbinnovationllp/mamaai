'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import type { AppLanguage } from '@/lib/i18n';

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

interface VoiceTextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  inputClassName?: string;
  mode?: 'replace' | 'append';
}

const speechLanguageByAppLanguage: Record<AppLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
};

const statusCopy = {
  en: {
    listening: 'Listening... Speak now.',
    review: 'Please check the text before continuing.',
    unclear: "I couldn't understand that clearly. Please try again or type it manually.",
    denied: 'Microphone permission was not allowed. You can still type normally.',
    unsupported: 'Voice input is not available in this browser.',
    start: 'Speak instead of type',
    stop: 'Stop listening',
  },
  hi: {
    listening: 'सुन रही हूं... अब बोलें.',
    review: 'आगे बढ़ने से पहले text check कर लें.',
    unclear: 'आवाज साफ समझ नहीं आई. कृपया फिर कोशिश करें या type करें.',
    denied: 'Microphone permission allow नहीं हुई. आप normal typing कर सकते हैं.',
    unsupported: 'इस browser में voice input उपलब्ध नहीं है.',
    start: 'बोलकर लिखें',
    stop: 'सुनना बंद करें',
  },
  kn: {
    listening: 'ಕೇಳುತ್ತಿದ್ದೇನೆ... ಈಗ ಮಾತನಾಡಿ.',
    review: 'ಮುಂದುವರಿಯುವ ಮೊದಲು text check ಮಾಡಿ.',
    unclear: 'ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಅರ್ಥವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ type ಮಾಡಿ.',
    denied: 'Microphone permission allow ಆಗಿಲ್ಲ. ನೀವು typing ಮಾಡಬಹುದು.',
    unsupported: 'ಈ browser ನಲ್ಲಿ voice input ಲಭ್ಯವಿಲ್ಲ.',
    start: 'ಮಾತನಾಡಿ ಬರೆಯಿರಿ',
    stop: 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
  },
} satisfies Record<AppLanguage, Record<string, string>>;

export function VoiceTextInput({
  value,
  onValueChange,
  inputClassName,
  className,
  mode = 'replace',
  disabled,
  ...inputProps
}: VoiceTextInputProps) {
  const { language } = useLanguage();
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');

  const copy = statusCopy[language];
  const speechLang = useMemo(() => speechLanguageByAppLanguage[language] ?? 'en-IN', [language]);

  useEffect(() => {
    const SpeechRecognition =
      (window as WindowWithSpeechRecognition).SpeechRecognition ??
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
    setSupported(Boolean(SpeechRecognition));

    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function applyTranscript(transcript: string) {
    const cleaned = transcript.trim();
    if (!cleaned) {
      setMessage(copy.unclear);
      return;
    }

    onValueChange(mode === 'append' && value.trim() ? `${value.trim()}, ${cleaned}` : cleaned);
    setMessage(copy.review);
  }

  function toggleListening() {
    if (!supported || disabled) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as WindowWithSpeechRecognition).SpeechRecognition ??
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(copy.unsupported);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setMessage(copy.listening);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result?.isFinal) finalTranscript += result[0]?.transcript ?? '';
      }
      applyTranscript(finalTranscript);
    };

    recognition.onerror = (event) => {
      setListening(false);
      setMessage(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? copy.denied : copy.unclear);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setListening(false);
      setMessage(copy.unclear);
    }
  }

  return (
    <div className={`voice-input ${className ?? ''}`}>
      <div className="voice-input-row">
        <input
          {...inputProps}
          disabled={disabled}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className={inputClassName}
        />
        {supported ? (
          <button
            type="button"
            className={`voice-button ${listening ? 'is-listening' : ''}`}
            aria-label={listening ? copy.stop : copy.start}
            title={listening ? copy.stop : copy.start}
            onClick={toggleListening}
            disabled={disabled}
          >
            {listening ? '■' : '🎤'}
          </button>
        ) : null}
      </div>
      {message ? <p className={`voice-status ${listening ? 'is-listening' : ''}`}>{message}</p> : null}
    </div>
  );
}
