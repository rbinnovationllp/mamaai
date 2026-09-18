'use client';

import Link from 'next/link';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';

export default function MorePage() {
  const { language } = useLanguage();
  const copy = {
    en: {
      title: 'More', subtitle: 'Manage preferences, plans, and additional MAMAAI tools.',
      language: 'Language', languageText: 'Choose the language used across MAMAAI.',
      ask: 'Ask MAMA', askText: 'Ask about meals, recipes, your pantry, or how MAMAAI works.',
      week: 'Weekly Meal Plan', weekText: 'Review this week and prepare for the coming week.',
      culture: 'Food Culture', cultureText: 'Update country, region, and cuisine preferences.',
      subscription: 'Subscription', subscriptionText: 'View your plan, benefits, and subscription options.',
      family: 'My Family', familyText: 'Edit family members, food preferences, routines, and restrictions.',
      kitchen: 'My Kitchen', kitchenText: 'Update pantry ingredients used for meal and grocery planning.',
      help: 'Help and Support', helpText: 'For account or product assistance, contact support@mamaai.in.', open: 'Open', email: 'Email Support',
    },
    hi: {
      title: '\u0914\u0930', subtitle: 'Preferences, plans \u0914\u0930 MAMAAI \u0915\u0947 \u0905\u0928\u094d\u092f tools manage \u0915\u0930\u0947\u0902\u0964',
      language: '\u092d\u093e\u0937\u093e', languageText: 'MAMAAI \u092e\u0947\u0902 \u0907\u0938\u094d\u0924\u0947\u092e\u093e\u0932 \u0939\u094b\u0928\u0947 \u0935\u093e\u0932\u0940 \u092d\u093e\u0937\u093e \u091a\u0941\u0928\u0947\u0902\u0964',
      ask: 'MAMA \u0938\u0947 \u092a\u0942\u091b\u0947\u0902', askText: '\u092d\u094b\u091c\u0928, recipe, pantry \u092f\u093e MAMAAI \u0915\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902 \u092a\u0942\u091b\u0947\u0902\u0964',
      week: '\u0938\u093e\u092a\u094d\u0924\u093e\u0939\u093f\u0915 \u092d\u094b\u091c\u0928 \u092f\u094b\u091c\u0928\u093e', weekText: '\u0907\u0938 \u0938\u092a\u094d\u0924\u093e\u0939 \u0915\u0940 \u092f\u094b\u091c\u0928\u093e \u0926\u0947\u0916\u0947\u0902 \u0914\u0930 \u0905\u0917\u0932\u0947 \u0938\u092a\u094d\u0924\u093e\u0939 \u0915\u0940 \u0924\u0948\u092f\u093e\u0930\u0940 \u0915\u0930\u0947\u0902\u0964',
      culture: '\u092d\u094b\u091c\u0928 \u0938\u0902\u0938\u094d\u0915\u0943\u0924\u093f', cultureText: '\u0926\u0947\u0936, region \u0914\u0930 cuisine preferences update \u0915\u0930\u0947\u0902\u0964',
      subscription: '\u0938\u092c\u094d\u0938\u0915\u094d\u0930\u093f\u092a\u094d\u0936\u0928', subscriptionText: '\u0905\u092a\u0928\u093e plan, benefits \u0914\u0930 subscription options \u0926\u0947\u0916\u0947\u0902\u0964',
      family: '\u092e\u0947\u0930\u093e \u092a\u0930\u093f\u0935\u093e\u0930', familyText: '\u0938\u0926\u0938\u094d\u092f, \u092d\u094b\u091c\u0928 \u092a\u0938\u0902\u0926, routine \u0914\u0930 restrictions edit \u0915\u0930\u0947\u0902\u0964',
      kitchen: '\u092e\u0947\u0930\u0940 \u0930\u0938\u094b\u0908', kitchenText: '\u092d\u094b\u091c\u0928 \u0914\u0930 grocery planning \u0915\u0947 \u0932\u093f\u090f pantry ingredients update \u0915\u0930\u0947\u0902\u0964',
      help: '\u092e\u0926\u0926 \u0914\u0930 \u0938\u0939\u093e\u092f\u0924\u093e', helpText: 'Account \u092f\u093e product help \u0915\u0947 \u0932\u093f\u090f support@mamaai.in \u092a\u0930 \u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902\u0964', open: '\u0916\u094b\u0932\u0947\u0902', email: '\u0908\u092e\u0947\u0932 \u0915\u0930\u0947\u0902',
    },
    kn: {
      title: '\u0c87\u0ca8\u0ccd\u0ca8\u0cb7\u0ccd\u0c9f\u0cc1', subtitle: 'Preferences, plans \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 MAMAAI \u0caf \u0c87\u0ca4\u0cb0 tools \u0ca8\u0cbf\u0cb0\u0ccd\u0cb5\u0cb9\u0cbf\u0cb8\u0cbf.',
      language: '\u0cad\u0cbe\u0cb7\u0cc6', languageText: 'MAMAAI \u0caf\u0cb2\u0ccd\u0cb2\u0cbf \u0cac\u0cb3\u0cb8\u0cb2\u0cbe\u0c97\u0cc1\u0cb5 \u0cad\u0cbe\u0cb7\u0cc6\u0caf\u0ca8\u0ccd\u0ca8\u0cc1 \u0c86\u0caf\u0ccd\u0c95\u0cc6 \u0cae\u0cbe\u0ca1\u0cbf.',
      ask: 'MAMA \u0cac\u0cb3\u0cbf \u0c95\u0cc7\u0cb3\u0cbf', askText: '\u0c8a\u0c9f, recipe, pantry \u0c85\u0ca5\u0cb5\u0cbe MAMAAI \u0cac\u0c97\u0ccd\u0c97\u0cc6 \u0c95\u0cc7\u0cb3\u0cbf.',
      week: '\u0cb5\u0cbe\u0cb0\u0ca6 \u0c8a\u0c9f\u0ca6 \u0caf\u0ccb\u0c9c\u0ca8\u0cc6', weekText: '\u0c88 \u0cb5\u0cbe\u0cb0\u0cb5\u0ca8\u0ccd\u0ca8\u0cc1 \u0caa\u0cb0\u0cbf\u0cb6\u0cc0\u0cb2\u0cbf\u0cb8\u0cbf, \u0cae\u0cc1\u0c82\u0ca6\u0cbf\u0ca8 \u0cb5\u0cbe\u0cb0\u0c95\u0ccd\u0c95\u0cc6 \u0cb8\u0cbf\u0ca6\u0ccd\u0ca7\u0cb0\u0cbe\u0c97\u0cbf.',
      culture: '\u0c86\u0cb9\u0cbe\u0cb0 \u0cb8\u0c82\u0cb8\u0ccd\u0c95\u0cc3\u0ca4\u0cbf', cultureText: '\u0ca6\u0cc7\u0cb6, region \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 cuisine preferences update \u0cae\u0cbe\u0ca1\u0cbf.',
      subscription: '\u0c9a\u0c82\u0ca6\u0cbe\u0ca6\u0cbe\u0cb0\u0cbf\u0c95\u0cc6', subscriptionText: '\u0ca8\u0cbf\u0cae\u0ccd\u0cae plan, benefits \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 subscription options \u0ca8\u0ccb\u0ca1\u0cbf.',
      family: '\u0ca8\u0ca8\u0ccd\u0ca8 \u0c95\u0cc1\u0c9f\u0cc1\u0c82\u0cac', familyText: '\u0cb8\u0ca6\u0cb8\u0ccd\u0caf\u0cb0\u0cc1, \u0c86\u0cb9\u0cbe\u0cb0 \u0c86\u0ca6\u0ccd\u0caf\u0ca4\u0cc6\u0c97\u0cb3\u0cc1, routine \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 restrictions edit \u0cae\u0cbe\u0ca1\u0cbf.',
      kitchen: '\u0ca8\u0ca8\u0ccd\u0ca8 \u0c85\u0ca1\u0cc1\u0c97\u0cc6', kitchenText: '\u0c8a\u0c9f \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 grocery planning \u0c97\u0cbe\u0c97\u0cbf pantry ingredients update \u0cae\u0cbe\u0ca1\u0cbf.',
      help: '\u0cb8\u0cb9\u0cbe\u0caf \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 \u0cac\u0cc6\u0c82\u0cac\u0cb2', helpText: 'Account \u0c85\u0ca5\u0cb5\u0cbe product help \u0c97\u0cbe\u0c97\u0cbf support@mamaai.in \u0c97\u0cc6 \u0cb8\u0c82\u0caa\u0cb0\u0ccd\u0c95\u0cbf\u0cb8\u0cbf.', open: '\u0ca4\u0cc6\u0cb0\u0cc6\u0caf\u0cbf\u0cb0\u0cbf', email: '\u0c88\u0cae\u0cc7\u0cb2\u0ccd \u0cae\u0cbe\u0ca1\u0cbf',
    },
  }[language];

  const links = [
    { title: copy.ask, text: copy.askText, href: '/ask-mama' },
    { title: copy.week, text: copy.weekText, href: '/planner?view=week' },
    { title: copy.family, text: copy.familyText, href: '/profile/family' },
    { title: copy.kitchen, text: copy.kitchenText, href: '/pantry' },
    { title: copy.culture, text: copy.cultureText, href: '/profile/culture' },
    { title: copy.subscription, text: copy.subscriptionText, href: '/subscription' },
  ];

  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <AppPageNav />
        <header className="mb-6">
          <h1 className="text-3xl font-black text-slate-950">{copy.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{copy.subtitle}</p>
        </header>

        <section className="mb-6 border-y border-slate-200 bg-white py-5">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="font-bold text-slate-950">{copy.language}</h2><p className="mt-1 text-sm text-slate-600">{copy.languageText}</p></div>
            <LanguageSelector />
          </div>
        </section>

        <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 transition hover:bg-emerald-50">
              <span><span className="block font-bold text-slate-950">{item.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{item.text}</span></span>
              <span className="shrink-0 text-sm font-bold text-emerald-800">{copy.open}</span>
            </Link>
          ))}
        </div>

        <section className="mt-6 border-y border-slate-200 bg-white px-4 py-5">
          <h2 className="font-bold text-slate-950">{copy.help}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{copy.helpText}</p>
          <a href="mailto:support@mamaai.in" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-5 text-sm font-bold text-white">{copy.email}</a>
        </section>
      </div>
    </main>
  );
}
