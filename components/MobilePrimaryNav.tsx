'use client';

import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';

const items = [
  { href: '/', key: 'home', icon: 'home' }, { href: '/planner', key: 'meal', icon: 'meal' }, { href: '/profile/family', key: 'family', icon: 'family' }, { href: '/pantry', key: 'kitchen', icon: 'kitchen' }, { href: '/more', key: 'more', icon: 'more' },
] as const;

function NavIcon({ name }: { name: typeof items[number]['icon'] }) { const paths = { home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />, meal: <><path d="M12 3v18M5 5c3 2 3 12 0 14M19 5c-3 2-3 12 0 14" /></>, family: <><circle cx="9" cy="8" r="3" /><path d="M3 21c0-4 2-6 6-6s6 2 6 6M17 11a3 3 0 1 0-1-5.8M16 15c3 0 5 2 5 6" /></>, kitchen: <><path d="M4 3h16v6H4zM6 9v12M18 9v12M9 14h6" /></>, more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></> } as const; return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">{paths[name]}</svg>; }

export function MobilePrimaryNav() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const labels = {
    en: { home: 'Home', meal: "Today's Meal", family: 'My Family', kitchen: 'My Kitchen', more: 'More' },
    hi: { home: '\u0939\u094b\u092e', meal: '\u0906\u091c \u0915\u093e \u092d\u094b\u091c\u0928', family: '\u092e\u0947\u0930\u093e \u092a\u0930\u093f\u0935\u093e\u0930', kitchen: '\u092e\u0947\u0930\u0940 \u0930\u0938\u094b\u0908', more: '\u0914\u0930' },
    kn: { home: '\u0cb9\u0ccb\u0cae\u0ccd', meal: '\u0c87\u0c82\u0ca6\u0cbf\u0ca8 \u0c8a\u0c9f', family: '\u0ca8\u0ca8\u0ccd\u0ca8 \u0c95\u0cc1\u0c9f\u0cc1\u0c82\u0cac', kitchen: '\u0ca8\u0ca8\u0ccd\u0ca8 \u0c85\u0ca1\u0cc1\u0c97\u0cc6', more: '\u0c87\u0ca8\u0ccd\u0ca8\u0cb7\u0ccd\u0c9f\u0cc1' },
  }[language];

  return (
    <nav aria-label="Primary mobile navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div
        className="mx-auto grid max-w-lg gap-1"
        // The legacy global stylesheet collapses generic `.grid` elements to one
        // column below 860px. Keep this navigation explicitly five-column so it
        // remains a compact, reachable mobile control bar.
        style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
      >
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <a key={item.key} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-center text-[10px] font-bold leading-tight ${active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'}`}>
              <NavIcon name={item.icon} />
              <span>{labels[item.key]}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

