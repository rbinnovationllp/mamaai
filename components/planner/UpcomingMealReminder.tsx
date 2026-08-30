// components/planner/UpcomingMealReminder.tsx
"use client";

import React, { useState, useEffect } from "react";
import { checkUpcomingReminder } from "@/lib/planner/time-engine";
import { MealOccasion, MealSlot, MealTimetableSchedule, DayAttendancePlan } from "@/lib/shared/contracts";

interface Props {
    schedule?: MealTimetableSchedule;
    attendance?: DayAttendancePlan;
    language: "en" | "hi" | "kn";
    onViewPlan: (slot: MealSlot) => void;
}

export function UpcomingMealReminder({ schedule, attendance, language, onViewPlan }: Props) {
    const [reminder, setReminder] = useState<{ occasion: MealOccasion; slot: MealSlot; targetTime: string } | null>(null);
    const [dismissedSlots, setDismissedSlots] = useState<Record<string, number>>({});

    useEffect(() => {
        // Restore dismissed/snooze timestamps from session
        try {
            const raw = sessionStorage.getItem("mamaai_reminder_snooze");
            if (raw) setDismissedSlots(JSON.parse(raw));
        } catch { }

        const interval = setInterval(() => {
            const confirmed: string[] = JSON.parse(localStorage.getItem("mamaai_confirmed_slots") || "[]");
            const check = checkUpcomingReminder({
                schedule,
                attendance,
                confirmedSlots: confirmed,
                dismissedUntil: dismissedSlots,
            });

            if (check.shouldRemind && check.occasion && check.slot && check.targetTime) {
                setReminder({ occasion: check.occasion, slot: check.slot, targetTime: check.targetTime });
            } else {
                setReminder(null);
            }
        }, 15000); // Check every 15s

        return () => clearInterval(interval);
    }, [schedule, attendance, dismissedSlots]);

    if (!reminder) return null;

    const slotKey = `${new Date().toISOString().slice(0, 10)}_${reminder.slot}`;

    const labels = {
        en: {
            title: `${reminder.slot.toUpperCase()} time is approaching (${reminder.targetTime})`,
            message: `Would you like to review and prepare today's ${reminder.slot} plan?`,
            viewBtn: `Review ${reminder.slot} Plan`,
            remindLater: "Remind Me Later",
            dismiss: "Not Now",
        },
        hi: {
            title: `आपके ${reminder.slot === "breakfast" ? "नाश्ते" : reminder.slot === "lunch" ? "लंच" : reminder.slot === "snacks" ? "हाई टी" : "डिनर"} का समय करीब है (${reminder.targetTime})`,
            message: `क्या आप आज का ${reminder.slot === "breakfast" ? "नाश्ता" : reminder.slot === "lunch" ? "लंच" : "डिनर"} प्लान देखना चाहेंगे?`,
            viewBtn: "प्लान देखें",
            remindLater: "बाद में याद दिलाएँ",
            dismiss: "अभी नहीं",
        },
        kn: {
            title: `ನಿಮ್ಮ ${reminder.slot === "breakfast" ? "ಉಪಹಾರದ" : reminder.slot === "lunch" ? "ಊಟದ" : "ರಾತ್ರಿ ಊಟದ"} ಸಮಯ ಹತ್ತಿರವಾಗುತ್ತಿದೆ (${reminder.targetTime})`,
            message: `ಇಂದಿನ ಊಟದ ಯೋಜನೆಯನ್ನು ಪರಿಶೀಲಿಸಲು ಬಯಸುವಿರಾ?`,
            viewBtn: "ಯೋಜನೆ ವೀಕ್ಷಿಸಿ",
            remindLater: "ನಂತರ ನೆನಪಿಸಿ",
            dismiss: "ಈಗ ಬೇಡ",
        },
    }[language];

    const handleSnooze = () => {
        const updated = { ...dismissedSlots, [slotKey]: Date.now() + 20 * 60 * 1000 }; // Snooze 20 mins
        setDismissedSlots(updated);
        sessionStorage.setItem("mamaai_reminder_snooze", JSON.stringify(updated));
        setReminder(null);
    };

    const handleDismiss = () => {
        const updated = { ...dismissedSlots, [slotKey]: Date.now() + 4 * 60 * 60 * 1000 }; // Dismiss for this meal
        setDismissedSlots(updated);
        sessionStorage.setItem("mamaai_reminder_snooze", JSON.stringify(updated));
        setReminder(null);
    };

    const handleView = () => {
        onViewPlan(reminder.slot);
        setReminder(null);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-slide-up">
            <div className="bg-white rounded-3xl p-5 shadow-2xl border border-emerald-100 ring-4 ring-emerald-600/10">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">⏰</span>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{labels.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{labels.message}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handleView}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                    >
                        {labels.viewBtn}
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSnooze}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] rounded-xl transition"
                        >
                            {labels.remindLater}
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="py-2 px-3 text-slate-400 hover:text-slate-600 font-medium text-[11px] transition"
                        >
                            {labels.dismiss}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}