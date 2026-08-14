'use client';

import React, { useState } from 'react';
import Script from 'next/script';

export default function SubscriptionPage() {
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

      // 1. Fetch Plan details & Razorpay Key ID from backend
      const res = await fetch('/api/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier,
          billingMarket,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error?.message || 'Failed to initialize subscription plan.');
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
        key: data.keyId,
        subscription_id: data.planId,
        name: 'MAMAAI',
        description: `MAMAAI ${planTier.toUpperCase()} Subscription (${data.currency})`,
        image: '/logo.png',
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planTier,
            }),
          });

          if (verifyRes.ok) {
            alert('🎉 Subscription activated successfully! Welcome to MAMAAI.');
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
        setJudgeStatusMsg('🟢 Key Verified! Activating test subscription...');
        setTimeout(() => {
          alert(`Judge Test Mode Activated! Features unlocked for [${judgePlanSelection.toUpperCase()}].`);
          setShowJudgeModal(false);
          window.location.href = '/';
        }, 1000);
      } else {
        setJudgeStatusMsg('🔴 Invalid Judge Access Key.');
      }
    } catch (err) {
      setJudgeStatusMsg('🔴 Server error verifying key.');
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
              Free Trial Active — 3 Days Remaining
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="inline-flex rounded-xl p-1 bg-gray-100 text-xs font-semibold">
              <button
                onClick={() => setBillingMarket('IN')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  billingMarket === 'IN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                🇮🇳 India (INR)
              </button>
              <button
                onClick={() => setBillingMarket('INT')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  billingMarket === 'INT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                🌐 International (USD)
              </button>
            </div>

            {/* Judge Mode Button */}
            <button
              onClick={() => setShowJudgeModal(true)}
              className="text-xs text-slate-500 hover:text-emerald-600 underline font-medium px-2 py-1"
            >
              Judge / Evaluator Access
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">Choose Your Household Plan</h1>
          <p className="mt-2 text-sm text-gray-600">
            One Family. Different Needs. One Intelligent Meal Plan. 🐾
          </p>
        </div>

        {/* 3 Subscription Tiers */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Standard Subscription (₹399 / $4.99) */}
          <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow transition">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Standard Subscription</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {billingMarket === 'IN' ? '₹399' : '$4.99'}
                </span>
                <span className="text-xs text-gray-500">
                  /mo ({billingMarket === 'IN' ? 'India' : 'International'})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Supports up to 4 human family members.</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Daily family meal planning
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Allergy consideration & food likes/dislikes
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Basic grocery list generation
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Manual pantry tracking
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Standard Ask MAMA access
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('starter')}
              disabled={loadingPlan === 'starter'}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow"
            >
              {loadingPlan === 'starter' ? 'Processing...' : 'Subscribe to Standard'}
            </button>
          </div>

          {/* 2. Premium Subscription (₹599 / $7.99) */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 flex flex-col justify-between shadow-md relative">
            <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full absolute -top-3 right-4">
              MOST POPULAR
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Premium Subscription</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {billingMarket === 'IN' ? '₹599' : '$7.99'}
                </span>
                <span className="text-xs text-gray-500">
                  /mo ({billingMarket === 'IN' ? 'India' : 'International'})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Supports up to 6 human family members.</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Everything in Standard included
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Proactive weekly planning & preference learning
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Pantry intelligence & auto grocery deduction
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Meal repetition memory (7–14 days)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Advanced Ask MAMA AI features
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loadingPlan === 'premium'}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow"
            >
              {loadingPlan === 'premium' ? 'Processing...' : 'Subscribe to Premium'}
            </button>
          </div>

          {/* 3. Plus Subscription (₹999 / $12.99) */}
          <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow transition">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Plus Subscription</h2>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-gray-900">
                  {billingMarket === 'IN' ? '₹999' : '$12.99'}
                </span>
                <span className="text-xs text-gray-500">
                  /mo ({billingMarket === 'IN' ? 'India' : 'International'})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Extended family support including pets 🐾</p>

              <ul className="mt-5 space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Everything in Premium Subscription
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Dog and Cat extended family profiles
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Family Kitchen + Pet safety guard engine
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Pet food shopping & feeding reminders
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> Combined household food budget
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('family_plus')}
              disabled={loadingPlan === 'family_plus'}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition shadow"
            >
              {loadingPlan === 'family_plus' ? 'Processing...' : 'Upgrade to Plus Subscription'}
            </button>
          </div>
        </div>
      </div>

      {/* Judge Bypass Modal */}
      {showJudgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hackathon Evaluator / Judge Access</h3>
            <p className="text-xs text-gray-600 mb-4">
              Enter the Judge Access Key to evaluate subscription-tier AI features without entering credit card details.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Passkey Secret</label>
                <input
                  type="password"
                  placeholder="Enter JUDGE_TEST_KEY"
                  value={judgeKeyInput}
                  onChange={(e) => setJudgeKeyInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Subscription Tier</label>
                <select
                  value={judgePlanSelection}
                  onChange={(e) => setJudgePlanSelection(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="starter">Standard Subscription (₹399 / $4.99)</option>
                  <option value="premium">Premium Subscription (₹599 / $7.99)</option>
                  <option value="family_plus">Plus Subscription (₹999 / $12.99)</option>
                </select>
              </div>

              {judgeStatusMsg && <p className="text-xs font-medium">{judgeStatusMsg}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleJudgeBypass}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition"
                >
                  Unlock Access
                </button>
                <button
                  onClick={() => setShowJudgeModal(false)}
                  className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}