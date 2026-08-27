"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AskMamaWidget } from "@/components/AskMamaWidget";
import { LanguageSelector, useLanguage } from "@/components/LanguageProvider";
import { homeCopy } from "@/lib/i18n";

export default function HomePage() {
  const [askOpen, setAskOpen] = useState(false);
  const { language } = useLanguage();
  const t = homeCopy[language];

  return (
    <main className="min-h-screen bg-[#fff8ee] text-[#221b16]">
      <header className="sticky top-0 z-40 border-b border-amber-100/80 bg-[#fff8ee]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-orange-600">Mama</span><span className="text-emerald-800">AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-stone-600 md:flex">
            <a href="#how">{t.navHow}</a>
            <a href="#plans">{t.navPlans}</a>
            <Link href="/planner">{t.navPlanner}</Link>
            <Link href="/pantry">{t.navPantry}</Link>
            <Link href="/subscription">{t.navSubscription}</Link>
          </nav>
          <LanguageSelector />
          <Link
            href="/profile/family"
            className="hidden rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-900 sm:inline-flex"
          >
            {t.start}
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(22,101,52,0.14),transparent_34%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          <div className="z-10 max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-900">
              {t.eyebrow}
            </p>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
              {t.headlineA} <span className="text-emerald-800">{t.headlineB}</span>
            </h1>
            <p className="mt-6 text-lg font-semibold leading-8 text-stone-700 sm:text-xl">{t.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/profile/family" className="rounded-full bg-orange-600 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-900/20 transition hover:bg-orange-700">
                {t.primaryCta}
              </Link>
              <Link href="/planner" className="rounded-full bg-emerald-800 px-7 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-900/20 transition hover:bg-emerald-900">
                {t.plannerCta}
              </Link>
              <Link href="/ask-mama" className="rounded-full border border-emerald-200 bg-white px-7 py-3.5 text-sm font-black text-emerald-900 shadow-sm transition hover:border-emerald-400">
                {t.demoCta}
              </Link>
            </div>
            <div className="mt-7 grid gap-3 text-sm font-bold text-stone-700 sm:grid-cols-2">
              {t.checks.map((item) => (
                <div key={item} className="rounded-2xl border border-amber-100 bg-white/80 px-4 py-3 shadow-sm">
                  <span className="mr-2 text-emerald-700">✓</span>{item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img
              src="/images/mamaai-family-kitchen-hero.png"
              alt="A warm multigenerational family around a kitchen meal with an AI kitchen companion and a separate four-paw family member nearby."
              className="aspect-[16/10] w-full rounded-[2rem] border border-white/70 object-cover shadow-2xl shadow-stone-900/20"
            />
            <div className="absolute left-4 top-4 max-w-[15rem] rounded-3xl bg-white/92 p-4 shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-wide text-orange-600">{t.questionLabel}</p>
              <p className="mt-1 text-xl font-black leading-tight text-stone-950">{t.question}</p>
            </div>
            <div className="absolute bottom-4 right-4 max-w-[17rem] rounded-3xl bg-emerald-900/92 p-4 text-white shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-wide text-amber-200">{t.plusTitle}</p>
              <p className="mt-1 text-lg font-black">{t.plusBadge}</p>
              <p className="mt-1 text-xs text-emerald-50">{t.plusSafety}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-amber-100 bg-white/70 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{t.sectionEyebrow}</p>
            <h2 className="mt-3 text-3xl font-black text-stone-950 sm:text-5xl">{t.sectionTitle}</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.map(([title, body, icon]) => (
              <article key={title} className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-900">
                  {icon}
                </div>
                <h3 className="text-lg font-black text-stone-950">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-stone-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-700">{t.planEyebrow}</p>
              <h2 className="mt-3 text-3xl font-black text-stone-950 sm:text-5xl">{t.planTitle}</h2>
            </div>
            <Link href="/subscription" className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-black text-white">
              {t.checkout}
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {t.plans.map(([name, price, limit, body], index) => (
              <article key={name} className={`rounded-3xl border bg-white p-6 shadow-sm ${index === 2 ? "border-emerald-500 ring-4 ring-emerald-100" : "border-amber-100"}`}>
                {index === 2 ? (
                  <p className="mb-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">
                    {t.fourPaw}
                  </p>
                ) : null}
                <h3 className="text-xl font-black text-stone-950">{name}</h3>
                <p className="mt-3 text-2xl font-black text-emerald-800">{price}</p>
                <p className="mt-2 text-sm font-bold text-stone-700">{limit}</p>
                <p className="mt-4 text-sm leading-6 text-stone-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-900 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-200">{t.footerEyebrow}</p>
            <h2 className="mt-2 text-3xl font-black">{t.footerTitle}</h2>
            <a
              href="https://www.sabsewa.in"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-bold text-emerald-100 underline decoration-emerald-300/60 underline-offset-4"
            >
              {t.footerPartner}
            </a>
          </div>
          <Link href="/profile/family" className="rounded-full bg-white px-7 py-3.5 text-sm font-black text-emerald-900">
            {t.footerCta}
          </Link>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setAskOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white shadow-2xl shadow-emerald-950/30 transition hover:bg-emerald-900"
        aria-expanded={askOpen}
      >
        {t.ask}
      </button>

      {askOpen ? (
        <div className="fixed bottom-20 right-4 z-50 max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
          <AskMamaWidget compact />
        </div>
      ) : null}
    </main>
  );
}
