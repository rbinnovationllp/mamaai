'use client';

import React, { useState } from 'react';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { VoiceTextInput } from '@/components/VoiceTextInput';

const familyProfileCopy = {
  en: {
    title: 'Family Profiles & Restrictions',
    subtitle: "Configure dietary constraints for each family member to guide MAMAAI's meal engine.",
    addTitle: 'Add Family Member',
    name: 'Name',
    relation: 'Relationship',
    allergy: 'Medical Allergies & Intolerances (Hard Safety Constraint)',
    doctor: 'Doctor-Advised Restrictions (Hard Medical Constraint)',
    dislike: 'General Taste Dislikes (Soft Optimization Constraint)',
    strategy: 'Meal Strategy Preference',
    common: 'Prefer One Common Family Meal',
    separate: 'Allow Custom Separate Dish If Restricted',
    addButton: 'Add Member Profile',
    configured: 'Configured Household Members',
    empty: 'No family members added yet. Add a profile above.',
    remove: 'Remove',
    none: 'None',
    allergyShort: 'Medical Allergies',
    doctorShort: 'Doctor Restrictions',
    dislikeShort: 'Taste Dislikes',
  },
  hi: {
    title: 'Family Profiles और Restrictions',
    subtitle: 'हर family member की dietary constraints सेट करें ताकि MAMAAI meal engine सही guidance दे.',
    addTitle: 'Family Member जोड़ें',
    name: 'Name',
    relation: 'Relationship',
    allergy: 'Medical Allergies और Intolerances (Hard Safety Constraint)',
    doctor: 'Doctor-Advised Restrictions (Hard Medical Constraint)',
    dislike: 'General Taste Dislikes (Soft Optimization Constraint)',
    strategy: 'Meal Strategy Preference',
    common: 'एक Common Family Meal पसंद करें',
    separate: 'Restriction हो तो Separate Dish allow करें',
    addButton: 'Member Profile जोड़ें',
    configured: 'Configured Household Members',
    empty: 'अभी कोई family member add नहीं है. ऊपर profile add करें.',
    remove: 'Remove',
    none: 'None',
    allergyShort: 'Medical Allergies',
    doctorShort: 'Doctor Restrictions',
    dislikeShort: 'Taste Dislikes',
  },
  kn: {
    title: 'Family Profiles ಮತ್ತು Restrictions',
    subtitle: 'ಪ್ರತಿ family member dietary constraints ಸೆಟ್ ಮಾಡಿ, MAMAAI meal engine ಸರಿಯಾದ guidance ನೀಡಲು.',
    addTitle: 'Family Member ಸೇರಿಸಿ',
    name: 'Name',
    relation: 'Relationship',
    allergy: 'Medical Allergies ಮತ್ತು Intolerances (Hard Safety Constraint)',
    doctor: 'Doctor-Advised Restrictions (Hard Medical Constraint)',
    dislike: 'General Taste Dislikes (Soft Optimization Constraint)',
    strategy: 'Meal Strategy Preference',
    common: 'ಒಂದು Common Family Meal ಆಯ್ಕೆ',
    separate: 'Restriction ಇದ್ದರೆ Separate Dish allow ಮಾಡಿ',
    addButton: 'Member Profile ಸೇರಿಸಿ',
    configured: 'Configured Household Members',
    empty: 'ಇನ್ನೂ family member add ಆಗಿಲ್ಲ. ಮೇಲಿನ profile add ಮಾಡಿ.',
    remove: 'Remove',
    none: 'None',
    allergyShort: 'Medical Allergies',
    doctorShort: 'Doctor Restrictions',
    dislikeShort: 'Taste Dislikes',
  },
};

export interface FamilyMemberProfile {
  id: string;
  name: string;
  relation: string;
  allergies: string[];
  doctorAdvisedRestrictions: string[];
  dislikes: string[];
  mealStrategyPreference: 'common' | 'allow_separate';
}

export default function FamilyProfilePage() {
  const { language } = useLanguage();
  const t = familyProfileCopy[language];
  const [members, setMembers] = useState<FamilyMemberProfile[]>([
    {
      id: 'm1',
      name: 'Rajesh',
      relation: 'Self / Parent',
      allergies: ['Peanuts'],
      doctorAdvisedRestrictions: ['Low Sodium / Reduced Salt'],
      dislikes: ['Karela (Bitter Gourd)', 'Mushroom'],
      mealStrategyPreference: 'common',
    },
  ]);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [doctorInput, setDoctorInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [mealStrategy, setMealStrategy] = useState<'common' | 'allow_separate'>('common');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !relation) return;

    const newMember: FamilyMemberProfile = {
      id: `m_${Date.now()}`,
      name,
      relation,
      allergies: allergyInput ? allergyInput.split(',').map((s) => s.trim()) : [],
      doctorAdvisedRestrictions: doctorInput ? doctorInput.split(',').map((s) => s.trim()) : [],
      dislikes: dislikeInput ? dislikeInput.split(',').map((s) => s.trim()) : [],
      mealStrategyPreference: mealStrategy,
    };

    setMembers([...members, newMember]);
    setName('');
    setRelation('');
    setAllergyInput('');
    setDoctorInput('');
    setDislikeInput('');
    setMealStrategy('common');
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-xs text-gray-500 mt-1">{t.subtitle}</p>
            </div>
            <LanguageSelector />
          </div>
        </div>

        {/* Form: Add Family Member */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">{t.addTitle}</h2>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.name}</label>
                <VoiceTextInput
                  type="text"
                  placeholder="e.g. Aarav"
                  value={name}
                  onValueChange={setName}
                  inputClassName="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.relation}</label>
                <VoiceTextInput
                  type="text"
                  placeholder="e.g. Son, Spouse, Parent"
                  value={relation}
                  onValueChange={setRelation}
                  inputClassName="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Hard Constraint 1 */}
            <div>
              <label className="block text-xs font-semibold text-red-700 mb-1">
                {t.allergy}
              </label>
              <VoiceTextInput
                type="text"
                placeholder="Comma separated: Peanuts, Shellfish, Lactose"
                value={allergyInput}
                onValueChange={setAllergyInput}
                inputClassName="w-full px-3 py-2 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none bg-red-50/30"
                mode="append"
              />
            </div>

            {/* Hard Constraint 2 */}
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">
                {t.doctor}
              </label>
              <VoiceTextInput
                type="text"
                placeholder="Comma separated: Low Sodium, Low Sugar, Gluten-Free"
                value={doctorInput}
                onValueChange={setDoctorInput}
                inputClassName="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50/30"
                mode="append"
              />
            </div>

            {/* Soft Constraint */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t.dislike}
              </label>
              <VoiceTextInput
                type="text"
                placeholder="Comma separated: Karela, Capsicum, Spicy Food"
                value={dislikeInput}
                onValueChange={setDislikeInput}
                inputClassName="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                mode="append"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.strategy}</label>
              <select
                value={mealStrategy}
                onChange={(e) => setMealStrategy(e.target.value as 'common' | 'allow_separate')}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="common">{t.common}</option>
                <option value="allow_separate">{t.separate}</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow"
            >
              {t.addButton}
            </button>
          </form>
        </div>

        {/* Household Members List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">{t.configured}</h2>
          {members.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border text-center text-xs text-gray-500">
              {t.empty}
            </div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{m.name}</h3>
                    <span className="text-xs font-medium text-gray-500">{m.relation}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    {t.remove}
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  {/* Allergies */}
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <span className="font-bold text-red-800 block mb-1">{t.allergyShort}</span>
                    {m.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.allergies.map((a, i) => (
                          <span key={i} className="bg-red-200 text-red-900 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">{t.none}</span>
                    )}
                  </div>

                  {/* Doctor Restrictions */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-800 block mb-1">{t.doctorShort}</span>
                    {m.doctorAdvisedRestrictions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.doctorAdvisedRestrictions.map((d, i) => (
                          <span key={i} className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">{t.none}</span>
                    )}
                  </div>

                  {/* Dislikes */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-800 block mb-1">{t.dislikeShort}</span>
                    {m.dislikes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.dislikes.map((dl, i) => (
                          <span key={i} className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {dl}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">{t.none}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}
