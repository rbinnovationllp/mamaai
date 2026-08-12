'use client';

import React, { useState } from 'react';
import { CookingStyle } from '@/lib/types';

export default function CultureProfilePage() {
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
    alert('Global food culture profile saved!');
  };

  return (
    <main className="max-w-2xl mx-auto p-6 bg-white shadow-sm border rounded-xl my-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Global Food Culture & Lifestyle</h1>
      <p className="text-sm text-gray-600 mb-6">Tailor MAMAAI to your region and actual eating habits.</p>

      <div className="space-y-4 text-sm">
        <div>
          <label className="block font-medium mb-1">Country of Residence</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">State / Province / Region</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">How does your family usually eat?</label>
          <select
            value={cookingStyle}
            onChange={(e) => setCookingStyle(e.target.value as CookingStyle)}
            className="w-full border rounded-lg p-2"
          >
            <option value="MOSTLY_FRESH">Mostly fresh home-cooked food</option>
            <option value="MIX_FRESH_FROZEN">Mix of fresh and frozen food</option>
            <option value="MOSTLY_FROZEN_READY">Mostly frozen / ready-to-cook food</option>
            <option value="MOSTLY_READY_TO_EAT">Mostly ready-to-eat food</option>
            <option value="FREQUENT_TAKEAWAY">Takeaway / restaurant frequently</option>
            <option value="MIXED_LIFESTYLE">Mixed lifestyle</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition mt-4"
        >
          Save Culture Profile
        </button>
      </div>
    </main>
  );
}