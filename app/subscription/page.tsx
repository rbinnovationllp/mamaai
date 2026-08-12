'use client';

import React from 'react';

export default function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
            Free Trial Active — 3 Days Remaining
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-3">
            Choose Your Household Plan
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            One Family. Different Needs. One Intelligent Meal Plan. 🐾
          </p>
        </div>

        {/* 3 Paid Tiers */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          
          {/* Plan 1: Family Starter */}
          <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow transition">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Family Starter</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">₹399</span>
                <span className="text-xs text-gray-500">/mo (India)</span>
                <span className="block text-xs font-medium text-emerald-700">~$5/mo (International)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Supports up to 4 human family members.</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Daily family meal planning</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Allergy consideration & food likes/dislikes</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Basic grocery list generation</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Manual pantry tracking</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Standard Ask MAMA access</li>
              </ul>
            </div>

            <button className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow">
              Start 3-Day Free Trial
            </button>
          </div>

          {/* Plan 2: Family Premium */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 flex flex-col justify-between shadow-md relative">
            <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full absolute -top-3 right-4">
              MOST POPULAR
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Family Premium</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">₹599</span>
                <span className="text-xs text-gray-500">/mo (India)</span>
                <span className="block text-xs font-medium text-emerald-700">~$7/mo (International)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Supports up to 6 human family members.</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Everything in Starter included</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Proactive weekly planning & preference learning</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Pantry intelligence & auto grocery deduction</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Meal repetition memory (7–14 days)</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Advanced Ask MAMA AI features</li>
              </ul>
            </div>

            <button className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow">
              Subscribe to Family Premium
            </button>
          </div>

          {/* Plan 3: MAMAAI Premium Family+ */}
          <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow transition">
            <div>
              <h2 className="text-lg font-bold text-gray-900">MAMAAI Premium Family+</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">₹999</span>
                <span className="text-xs text-gray-500">/mo (India)</span>
                <span className="block text-xs font-medium text-emerald-700">$11.99/mo (International)</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Extended family support including pets 🐾</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Everything in Family Premium</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Dog and Cat extended family profiles</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Family Kitchen + Pet safety guard engine</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Pet food shopping & feeding reminders</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Combined household food budget</li>
              </ul>
            </div>

            <button className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow">
              Upgrade to Premium Family+
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}