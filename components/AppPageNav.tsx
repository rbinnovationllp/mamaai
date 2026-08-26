'use client';

import Link from 'next/link';

type AppPageNavProps = {
  plannerHref?: string;
  showPlanner?: boolean;
};

export function AppPageNav({ plannerHref = '/planner', showPlanner = true }: AppPageNavProps) {
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = '/';
  };

  return (
    <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm">
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
  );
}
