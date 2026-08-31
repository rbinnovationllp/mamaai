'use client';

import React from 'react';
import Link from 'next/link';

type AppPageNavProps = {
  plannerHref?: string;
  showPlanner?: boolean;
};

export function AppPageNav({ plannerHref = '/planner', showPlanner = true }: AppPageNavProps) {
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
          <span aria-hidden="true">&larr;</span> Back
        </button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/"
            className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
          >
            Home
          </Link>
          {showPlanner ? (
            <Link
              href={plannerHref}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Plan Today&apos;s Family Meal
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
            आज का भोजन
          </Link>
          <Link
            href="/planner?view=week"
            className="rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            इस सप्ताह की योजना
          </Link>
          <Link
            href="/planner?view=next_week"
            className="rounded-xl bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200 text-slate-800 hover:bg-slate-50 transition"
          >
            अगले सप्ताह की योजना
          </Link>
        </div>

        <Link
          href="/profile/family"
          className="rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1"
        >
          <span>⚙️</span>
          <span>परिवार प्रोफ़ाइल अपडेट करें</span>
        </Link>
      </nav>
    </div>
  );
}