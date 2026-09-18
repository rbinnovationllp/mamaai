'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { AskMamaModal } from './AskMamaModal';

export function AskMamaLauncher() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  if (pathname === '/ask-mama') return null;

  const label = language === 'hi' ? 'MAMA से पूछें' : language === 'kn' ? 'MAMA ಬಳಿ ಕೇಳಿ' : 'Ask MAMA';
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="fixed bottom-24 right-4 z-40 min-h-12 rounded-full bg-emerald-800 px-5 text-sm font-black text-white shadow-lg ring-2 ring-white transition hover:bg-emerald-900 md:bottom-6 md:right-6">
        {label}
      </button>
      <AskMamaModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
