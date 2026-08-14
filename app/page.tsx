'use client';

import React from 'react';
import Link from 'next/link';
import { AskMamaWidget } from '@/components/AskMamaWidget';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#1E293B] font-sans antialiased">
      
      {/* 1. HERO SECTION */}
      <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold tracking-wider text-emerald-800 uppercase bg-emerald-100/70 px-3 py-1.5 rounded-md inline-block">
              MEAL & ASHAAR MANAGEMENT ASSISTANT
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
              One Family. <br />
              Different Needs. <br />
              <span className="text-emerald-700">One Intelligent Meal Plan.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
              Tell MAMAAI about your family once. It helps plan what to cook, how much to cook, and how the same family meal can be adjusted for everyone.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/profile/family"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-7 py-3.5 rounded-xl shadow-sm transition hover:shadow-md"
              >
                Plan My Family Meals
              </Link>
              <Link
                href="/ask-mama"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-sm transition hover:shadow-md"
              >
                Try Demo / Judge Access
              </Link>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4 text-xs text-gray-600 max-w-xl">
              You are experiencing MAMAAI. Custom family profile modifications, smart pantry substitutions, and allergen separations update dynamically.
            </div>
          </div>

          {/* Right Column: Interactive Family Plate Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-3xl p-6 shadow-sm">
              {/* Member Badges */}
              <div className="grid grid-cols-5 gap-2 text-center mb-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center">GM</div>
                  <span className="text-[10px] font-bold text-gray-700 mt-1 block">Grandmother</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">FA</div>
                  <span className="text-[10px] font-bold text-gray-700 mt-1 block">Father</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">MO</div>
                  <span className="text-[10px] font-bold text-gray-700 mt-1 block">Mother</span>
                </div>
                <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">SO</div>
                  <span className="text-[10px] font-bold text-gray-700 mt-1 block">Son</span>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">CH</div>
                  <span className="text-[10px] font-bold text-gray-700 mt-1 block">Child</span>
                </div>
              </div>

              {/* Meal Summary Box */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  TODAY'S FAMILY MEAL
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">
                  Dal + Rice + Vegetables
                </h3>
                
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="bg-amber-100/70 text-amber-900 px-2.5 py-1 rounded-lg">Softer for Grandmother</span>
                  <span className="bg-amber-100/70 text-amber-900 px-2.5 py-1 rounded-lg">Adjusted for Father</span>
                  <span className="bg-amber-100/70 text-amber-900 px-2.5 py-1 rounded-lg">Extra protein for Son</span>
                  <span className="bg-amber-100/70 text-amber-900 px-2.5 py-1 rounded-lg">Recipe opens in planner</span>
                  <span className="bg-amber-100/70 text-amber-900 px-2.5 py-1 rounded-lg">Replace works after plan</span>
                  <span className="bg-amber-100/70 text-amber-900 px-2.5 py-1 rounded-lg">Grocery list below</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. THE DAILY FOOD PROBLEM SECTION */}
      <section className="py-14 bg-white/70 border-y border-amber-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            THE DAILY FOOD PROBLEM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-8">
            Every Family Eats Together. But Everyone's Needs Are Different.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#E6F4EA] p-5 rounded-2xl border border-emerald-200/50">
              <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">GM</div>
              <h4 className="font-bold text-gray-900 text-sm">Grandmother</h4>
              <p className="text-xs text-gray-600 mt-1">Softer, easy-to-digest food</p>
            </div>
            <div className="bg-[#FFF4E5] p-5 rounded-2xl border border-amber-200/50">
              <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">FA</div>
              <h4 className="font-bold text-gray-900 text-sm">Father</h4>
              <p className="text-xs text-gray-600 mt-1">Diet-aware portions</p>
            </div>
            <div className="bg-[#FFFDE7] p-5 rounded-2xl border border-yellow-200/50">
              <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">MO</div>
              <h4 className="font-bold text-gray-900 text-sm">Mother</h4>
              <p className="text-xs text-gray-600 mt-1">Balanced nutrition</p>
            </div>
            <div className="bg-[#E0F2FE] p-5 rounded-2xl border border-sky-200/50">
              <div className="w-9 h-9 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center mb-3">SO</div>
              <h4 className="font-bold text-gray-900 text-sm">Son</h4>
              <p className="text-xs text-gray-600 mt-1">Additional protein</p>
            </div>
            <div className="bg-[#F3E8FF] p-5 rounded-2xl border border-purple-200/50 col-span-2 sm:col-span-1">
              <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-3">CH</div>
              <h4 className="font-bold text-gray-900 text-sm">Child</h4>
              <p className="text-xs text-gray-600 mt-1">Growth-supportive nutrition</p>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200/70 p-5 rounded-2xl text-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">These profiles come together into</span>
            <p className="text-2xl font-black text-emerald-800 mt-1">One Common Family Meal</p>
            <span className="text-xs text-gray-600">with personalized portions and adjustments</span>
          </div>
        </div>
      </section>

      {/* 3. HOW MAMAAI WORKS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
          HOW MAMAAI WORKS
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-10">
          From family profile to practical cooking plan.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-4">1</div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Tell MAMAAI About Your Family</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Add members, preferences, allergies, fasting, region, cuisine, and kitchen context.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-4">2</div>
            <h3 className="font-bold text-gray-900 text-base mb-2">MAMAAI Plans One Practical Meal</h3>
            <p className="text-xs text-gray-600 leading-relaxed">It considers the family together instead of creating separate diet plans for everyone.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center mb-4">3</div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Everyone Gets What They Need</h3>
            <p className="text-xs text-gray-600 leading-relaxed">Portions, adjustments, fruit, hydration, recipes, ingredients, and groceries update together.</p>
          </div>
        </div>
      </section>

      {/* 4. ASK MAMA LIVE AI WIDGET SECTION */}
      <section id="ask-mama" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            Live AI Assistant
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3">
            Ask MAMA Anything
          </h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto mt-2">
            Ask questions about family meal planning, recipe swaps, dietary restrictions, or MAMAAI platform features.
          </p>
        </div>

        {/* Embedded Live Ask MAMA Interactive Chatbot */}
        <AskMamaWidget />
      </section>

      {/* 5. CORE FEATURES SECTION */}
      <section className="py-16 bg-white/70 border-t border-amber-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            CORE FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-10">
            Built for real family kitchens.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center mb-4">AI</div>
              <h3 className="font-bold text-gray-900 text-sm mb-2">AI Family Meal Planning</h3>
              <p className="text-xs text-gray-600 leading-relaxed">One practical meal planned around the whole family.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-900 font-bold text-xs flex items-center justify-center mb-4">PT</div>
              <h3 className="font-bold text-gray-900 text-sm mb-2">Personalized Portions</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Different portions and adjustments for individual needs.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center mb-4">SA</div>
              <h3 className="font-bold text-gray-900 text-sm mb-2">Allergy & Dislike Aware</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Avoid unsafe ingredients and account for disliked foods.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center mb-4">RG</div>
              <h3 className="font-bold text-gray-900 text-sm mb-2">Regional & Seasonal Foods</h3>
              <p className="text-xs text-gray-600 leading-relaxed">Adapted to location, cuisine preference, season, and availability.</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}