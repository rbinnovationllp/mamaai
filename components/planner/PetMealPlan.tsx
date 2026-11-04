'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

type Plan = { petId: string; petName: string; species: 'dog' | 'cat'; lifeStage: string; recommendation: string; foodPreferences: string[]; safetyNotes: string[]; needsVeterinaryReview: boolean };

export function PetMealPlan() {
  const { language } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/family-plus/pet-meal-plan?language=${encodeURIComponent(language)}`, { cache: 'no-store' })
      .then(async (response) => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => {
        if (!active || !response.ok) return;
        setAvailable(true);
        setPlans(Array.isArray(body.plans) ? body.plans : []);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [language]);

  if (!available) return null;
  const copy = {
    en: { separate: 'Separate from family food', title: 'Pet Meal Plan', description: 'Pet recommendations are species-appropriate food reminders, not human-meal recipes or feeding-quantity instructions.', manage: 'Manage pets', empty: 'Optional: add a cat or dog to create a separate pet-food plan. You can skip any details you do not know.', preferences: 'Recorded preferences' },
    hi: { separate: 'Family food से अलग', title: 'Pet Meal Plan', description: 'Pet recommendations species-appropriate food reminders हैं; human-meal recipes या feeding quantities नहीं।', manage: 'Pets manage करें', empty: 'वैकल्पिक: अलग pet-food plan के लिए cat या dog जोड़ें। अनजान details छोड़ सकते हैं।', preferences: 'दर्ज preferences' },
    kn: { separate: 'Family food ನಿಂದ ಪ್ರತ್ಯೇಕ', title: 'Pet Meal Plan', description: 'Pet recommendations species-appropriate food reminders ಮಾತ್ರ; human-meal recipes ಅಥವಾ feeding quantities ಅಲ್ಲ.', manage: 'Pets ನಿರ್ವಹಿಸಿ', empty: 'ಐಚ್ಛಿಕ: ಪ್ರತ್ಯೇಕ pet-food plan ಗಾಗಿ cat ಅಥವಾ dog ಸೇರಿಸಿ. ತಿಳಿಯದ ವಿವರಗಳನ್ನು ಬಿಟ್ಟುಬಿಡಬಹುದು.', preferences: 'ದಾಖಲಿಸಿದ preferences' },
  }[language];
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-amber-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">{copy.separate}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{copy.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{copy.description}</p>
        </div>
        <Link href="/family-plus/pets" className="rounded-xl border border-amber-300 px-3 py-2 text-sm font-bold text-amber-950">{copy.manage}</Link>
      </div>
      {!plans.length ? <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">{copy.empty}</p> : (
        <div className="mt-4 grid gap-3">
          {plans.map((plan) => <section key={plan.petId} className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
            <h3 className="font-black text-slate-950">{plan.petName} <span className="font-semibold text-slate-600">· {plan.species} · {plan.lifeStage.replace(/_/g, ' ')}</span></h3>
            <p className="mt-2 text-sm leading-6 text-slate-800">{plan.recommendation}</p>
            {plan.foodPreferences.length ? <p className="mt-2 text-xs font-semibold text-slate-700">{copy.preferences}: {plan.foodPreferences.join(', ')}</p> : null}
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-950">{plan.safetyNotes.map((note) => <li key={note}>{note}</li>)}</ul>
          </section>)}
        </div>
      )}
    </article>
  );
}
