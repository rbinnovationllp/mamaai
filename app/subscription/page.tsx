'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { AppPageNav } from '@/components/AppPageNav';
import { LanguageSelector, useLanguage } from '@/components/LanguageProvider';

const HOUSEHOLD_STORAGE_KEY = 'mamaai_household_members_v1';
const CUSTOMER_STORAGE_KEY = 'mamaai_customer_account_v1';

type HouseholdMember = {
  id: string;
  name: string;
  relation: string;
};

const subscriptionCopy = {
  en: {
    trial: 'Free Trial Active - 3 Days Remaining',
    india: 'India (INR)',
    international: 'International (USD)',
    judgeAccess: 'Judge / Evaluator Access',
    title: 'Choose Your Household Plan',
    subtitle: 'One Family. Different Needs. One Intelligent Meal Plan.',
    householdTitle: 'Choosing for your saved household',
    householdEmpty:
      'No household members found yet. You can still subscribe, or create your family profile first.',
    createProfile: 'Create family profile',
    plannerCta: "Go to Meal Planner",
    completeProfileCta: 'Complete Family Profile',
    nextActionTitle: 'Next after subscription',
    nextActionReady:
      "Your saved household can go straight to the meal planner after payment or trial confirmation.",
    nextActionMissing:
      'Family details are still missing. Complete the family profile first, then return here to choose a plan.',
    accountTitle: 'Customer account',
    accountText: 'Enter your name and contact once. We will keep your selected plan and continue to Razorpay.',
    customerName: 'Your name',
    customerMobile: 'Mobile number',
    customerEmail: 'Email address',
    accountReady: 'Customer account ready.',
    accountNeeded: 'Please enter your name before checkout. Mobile or email is recommended for support.',
    suggested: 'Suggested plan',
    starterSupport: 'Supports up to 4 human family members.',
    premiumSupport: 'Supports up to 6 human family members.',
    plusSupport: 'Family Plus adds extended four-paw member meal planning.',
    starterButton: 'Subscribe to Family Starter',
    premiumButton: 'Subscribe to Family Premium',
    plusButton: 'Upgrade to Family Plus',
    processing: 'Processing...',
    popular: 'MOST POPULAR',
    starterFeatures: [
      'Daily family meal planning',
      'Allergy consideration and food likes/dislikes',
      'Basic grocery list generation',
      'Manual pantry tracking',
      'Starter Ask MAMA access',
    ],
    premiumFeatures: [
      'Everything in Starter included',
      'Proactive weekly planning and preference learning',
      'Pantry intelligence and auto grocery deduction',
      'Meal repetition memory',
      'Advanced Ask MAMA AI features',
    ],
    plusFeatures: [
      'Everything in Premium Subscription',
      'Extended four-paw member profiles',
      'Separate pet-appropriate meal planning',
      'Pet food shopping and feeding reminders',
      'Combined household food budget',
    ],
    judgeTitle: 'Hackathon Evaluator / Judge Access',
    judgeText:
      'Enter the Judge Access Key to evaluate subscription-tier AI features without entering payment details.',
    passkey: 'Passkey Secret',
    targetTier: 'Target Subscription Tier',
    unlock: 'Unlock Access',
    close: 'Close',
    activeRedirecting: 'Active subscription found. Opening Meal Planner...',
  },
  hi: {
    trial: 'Free Trial Active - 3 दिन बाकी',
    india: 'India (INR)',
    international: 'International (USD)',
    judgeAccess: 'Judge / Evaluator Access',
    title: 'अपना Household Plan चुनें',
    subtitle: 'एक परिवार. अलग जरूरतें. एक समझदार भोजन योजना.',
    householdTitle: 'आपके saved household के लिए plan चुना जा रहा है',
    householdEmpty:
      'अभी household members नहीं मिले. आप subscribe कर सकते हैं, या पहले family profile बना सकते हैं.',
    createProfile: 'Family profile बनाएं',
    plannerCta: 'Meal Planner पर जाएं',
    completeProfileCta: 'Family Profile Complete करें',
    nextActionTitle: 'Subscription के बाद next step',
    nextActionReady:
      'Payment या trial confirmation के बाद आपका saved household सीधे meal planner में जा सकता है.',
    nextActionMissing:
      'Family details अभी missing हैं. पहले family profile complete करें, फिर plan चुनें.',
    accountTitle: 'Customer account',
    accountText: 'अपना नाम और contact डालें. आपका selected plan सुरक्षित रहेगा और Razorpay खुलेगा.',
    customerName: 'Your name',
    customerMobile: 'Mobile number',
    customerEmail: 'Email address',
    accountReady: 'Customer account ready.',
    accountNeeded: 'Checkout से पहले अपना नाम डालें. Support के लिए mobile या email बेहतर है.',
    suggested: 'Suggested plan',
    starterSupport: '4 human family members तक support.',
    premiumSupport: '6 human family members तक support.',
    plusSupport: 'Family Plus में extended four-paw member meal planning शामिल है.',
    starterButton: 'Family Starter Subscribe करें',
    premiumButton: 'Family Premium Subscribe करें',
    plusButton: 'Family Plus Upgrade करें',
    processing: 'Processing...',
    popular: 'MOST POPULAR',
    starterFeatures: [
      'Daily family meal planning',
      'Allergy और likes/dislikes consideration',
      'Basic grocery list generation',
      'Manual pantry tracking',
      'Starter Ask MAMA access',
    ],
    premiumFeatures: [
      'Starter की सारी सुविधाएं',
      'Weekly planning और preference learning',
      'Pantry intelligence और grocery deduction',
      'Meal repetition memory',
      'Advanced Ask MAMA AI features',
    ],
    plusFeatures: [
      'Premium की सारी सुविधाएं',
      'Extended four-paw member profiles',
      'Separate pet-appropriate meal planning',
      'Pet food shopping और feeding reminders',
      'Combined household food budget',
    ],
    judgeTitle: 'Hackathon Evaluator / Judge Access',
    judgeText:
      'Payment details डाले बिना subscription-tier AI features evaluate करने के लिए Judge Access Key डालें.',
    passkey: 'Passkey Secret',
    targetTier: 'Target Subscription Tier',
    unlock: 'Access Unlock करें',
    close: 'Close',
    activeRedirecting: 'Active subscription मिल गया है। Meal Planner खोला जा रहा है...',
  },
  kn: {
    trial: 'Free Trial Active - 3 ದಿನ ಬಾಕಿ',
    india: 'India (INR)',
    international: 'International (USD)',
    judgeAccess: 'Judge / Evaluator Access',
    title: 'ನಿಮ್ಮ Household Plan ಆಯ್ಕೆ ಮಾಡಿ',
    subtitle: 'ಒಂದು ಕುಟುಂಬ. ವಿಭಿನ್ನ ಅಗತ್ಯಗಳು. ಒಂದು ಬುದ್ಧಿವಂತ ಊಟದ ಪ್ಲ್ಯಾನ್.',
    householdTitle: 'ನಿಮ್ಮ saved household ಗೆ plan ಆಯ್ಕೆ ಮಾಡಲಾಗುತ್ತಿದೆ',
    householdEmpty:
      'Household members ಇನ್ನೂ ಸಿಗಲಿಲ್ಲ. ನೀವು subscribe ಮಾಡಬಹುದು, ಅಥವಾ ಮೊದಲು family profile ರಚಿಸಬಹುದು.',
    createProfile: 'Family profile ರಚಿಸಿ',
    plannerCta: 'Meal Planner ಗೆ ಹೋಗಿ',
    completeProfileCta: 'Family Profile Complete ಮಾಡಿ',
    nextActionTitle: 'Subscription ನಂತರ next step',
    nextActionReady:
      'Payment ಅಥವಾ trial confirmation ನಂತರ ನಿಮ್ಮ saved household ನೇರವಾಗಿ meal planner ಗೆ ಹೋಗಬಹುದು.',
    nextActionMissing:
      'Family details ಇನ್ನೂ missing ಇವೆ. ಮೊದಲು family profile complete ಮಾಡಿ, ನಂತರ plan ಆಯ್ಕೆಮಾಡಿ.',
    accountTitle: 'Customer account',
    accountText: 'ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು contact ನಮೂದಿಸಿ. Selected plan ಉಳಿಸಿ Razorpay ಮುಂದುವರಿಯುತ್ತದೆ.',
    customerName: 'Your name',
    customerMobile: 'Mobile number',
    customerEmail: 'Email address',
    accountReady: 'Customer account ready.',
    accountNeeded: 'Checkout ಮೊದಲು ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ. Support ಗೆ mobile ಅಥವಾ email ಉತ್ತಮ.',
    suggested: 'Suggested plan',
    starterSupport: '4 human family members ವರೆಗೆ support.',
    premiumSupport: '6 human family members ವರೆಗೆ support.',
    plusSupport: 'Family Plus ನಲ್ಲಿ extended four-paw member meal planning ಸೇರಿದೆ.',
    starterButton: 'Family Starter Subscribe ಮಾಡಿ',
    premiumButton: 'Family Premium Subscribe ಮಾಡಿ',
    plusButton: 'Family Plus Upgrade ಮಾಡಿ',
    processing: 'Processing...',
    popular: 'MOST POPULAR',
    starterFeatures: [
      'Daily family meal planning',
      'Allergy ಮತ್ತು likes/dislikes consideration',
      'Basic grocery list generation',
      'Manual pantry tracking',
      'Starter Ask MAMA access',
    ],
    premiumFeatures: [
      'Starter ನಲ್ಲಿರುವ ಎಲ್ಲವೂ',
      'Weekly planning ಮತ್ತು preference learning',
      'Pantry intelligence ಮತ್ತು grocery deduction',
      'Meal repetition memory',
      'Advanced Ask MAMA AI features',
    ],
    plusFeatures: [
      'Premium ನಲ್ಲಿರುವ ಎಲ್ಲವೂ',
      'Extended four-paw member profiles',
      'Separate pet-appropriate meal planning',
      'Pet food shopping ಮತ್ತು feeding reminders',
      'Combined household food budget',
    ],
    judgeTitle: 'Hackathon Evaluator / Judge Access',
    judgeText:
      'Payment details ಇಲ್ಲದೆ subscription-tier AI features evaluate ಮಾಡಲು Judge Access Key ನಮೂದಿಸಿ.',
    passkey: 'Passkey Secret',
    targetTier: 'Target Subscription Tier',
    unlock: 'Access Unlock ಮಾಡಿ',
    close: 'Close',
    activeRedirecting: 'ಸಕ್ರಿಯ subscription ಸಿಕ್ಕಿದೆ. Meal Planner ತೆರೆಯಲಾಗುತ್ತಿದೆ...',
  },
};

function getSuggestedPlan(memberCount: number): string {
  if (memberCount >= 7) return 'Family Plus';
  if (memberCount >= 5) return 'Family Premium';
  return 'Family Starter';
}

export default function SubscriptionPage() {
  const { language } = useLanguage();
  const t = subscriptionCopy[language] ?? subscriptionCopy.en;
  const [billingMarket, setBillingMarket] = useState<'IN' | 'INT'>('IN');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [judgeKeyInput, setJudgeKeyInput] = useState('');
  const [judgePlanSelection, setJudgePlanSelection] = useState('family_plus');
  const [judgeStatusMsg, setJudgeStatusMsg] = useState('');
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [customerUserId, setCustomerUserId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const [checkingEntitlement, setCheckingEntitlement] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const nextMembers = parsed
            .filter((member) => member?.name)
            .map((member) => ({
              id: String(member.id ?? member.name),
              name: String(member.name),
              relation: String(member.relation ?? ''),
            }));
          setHouseholdMembers(nextMembers);
          if (nextMembers[0]?.name) setCustomerName((current) => current || nextMembers[0].name);
        }
      }

      const savedCustomer = window.localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (savedCustomer) {
        const parsedCustomer = JSON.parse(savedCustomer);
        setCustomerUserId(String(parsedCustomer.userId ?? ''));
        setCustomerName(String(parsedCustomer.name ?? ''));
        setCustomerMobile(String(parsedCustomer.mobile ?? ''));
        setCustomerEmail(String(parsedCustomer.email ?? ''));
      }
    } catch {
      setHouseholdMembers([]);
    }
  }, []);

  useEffect(() => {
    async function loadCustomerSession() {
      try {
        const response = await fetch('/api/customer/session', { cache: 'no-store' });
        const data = await response.json();
        if (data.authenticated && data.customer) {
          setCustomerUserId(data.userId);
          setCustomerName(data.customer.name ?? '');
          setCustomerMobile(data.customer.mobile ?? '');
          setCustomerEmail(data.customer.email ?? '');
          const existingCustomer = JSON.parse(window.localStorage.getItem(CUSTOMER_STORAGE_KEY) || '{}');
          window.localStorage.setItem(
            CUSTOMER_STORAGE_KEY,
            JSON.stringify({
              ...existingCustomer,
              userId: data.userId,
              name: data.customer.name ?? '',
              mobile: data.customer.mobile ?? '',
              email: data.customer.email ?? '',
              householdFoodPreference: data.customer.householdFoodPreference ?? existingCustomer.householdFoodPreference,
              cookingHabit: data.customer.cookingHabit ?? existingCustomer.cookingHabit,
            })
          );
        }
        if (data.familyProfile?.members?.length) {
          setHouseholdMembers(data.familyProfile.members);
          window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(data.familyProfile.members));
        }
      } catch {
        // The account panel below still lets the customer continue.
      }
    }

    loadCustomerSession();
  }, []);

  useEffect(() => {
    if (!customerUserId) return;
    let cancelled = false;

    async function redirectActiveSubscriber() {
      setCheckingEntitlement(true);
      try {
        const response = await fetch(`/api/subscriptions/status?userId=${encodeURIComponent(customerUserId)}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        const entitlement = data.entitlement;
        const isActive =
          entitlement?.isActive === true &&
          (entitlement?.status === 'active' || entitlement?.status === 'trialing');
        if (!cancelled && isActive) {
          setCheckoutStatus(t.activeRedirecting);
          window.location.href = '/planner?subscription=active';
        }
      } catch {
        // Keep the subscription page usable if the status lookup is temporarily unavailable.
      } finally {
        if (!cancelled) setCheckingEntitlement(false);
      }
    }

    redirectActiveSubscriber();
    return () => {
      cancelled = true;
    };
  }, [customerUserId, t.activeRedirecting]);

  const suggestedPlan = useMemo(
    () => getSuggestedPlan(householdMembers.length),
    [householdMembers.length]
  );

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

  const handleSubscribe = async (planTier: 'starter' | 'premium' | 'family_plus') => {
    try {
      setLoadingPlan(planTier);
      setCheckoutStatus('');

      const cleanName = customerName.trim() || householdMembers[0]?.name?.trim() || '';
      const cleanMobile = customerMobile.trim();
      const cleanEmail = customerEmail.trim();

      if (!cleanName) {
        setCheckoutStatus(t.accountNeeded);
        setLoadingPlan(null);
        return;
      }

      const sessionResponse = await fetch('/api/customer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          mobile: cleanMobile,
          email: cleanEmail,
          preferredLanguage: language,
        }),
      });
      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok || !sessionData.authenticated) {
        setCheckoutStatus(sessionData.error?.message || 'Please create your account before checkout.');
        setLoadingPlan(null);
        return;
      }

      setCustomerUserId(sessionData.userId);
      window.localStorage.setItem(
        CUSTOMER_STORAGE_KEY,
        JSON.stringify({
          ...(JSON.parse(window.localStorage.getItem(CUSTOMER_STORAGE_KEY) || '{}')),
          userId: sessionData.userId,
          name: cleanName,
          mobile: cleanMobile,
          email: cleanEmail,
          selectedPlan: planTier,
        })
      );
      setCheckoutStatus('Preparing secure Razorpay checkout...');

      const res = await fetch('/api/razorpay/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionData.userId,
          plan: planTier,
          billingMarket,
          customerNotify: false,
          householdMembers,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.configured) {
        setCheckoutStatus(data.error?.message || data.message || 'Failed to create Razorpay subscription.');
        setLoadingPlan(null);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setCheckoutStatus('Razorpay SDK failed to load. Please check your network connection.');
        setLoadingPlan(null);
        return;
      }

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
              userId: sessionData.userId,
              planTier,
            }),
          });

          if (verifyRes.ok) {
            window.localStorage.setItem('mamaai_last_successful_plan', planTier);
            alert('Subscription activated successfully. Welcome to MAMAAI.');
            window.location.href = '/planner?subscription=success';
          } else {
            setCheckoutStatus('Payment completed, but verification failed. Support team notified.');
          }
        },
        prefill: {
          name: cleanName,
          email: cleanEmail,
          contact: cleanMobile,
        },
        notes: {
          householdMemberCount: String(householdMembers.length),
          suggestedPlan,
        },
        theme: {
          color: '#059669',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Subscription error:', err);
      setCheckoutStatus(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

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
          window.location.href = '/planner?judge=success';
        }, 1000);
      } else {
        setJudgeStatusMsg('Invalid Judge Access Key.');
      }
    } catch {
      setJudgeStatusMsg('Server error verifying key.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 font-sans sm:px-6 lg:px-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="mx-auto max-w-6xl">
        <AppPageNav />

        <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {t.trial}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <LanguageSelector />

            <div className="inline-flex rounded-xl bg-gray-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBillingMarket('IN')}
                className={`rounded-lg px-3 py-1.5 transition ${billingMarket === 'IN'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {t.india}
              </button>
              <button
                type="button"
                onClick={() => setBillingMarket('INT')}
                className={`rounded-lg px-3 py-1.5 transition ${billingMarket === 'INT'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                {t.international}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowJudgeModal(true)}
              className="px-2 py-1 text-xs font-medium text-slate-500 underline hover:text-emerald-600"
            >
              {t.judgeAccess}
            </button>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">{t.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{t.subtitle}</p>
        </div>

        <section className="mb-8 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold text-emerald-800">{t.householdTitle}</p>
              {householdMembers.length > 0 ? (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    {householdMembers.length} member{householdMembers.length > 1 ? 's' : ''}:{' '}
                    {householdMembers.map((member) => member.name).join(', ')}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {t.suggested}: {suggestedPlan}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-600">{t.householdEmpty}</p>
              )}
            </div>

            <Link
              href="/profile/family"
              className="rounded-xl border border-emerald-200 px-4 py-2 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              {t.createProfile}
            </Link>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold text-orange-900">{t.nextActionTitle}</p>
              <p className="mt-1 text-sm leading-6 text-orange-900/80">
                {householdMembers.length > 0 ? t.nextActionReady : t.nextActionMissing}
              </p>
            </div>
            <Link
              href={householdMembers.length > 0 ? '/planner' : '/profile/family'}
              className="rounded-xl bg-emerald-700 px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              {householdMembers.length > 0 ? t.plannerCta : t.completeProfileCta}
            </Link>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold text-emerald-800">{t.accountTitle}</p>
            <p className="mt-1 text-sm text-slate-600">{t.accountText}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.customerName}</span>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Example: Rajesh"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.customerMobile}</span>
              <input
                value={customerMobile}
                onChange={(event) => setCustomerMobile(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Example: 9876543210"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">{t.customerEmail}</span>
              <input
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Example: name@email.com"
              />
            </label>
          </div>

          {customerUserId ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {t.accountReady}
            </p>
          ) : null}

          {checkoutStatus ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {checkoutStatus}
            </p>
          ) : null}
        </section>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          <PlanCard
            title="Family Starter"
            price={billingMarket === 'IN' ? 'Rs. 399' : '$4.99'}
            market={billingMarket === 'IN' ? 'India' : 'International'}
            support={t.starterSupport}
            features={t.starterFeatures}
            buttonText={checkingEntitlement || loadingPlan === 'starter' ? t.processing : t.starterButton}
            disabled={checkingEntitlement || loadingPlan === 'starter'}
            onClick={() => handleSubscribe('starter')}
          />

          <PlanCard
            title="Family Premium"
            price={billingMarket === 'IN' ? 'Rs. 599' : '$7.99'}
            market={billingMarket === 'IN' ? 'India' : 'International'}
            support={t.premiumSupport}
            features={t.premiumFeatures}
            buttonText={checkingEntitlement || loadingPlan === 'premium' ? t.processing : t.premiumButton}
            disabled={checkingEntitlement || loadingPlan === 'premium'}
            onClick={() => handleSubscribe('premium')}
            highlighted
            badge={t.popular}
          />

          <PlanCard
            title="Family Plus"
            price={billingMarket === 'IN' ? 'Rs. 999' : '$12.99'}
            market={billingMarket === 'IN' ? 'India' : 'International'}
            support={t.plusSupport}
            features={t.plusFeatures}
            buttonText={checkingEntitlement || loadingPlan === 'family_plus' ? t.processing : t.plusButton}
            disabled={checkingEntitlement || loadingPlan === 'family_plus'}
            onClick={() => handleSubscribe('family_plus')}
          />
        </div>
      </div>

      {showJudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">{t.judgeTitle}</h3>
            <p className="mb-4 text-xs text-gray-600">{t.judgeText}</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">{t.passkey}</label>
                <input
                  type="password"
                  placeholder="Enter JUDGE_TEST_KEY"
                  value={judgeKeyInput}
                  onChange={(event) => setJudgeKeyInput(event.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">{t.targetTier}</label>
                <select
                  value={judgePlanSelection}
                  onChange={(event) => setJudgePlanSelection(event.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="starter">Family Starter (Rs. 399 / $4.99)</option>
                  <option value="premium">Family Premium (Rs. 599 / $7.99)</option>
                  <option value="family_plus">Family Plus (Rs. 999 / $12.99)</option>
                </select>
              </div>

              {judgeStatusMsg && <p className="text-xs font-medium">{judgeStatusMsg}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleJudgeBypass}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                >
                  {t.unlock}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJudgeModal(false)}
                  className="rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
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

function PlanCard({
  title,
  price,
  market,
  support,
  features,
  buttonText,
  disabled,
  onClick,
  highlighted = false,
  badge,
}: {
  title: string;
  price: string;
  market: string;
  support: string;
  features: string[];
  buttonText: string;
  disabled: boolean;
  onClick: () => void;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm transition hover:shadow ${highlighted ? 'border-2 border-emerald-500 shadow-md' : 'border'
        }`}
    >
      {badge ? (
        <span className="absolute -top-3 right-4 rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          {badge}
        </span>
      ) : null}

      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <div className="mt-3">
          <span className="text-3xl font-extrabold text-gray-900">{price}</span>
          <span className="text-xs text-gray-500">/mo ({market})</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">{support}</p>

        <ul className="mt-5 space-y-2 text-xs text-gray-700">
          {features.map((feature) => (
            <li className="flex items-center gap-1.5" key={feature}>
              <span className="font-bold text-emerald-500">✓</span> {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mt-6 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {buttonText}
      </button>
    </div>
  );
}
