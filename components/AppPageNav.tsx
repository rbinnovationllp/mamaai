'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from './LanguageProvider';

type AppPageNavProps = {
  plannerHref?: string;
  showPlanner?: boolean;
};

export function AppPageNav({ plannerHref = '/planner', showPlanner = true }: AppPageNavProps) {
  const { language } = useLanguage();
  const copy = {
    en: {
      back: 'Back',
      home: 'Home',
      plan: 'Plan Today’s Meal',
      today: 'Today’s Meal',
      week: 'This Week',
      nextWeek: 'Next Week',
      profile: 'My Family',
    },
    hi: {
      back: 'वापस',
      home: 'होम',
      plan: 'आज का भोजन प्लान करें',
      today: 'आज का भोजन',
      week: 'इस सप्ताह की योजना',
      nextWeek: 'अगले सप्ताह की योजना',
      profile: 'मेरा परिवार',
    },
    kn: {
      back: 'ಹಿಂದೆ',
      home: 'ಹೋಮ್',
      plan: 'ಇಂದಿನ ಊಟ ಪ್ಲ್ಯಾನ್ ಮಾಡಿ',
      today: 'ಇಂದಿನ ಊಟ',
      week: 'ಈ ವಾರದ ಪ್ಲ್ಯಾನ್',
      nextWeek: 'ಮುಂದಿನ ವಾರದ ಪ್ಲ್ಯಾನ್',
      profile: 'ನನ್ನ ಕುಟುಂಬ',
    },
  }[language];

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Top Action Bar */}
      <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={goBack}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <span aria-hidden="true">&larr;</span> {copy.back}
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
          >
            {copy.home}
          </Link>
          {showPlanner ? (
            <Link
              href={plannerHref}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
              {copy.plan}
            </Link>
          ) : null}
        </div>
      </nav>

      {/* Sub-header Context Tabs */}
      <nav className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/planner?view=today"
            className="rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            {copy.today}
          </Link>
          <Link
            href="/planner?view=week"
            className="rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            {copy.week}
          </Link>
          <Link
            href="/planner?view=next_week"
            className="rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            {copy.nextWeek}
          </Link>
        </div>

        <Link
          href="/profile/family"
          className="rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1"
        >
          <span>{copy.profile}</span>
        </Link>
      </nav>
    </div>
  );
}
