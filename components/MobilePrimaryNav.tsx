'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';

const items = [
  { href: '/', key: 'home', icon: '\u2302' },
  { href: '/planner', key: 'meal', icon: '\u25cb' },
  { href: '/profile/family', key: 'family', icon: '\u25c7' },
  { href: '/pantry', key: 'kitchen', icon: '\u25a1' },
  { href: '/more', key: 'more', icon: '\u2022\u2022\u2022' },
] as const;

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
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={item.key} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-center text-[10px] font-bold leading-tight ${active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600'}`}>
              <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
              <span>{labels[item.key]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
