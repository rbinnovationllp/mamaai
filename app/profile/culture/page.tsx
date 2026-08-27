'use client';

import React, { useEffect, useState } from 'react';
import { CookingStyle } from '@/lib/types';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';
import { VoiceTextInput } from '@/components/VoiceTextInput';

const cultureCopy = {
  en: {
    title: 'Global Food Culture & Lifestyle',
    subtitle: 'Tailor MAMAAI to your region and actual eating habits.',
    country: 'Country of Residence',
    region: 'State / Province / Region',
    city: 'City / Local Area',
    cuisines: 'Preferred cuisines or food styles',
    cuisinesHint: 'Example: Punjabi, South Indian, British, Mediterranean, Mixed',
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
    city: 'City / Local Area',
    cuisines: 'Preferred cuisines or food styles',
    cuisinesHint: 'Example: Punjabi, South Indian, British, Mediterranean, Mixed',
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
    city: 'City / Local Area',
    cuisines: 'Preferred cuisines or food styles',
    cuisinesHint: 'Example: Punjabi, South Indian, British, Mediterranean, Mixed',
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
  const [city, setCity] = useState('London');
  const [cookingStyle, setCookingStyle] = useState<CookingStyle>('MIX_FRESH_FROZEN');
  const [cuisinesInput, setCuisinesInput] = useState('Indian, British');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('mamaai_culture_profile_v1');
      if (!saved) return;
      const profile = JSON.parse(saved);
      setCountry(String(profile.country ?? 'United Kingdom'));
      setRegion(String(profile.region ?? 'London'));
      setCity(String(profile.city ?? profile.region ?? 'London'));
      setCookingStyle((profile.cookingStyle ?? 'MIX_FRESH_FROZEN') as CookingStyle);
      setCuisinesInput(Array.isArray(profile.preferredCuisines) ? profile.preferredCuisines.join(', ') : 'Indian, British');
    } catch {
      // Keep defaults if saved culture profile is unavailable.
    }
  }, []);

  const handleSave = async () => {
    const preferredCuisines = cuisinesInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const profile = { country, region, city, cookingStyle, preferredCuisines };
    window.localStorage.setItem('mamaai_culture_profile_v1', JSON.stringify(profile));
    alert(t.saved);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <AppPageNav />

        <section className="rounded-xl border bg-white p-6 shadow-sm">
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
              <label className="block font-medium mb-1">{t.city}</label>
              <VoiceTextInput
                type="text"
                value={city}
                onValueChange={setCity}
                inputClassName="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">{t.cuisines}</label>
              <VoiceTextInput
                type="text"
                value={cuisinesInput}
                onValueChange={setCuisinesInput}
                placeholder={t.cuisinesHint}
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
        </section>
      </div>
    </main>
  );
}
