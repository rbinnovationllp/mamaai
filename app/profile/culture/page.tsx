'use client';

import React, { useState } from 'react';
import { CookingStyle } from '@/lib/types';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { VoiceTextInput } from '@/components/VoiceTextInput';

const cultureCopy = {
  en: {
    title: 'Global Food Culture & Lifestyle',
    subtitle: 'Tailor MAMAAI to your region and actual eating habits.',
    country: 'Country of Residence',
    region: 'State / Province / Region',
    eating: 'How does your family usually eat?',
    save: 'Save Culture Profile',
    saved: 'Global food culture profile saved!',
    options: ['Mostly fresh home-cooked food', 'Mix of fresh and frozen food', 'Mostly frozen / ready-to-cook food', 'Mostly ready-to-eat food', 'Takeaway / restaurant frequently', 'Mixed lifestyle'],
  },
  hi: {
    title: 'Global Food Culture और Lifestyle',
    subtitle: 'MAMAAI को अपने region और eating habits के अनुसार सेट करें.',
    country: 'Country of Residence',
    region: 'State / Province / Region',
    eating: 'आपका परिवार आम तौर पर कैसे खाता है?',
    save: 'Culture Profile Save करें',
    saved: 'Global food culture profile saved!',
    options: ['Mostly fresh home-cooked food', 'Fresh और frozen food का mix', 'Mostly frozen / ready-to-cook food', 'Mostly ready-to-eat food', 'Takeaway / restaurant frequently', 'Mixed lifestyle'],
  },
  kn: {
    title: 'Global Food Culture ಮತ್ತು Lifestyle',
    subtitle: 'ನಿಮ್ಮ region ಮತ್ತು eating habits ಗೆ MAMAAI ಹೊಂದಿಸಿ.',
    country: 'Country of Residence',
    region: 'State / Province / Region',
    eating: 'ನಿಮ್ಮ ಕುಟುಂಬ ಸಾಮಾನ್ಯವಾಗಿ ಹೇಗೆ ಊಟ ಮಾಡುತ್ತದೆ?',
    save: 'Culture Profile Save ಮಾಡಿ',
    saved: 'Global food culture profile saved!',
    options: ['Mostly fresh home-cooked food', 'Fresh ಮತ್ತು frozen food mix', 'Mostly frozen / ready-to-cook food', 'Mostly ready-to-eat food', 'Takeaway / restaurant frequently', 'Mixed lifestyle'],
  },
};

export default function CultureProfilePage() {
  const { language } = useLanguage();
  const t = cultureCopy[language];
  const [country, setCountry] = useState('United Kingdom');
  const [region, setRegion] = useState('London');
  const [cookingStyle, setCookingStyle] = useState<CookingStyle>('MIX_FRESH_FROZEN');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(['Indian', 'British']);

  const handleSave = async () => {
    const profile = { country, region, cookingStyle, preferredCuisines: selectedCuisines };
    await fetch('/api/user/culture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    alert(t.saved);
  };

  return (
    <main className="max-w-2xl mx-auto p-6 bg-white shadow-sm border rounded-xl my-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.title}</h1>
          <p className="text-sm text-gray-600">{t.subtitle}</p>
        </div>
        <LanguageSelector />
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <label className="block font-medium mb-1">{t.country}</label>
          <VoiceTextInput
            type="text"
            value={country}
            onValueChange={setCountry}
            inputClassName="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">{t.region}</label>
          <VoiceTextInput
            type="text"
            value={region}
            onValueChange={setRegion}
            inputClassName="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">{t.eating}</label>
          <select
            value={cookingStyle}
            onChange={(e) => setCookingStyle(e.target.value as CookingStyle)}
            className="w-full border rounded-lg p-2"
          >
            <option value="MOSTLY_FRESH">{t.options[0]}</option>
            <option value="MIX_FRESH_FROZEN">{t.options[1]}</option>
            <option value="MOSTLY_FROZEN_READY">{t.options[2]}</option>
            <option value="MOSTLY_READY_TO_EAT">{t.options[3]}</option>
            <option value="FREQUENT_TAKEAWAY">{t.options[4]}</option>
            <option value="MIXED_LIFESTYLE">{t.options[5]}</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition mt-4"
        >
          {t.save}
        </button>
      </div>
    </main>
  );
}
