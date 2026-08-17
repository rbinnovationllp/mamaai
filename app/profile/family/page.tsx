'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { VoiceTextInput } from '@/components/VoiceTextInput';

export interface FamilyMemberProfile {
  id: string;
  name: string;
  relation: string;
  allergies: string[];
  doctorAdvisedRestrictions: string[];
  dislikes: string[];
  mealStrategyPreference: 'common' | 'allow_separate';
}

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';

const copy = {
  en: {
    title: 'Create Family Profile',
    subtitle:
      'Add each household member so MAMAAI can plan meals around allergies, health needs, dislikes and family preferences.',
    name: 'Member name',
    relation: 'Relation',
    allergies: 'Medical allergies',
    allergiesHint: 'Example: peanuts, milk, gluten',
    doctor: 'Doctor restrictions',
    doctorHint: 'Example: low sodium, diabetic friendly',
    dislikes: 'Taste dislikes',
    dislikesHint: 'Example: karela, mushroom',
    strategy: 'Meal Strategy Preference',
    commonMeal: 'Prefer One Common Family Meal',
    separateMeal: 'Allow Separate / Alternative Meal',
    add: 'Add Member Profile',
    configured: 'Configured Household Members',
    empty: 'No family members added yet. Add your first member to continue.',
    remove: 'Remove',
    nextTitle: 'Next: choose a plan for this household',
    nextText:
      'Your family profile is ready. Continue to subscription and choose the plan that fits this household.',
    recommended: 'Suggested plan',
    continue: 'View checkout options',
    demo: 'Open home demo',
    clear: 'Clear saved household',
    savedNote: 'Only members you add here are shown. Demo data is not used in this flow.',
  },
  hi: {
    title: 'Family Profile बनाएं',
    subtitle:
      'हर household member को जोड़ें ताकि MAMAAI allergies, health needs, dislikes और preferences के अनुसार meal plan बना सके.',
    name: 'Member name',
    relation: 'Relation',
    allergies: 'Medical allergies',
    allergiesHint: 'Example: peanuts, milk, gluten',
    doctor: 'Doctor restrictions',
    doctorHint: 'Example: low sodium, diabetic friendly',
    dislikes: 'Taste dislikes',
    dislikesHint: 'Example: karela, mushroom',
    strategy: 'Meal Strategy Preference',
    commonMeal: 'Prefer One Common Family Meal',
    separateMeal: 'Allow Separate / Alternative Meal',
    add: 'Add Member Profile',
    configured: 'Configured Household Members',
    empty: 'अभी कोई family member add नहीं है. Continue करने के लिए पहला member add करें.',
    remove: 'Remove',
    nextTitle: 'Next: इस household के लिए plan चुनें',
    nextText:
      'आपका family profile ready है. Subscription पर continue करके इस household के लिए सही plan चुनें.',
    recommended: 'Suggested plan',
    continue: 'View checkout options',
    demo: 'Home demo खोलें',
    clear: 'Clear saved household',
    savedNote: 'यहां केवल वही members दिखेंगे जिन्हें आप add करेंगे. Demo data इस flow में use नहीं होता.',
  },
  kn: {
    title: 'Family Profile ರಚಿಸಿ',
    subtitle:
      'Allergies, health needs, dislikes ಮತ್ತು preferences ಪ್ರಕಾರ MAMAAI meal plan ಮಾಡಲು household members ಸೇರಿಸಿ.',
    name: 'Member name',
    relation: 'Relation',
    allergies: 'Medical allergies',
    allergiesHint: 'Example: peanuts, milk, gluten',
    doctor: 'Doctor restrictions',
    doctorHint: 'Example: low sodium, diabetic friendly',
    dislikes: 'Taste dislikes',
    dislikesHint: 'Example: karela, mushroom',
    strategy: 'Meal Strategy Preference',
    commonMeal: 'Prefer One Common Family Meal',
    separateMeal: 'Allow Separate / Alternative Meal',
    add: 'Add Member Profile',
    configured: 'Configured Household Members',
    empty: 'ಇನ್ನೂ family member add ಮಾಡಿಲ್ಲ. Continue ಮಾಡಲು ಮೊದಲ member add ಮಾಡಿ.',
    remove: 'Remove',
    nextTitle: 'Next: ಈ household ಗೆ plan ಆಯ್ಕೆಮಾಡಿ',
    nextText:
      'ನಿಮ್ಮ family profile ready ಆಗಿದೆ. Subscription ಗೆ continue ಮಾಡಿ ಸರಿಯಾದ plan ಆಯ್ಕೆಮಾಡಿ.',
    recommended: 'Suggested plan',
    continue: 'View checkout options',
    demo: 'Home demo ತೆರೆಯಿರಿ',
    clear: 'Clear saved household',
    savedNote: 'ಇಲ್ಲಿ ನೀವು add ಮಾಡಿದ members ಮಾತ್ರ ಕಾಣುತ್ತಾರೆ. Demo data ಈ flow ನಲ್ಲಿ use ಆಗುವುದಿಲ್ಲ.',
  },
};

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSuggestedPlan(memberCount: number): string {
  if (memberCount >= 7) return 'Family Plus - Rs. 999';
  if (memberCount >= 5) return 'Family Premium - Rs. 599';
  return 'Family Starter - Rs. 399';
}

const inputClassName =
  'rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

export default function FamilyProfilePage() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;

  const [members, setMembers] = useState<FamilyMemberProfile[]>([]);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [doctorInput, setDoctorInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [mealStrategy, setMealStrategy] =
    useState<FamilyMemberProfile['mealStrategyPreference']>('common');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setMembers(parsed);
      }
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(members));
    } catch {
      // Local persistence is helpful, but the form should still work without it.
    }
  }, [members]);

  const suggestedPlan = useMemo(() => getSuggestedPlan(members.length), [members.length]);

  const handleAddMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanRelation = relation.trim();

    if (!cleanName || !cleanRelation) return;

    const newMember: FamilyMemberProfile = {
      id: `m_${Date.now()}`,
      name: cleanName,
      relation: cleanRelation,
      allergies: splitCsv(allergyInput),
      doctorAdvisedRestrictions: splitCsv(doctorInput),
      dislikes: splitCsv(dislikeInput),
      mealStrategyPreference: mealStrategy,
    };

    setMembers((current) => [...current, newMember]);

    setName('');
    setRelation('');
    setAllergyInput('');
    setDoctorInput('');
    setDislikeInput('');
    setMealStrategy('common');
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers((current) => current.filter((member) => member.id !== memberId));
  };

  const handleClearHousehold = () => {
    setMembers([]);
    try {
      window.localStorage.removeItem(HOUSEHOLD_STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-emerald-700">
            <span aria-hidden="true">&larr;</span> MAMAAI Home
          </Link>
          <LanguageSelector />
        </div>

        <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{t.title}</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{t.subtitle}</p>
        </section>

        <form
          onSubmit={handleAddMember}
          className="mb-10 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
        >
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.name}</span>
              <VoiceTextInput
                value={name}
                onValueChange={setName}
                placeholder="Example: Rajesh"
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.relation}</span>
              <VoiceTextInput
                value={relation}
                onValueChange={setRelation}
                placeholder="Example: Self / Parent / Child"
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.allergies}</span>
              <VoiceTextInput
                value={allergyInput}
                onValueChange={setAllergyInput}
                placeholder={t.allergiesHint}
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.doctor}</span>
              <VoiceTextInput
                value={doctorInput}
                onValueChange={setDoctorInput}
                placeholder={t.doctorHint}
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.dislikes}</span>
              <VoiceTextInput
                value={dislikeInput}
                onValueChange={setDislikeInput}
                placeholder={t.dislikesHint}
                inputClassName={inputClassName}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.strategy}</span>
              <select
                value={mealStrategy}
                onChange={(event) =>
                  setMealStrategy(event.target.value as FamilyMemberProfile['mealStrategyPreference'])
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="common">{t.commonMeal}</option>
                <option value="allow_separate">{t.separateMeal}</option>
              </select>
            </label>

            <button
              type="submit"
              className="rounded-2xl bg-emerald-600 px-5 py-4 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200"
            >
              {t.add}
            </button>
          </div>
        </form>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">{t.configured}</h2>

            {members.length > 0 && (
              <button
                type="button"
                onClick={handleClearHousehold}
                className="text-sm font-semibold text-red-600"
              >
                {t.clear}
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
              {t.empty}
            </div>
          ) : (
            <div className="grid gap-5">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-950">{member.name}</h3>
                      <p className="mt-1 text-base font-semibold text-slate-500">{member.relation}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-sm font-bold text-red-600"
                    >
                      {t.remove}
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {member.allergies.length > 0 && (
                      <InfoBlock title={t.allergies} tone="red" values={member.allergies} />
                    )}

                    {member.doctorAdvisedRestrictions.length > 0 && (
                      <InfoBlock
                        title={t.doctor}
                        tone="yellow"
                        values={member.doctorAdvisedRestrictions}
                      />
                    )}

                    {member.dislikes.length > 0 && (
                      <InfoBlock title={t.dislikes} tone="slate" values={member.dislikes} />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {members.length > 0 && (
          <section className="rounded-3xl bg-emerald-700 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">
              {members.length} household member{members.length > 1 ? 's' : ''} added
            </p>

            <h2 className="mt-2 text-2xl font-bold">{t.nextTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-emerald-50">{t.nextText}</p>

            <div className="mt-5 rounded-2xl bg-white/12 p-4 ring-1 ring-white/20">
              <p className="text-sm text-emerald-100">{t.recommended}</p>
              <p className="mt-1 text-xl font-bold">{suggestedPlan}</p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/subscription"
                className="rounded-2xl bg-white px-5 py-4 text-center text-base font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50"
              >
                {t.continue}
              </Link>

              <Link
                href="/#planner"
                className="rounded-2xl border border-white/35 px-5 py-4 text-center text-base font-bold text-white transition hover:bg-white/10"
              >
                {t.demo}
              </Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-emerald-100">{t.savedNote}</p>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoBlock({
  title,
  values,
  tone,
}: {
  title: string;
  values: string[];
  tone: 'red' | 'yellow' | 'slate';
}) {
  const styles = {
    red: 'bg-red-50 text-red-900 ring-red-100',
    yellow: 'bg-yellow-50 text-yellow-900 ring-yellow-100',
    slate: 'bg-slate-50 text-slate-900 ring-slate-100',
  };

  const chipStyles = {
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-900',
    slate: 'bg-slate-200 text-slate-800',
  };

  return (
    <div className={`rounded-2xl p-4 ring-1 ${styles[tone]}`}>
      <h4 className="mb-3 text-base font-bold">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${chipStyles[tone]}`}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
