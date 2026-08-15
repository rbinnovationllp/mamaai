'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';

const subscriptionCopy = {
  en: {
    trial: 'Free Trial Active - 3 Days Remaining',
    india: 'India (INR)',
    international: 'International (USD)',
    judgeAccess: 'Judge / Evaluator Access',
    title: 'Choose Your Household Plan',
    subtitle: 'One Family. Different Needs. One Intelligent Meal Plan.',
    starterSupport: 'Supports up to 4 human family members.',
    premiumSupport: 'Supports up to 6 human family members.',
    plusSupport: 'Family Plus adds extended four-paw member meal planning.',
    starterButton: 'Subscribe to Family Starter',
    premiumButton: 'Subscribe to Family Premium',
    plusButton: 'Upgrade to Family Plus',
    processing: 'Processing...',
    popular: 'MOST POPULAR',
    starterFeatures: ['Daily family meal planning', 'Allergy consideration and food likes/dislikes', 'Basic grocery list generation', 'Manual pantry tracking', 'Starter Ask MAMA access'],
    premiumFeatures: ['Everything in Starter included', 'Proactive weekly planning and preference learning', 'Pantry intelligence and auto grocery deduction', 'Meal repetition memory', 'Advanced Ask MAMA AI features'],
    plusFeatures: ['Everything in Premium Subscription', 'Extended four-paw member profiles', 'Separate pet-appropriate meal planning', 'Pet food shopping and feeding reminders', 'Combined household food budget'],
    judgeTitle: 'Hackathon Evaluator / Judge Access',
    judgeText: 'Enter the Judge Access Key to evaluate subscription-tier AI features without entering payment details.',
    passkey: 'Passkey Secret',
    targetTier: 'Target Subscription Tier',
    unlock: 'Unlock Access',
    close: 'Close',
  },
  hi: {
    trial: 'Free Trial Active - 3 दिन बाकी',
    india: 'India (INR)',
    international: 'International (USD)',
    judgeAccess: 'Judge / Evaluator Access',
    title: 'अपना Household Plan चुनें',
    subtitle: 'एक परिवार. अलग जरूरतें. एक समझदार भोजन योजना.',
    starterSupport: '4 human family members तक support.',
    premiumSupport: '6 human family members तक support.',
    plusSupport: 'Family Plus में extended four-paw member meal planning शामिल है.',
    starterButton: 'Family Starter Subscribe करें',
    premiumButton: 'Family Premium Subscribe करें',
    plusButton: 'Family Plus Upgrade करें',
    processing: 'Processing...',
    popular: 'MOST POPULAR',
    starterFeatures: ['Daily family meal planning', 'Allergy और likes/dislikes consideration', 'Basic grocery list generation', 'Manual pantry tracking', 'Starter Ask MAMA access'],
    premiumFeatures: ['Starter की सारी सुविधाएं', 'Weekly planning और preference learning', 'Pantry intelligence और grocery deduction', 'Meal repetition memory', 'Advanced Ask MAMA AI features'],
    plusFeatures: ['Premium की सारी सुविधाएं', 'Extended four-paw member profiles', 'Separate pet-appropriate meal planning', 'Pet food shopping और feeding reminders', 'Combined household food budget'],
    judgeTitle: 'Hackathon Evaluator / Judge Access',
    judgeText: 'Payment details डाले बिना subscription-tier AI features evaluate करने के लिए Judge Access Key डालें.',
    passkey: 'Passkey Secret',
    targetTier: 'Target Subscription Tier',
    unlock: 'Access Unlock करें',
    close: 'Close',
  },
  kn: {
    trial: 'Free Trial Active - 3 ದಿನ ಬಾಕಿ',
    india: 'India (INR)',
    international: 'International (USD)',
    judgeAccess: 'Judge / Evaluator Access',
    title: 'ನಿಮ್ಮ Household Plan ಆಯ್ಕೆ ಮಾಡಿ',
    subtitle: 'ಒಂದು ಕುಟುಂಬ. ವಿಭಿನ್ನ ಅಗತ್ಯಗಳು. ಒಂದು ಬುದ್ಧಿವಂತ ಊಟದ ಪ್ಲ್ಯಾನ್.',
    starterSupport: '4 human family members ವರೆಗೆ support.',
    premiumSupport: '6 human family members ವರೆಗೆ support.',
    plusSupport: 'Family Plus ನಲ್ಲಿ extended four-paw member meal planning ಸೇರಿದೆ.',
    starterButton: 'Family Starter Subscribe ಮಾಡಿ',
    premiumButton: 'Family Premium Subscribe ಮಾಡಿ',
    plusButton: 'Family Plus Upgrade ಮಾಡಿ',
    processing: 'Processing...',
    popular: 'MOST POPULAR',
    starterFeatures: ['Daily family meal planning', 'Allergy ಮತ್ತು likes/dislikes consideration', 'Basic grocery list generation', 'Manual pantry tracking', 'Starter Ask MAMA access'],
    premiumFeatures: ['Starter ನಲ್ಲಿರುವ ಎಲ್ಲವೂ', 'Weekly planning ಮತ್ತು preference learning', 'Pantry intelligence ಮತ್ತು grocery deduction', 'Meal repetition memory', 'Advanced Ask MAMA AI features'],
    plusFeatures: ['Premium ನಲ್ಲಿರುವ ಎಲ್ಲವೂ', 'Extended four-paw member profiles', 'Separate pet-appropriate meal planning', 'Pet food shopping ಮತ್ತು feeding reminders', 'Combined household food budget'],
    judgeTitle: 'Hackathon Evaluator / Judge Access',
    judgeText: 'Payment details ಇಲ್ಲದೆ subscription-tier AI features evaluate ಮಾಡಲು Judge Access Key ನಮೂದಿಸಿ.',
    passkey: 'Passkey Secret',
    targetTier: 'Target Subscription Tier',
    unlock: 'Access Unlock ಮಾಡಿ',
    close: 'Close',
  },
};

export default function SubscriptionPage() {
  const { language } = useLanguage();
  const t = subscriptionCopy[language];
  const [billingMarket, setBillingMarket] = useState<'IN' | 'INT'>('IN');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [judgeKeyInput, setJudgeKeyInput] = useState('');
  const [judgePlanSelection, setJudgePlanSelection] = useState('family_plus');
  const [judgeStatusMsg, setJudgeStatusMsg] = useState('');

  // Loads Razorpay SDK dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handles real Razorpay payment checkout
  const handleSubscribe = async (planTier: 'starter' | 'premium' | 'family_plus') => {
    try {
      setLoadingPlan(planTier);

      // 1. Create a real Razorpay subscription server-side.
      const res = await fetch('/api/razorpay/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          plan: planTier,
          billingMarket,
          customerNotify: false,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.configured) {
        alert(data.error?.message || data.message || 'Failed to create Razorpay subscription.');
        setLoadingPlan(null);
        return;
      }

      // 2. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please check your network connection.');
        setLoadingPlan(null);
        return;
      }

      // 3. Configure Razorpay Options
      const options = {
        key: data.checkout.key,
        subscription_id: data.subscriptionId,
        name: 'MAMAAI',
        description: data.checkout.description,
        image: '/logo.png',
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              userId: 'demo-user',
              planTier,
            }),
          });

          if (verifyRes.ok) {
            alert('Subscription activated successfully. Welcome to MAMAAI.');
            window.location.href = '/';
          } else {
            alert('Payment completed, but verification failed. Support team notified.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#059669',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Subscription error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  // Handles Judge / Evaluator Test Bypass
  const handleJudgeBypass = async () => {
    try {
      setJudgeStatusMsg('Verifying bypass key...');
      const res = await fetch('/api/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: judgePlanSelection,
          judgeBypassKey: judgeKeyInput,
        }),
      });

      const data = await res.json();

      if (res.ok && data.isJudgeBypass) {
        setJudgeStatusMsg('Key verified. Activating test subscription...');
        setTimeout(() => {
          alert(`Judge Test Mode Activated! Features unlocked for [${judgePlanSelection.toUpperCase()}].`);
          setShowJudgeModal(false);
          window.location.href = '/';
        }, 1000);
      } else {
        setJudgeStatusMsg('Invalid Judge Access Key.');
      }
    } catch (err) {
      setJudgeStatusMsg('Server error verifying key.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-6xl mx-auto">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
              {t.trial}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            {/* Currency Switcher */}
            <div className="inline-flex rounded-xl p-1 bg-gray-100 text-xs font-semibold">
              <button
                onClick={() => setBillingMarket('IN')}
                className={`px-3 py-1.5 rounded-lg transition ${billingMarket === 'IN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {t.india}
              </button>
              <button
                onClick={() => setBillingMarket('INT')}
                className={`px-3 py-1.5 rounded-lg transition ${billingMarket === 'INT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {t.international}
              </button>
            </div>

            {/* Judge Mode Button */}
            <button
              onClick={() => setShowJudgeModal(true)}
              className="text-xs text-slate-500 hover:text-emerald-600 underline font-medium px-2 py-1"
            >
              {t.judgeAccess}
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">{t.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t.subtitle}
          </p>
        </div>

        {/* 3 Subscription Tiers */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Starter Subscription (₹399 / $4.99) */}
          <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow transition">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Family Starter</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {billingMarket === 'IN' ? 'Rs. 399' : '$4.99'}
                </span>
                <span className="text-xs text-gray-500">
                  /mo ({billingMarket === 'IN' ? 'India' : 'International'})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{t.starterSupport}</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                {t.starterFeatures.map((feature) => (
                  <li className="flex items-center gap-1.5" key={feature}>
                    <span className="text-emerald-500 font-bold">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('starter')}
              disabled={loadingPlan === 'starter'}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow"
            >
              {loadingPlan === 'starter' ? t.processing : t.starterButton}
            </button>
          </div>

          {/* 2. Premium Subscription (₹599 / $7.99) */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 flex flex-col justify-between shadow-md relative">
            <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full absolute -top-3 right-4">
              {t.popular}
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Family Premium</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {billingMarket === 'IN' ? 'Rs. 599' : '$7.99'}
                </span>
                <span className="text-xs text-gray-500">
                  /mo ({billingMarket === 'IN' ? 'India' : 'International'})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{t.premiumSupport}</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                {t.premiumFeatures.map((feature) => (
                  <li className="flex items-center gap-1.5" key={feature}>
                    <span className="text-emerald-500 font-bold">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loadingPlan === 'premium'}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow"
            >
              {loadingPlan === 'premium' ? t.processing : t.premiumButton}
            </button>
          </div>

          {/* 3. Plus Subscription (₹999 / $12.99) */}
          <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow transition">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Family Plus</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {billingMarket === 'IN' ? 'Rs. 999' : '$12.99'}
                </span>
                <span className="text-xs text-gray-500">
                  /mo ({billingMarket === 'IN' ? 'India' : 'International'})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{t.plusSupport}</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                {t.plusFeatures.map((feature) => (
                  <li className="flex items-center gap-1.5" key={feature}>
                    <span className="text-emerald-500 font-bold">✓</span> {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('family_plus')}
              disabled={loadingPlan === 'family_plus'}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow"
            >
              {loadingPlan === 'family_plus' ? t.processing : t.plusButton}
            </button>
          </div>
        </div>
      </div>

      {/* Judge Bypass Modal */}
      {showJudgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t.judgeTitle}</h3>
            <p className="text-xs text-gray-600 mb-4">
              {t.judgeText}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.passkey}</label>
                <input
                  type="password"
                  placeholder="Enter JUDGE_TEST_KEY"
                  value={judgeKeyInput}
                  onChange={(e) => setJudgeKeyInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.targetTier}</label>
                <select
                  value={judgePlanSelection}
                  onChange={(e) => setJudgePlanSelection(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="starter">Family Starter (Rs. 399 / $4.99)</option>
                  <option value="premium">Family Premium (Rs. 599 / $7.99)</option>
                  <option value="family_plus">Family Plus (Rs. 999 / $12.99)</option>
                </select>
              </div>

              {judgeStatusMsg && <p className="text-xs font-medium">{judgeStatusMsg}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleJudgeBypass}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  {t.unlock}
                </button>
                <button
                  onClick={() => setShowJudgeModal(false)}
                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
