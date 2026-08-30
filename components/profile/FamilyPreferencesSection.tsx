// components/profile/FamilyPreferencesSection.tsx
"use client";

import React, { useState } from "react";
import { MealTimetableSchedule, MealOccasion } from "@/lib/shared/contracts";

interface Props {
    country: string;
    initialFavorites?: string[];
    initialCustomFavorites?: string[];
    initialSchedule?: MealTimetableSchedule;
    language: "en" | "hi" | "kn";
    onSave: (data: {
        favoriteFoodStyles: string[];
        customFavoriteFoods: string[];
        mealSchedule: MealTimetableSchedule;
    }) => void;
}

const INDIAN_FOOD_OPTIONS = [
    "Home-style Traditional", "North Indian", "South Indian", "Punjabi", "Bengali",
    "Gujarati", "Maharashtrian", "Rajasthani", "Coastal / Malabar", "Indo-Chinese",
    "Rice & Dal Comfort Plates", "Stuffed Parathas & Rotis", "Paneer Delicacies",
    "Egg Curries & Roasts", "Chicken Specials", "Fresh Fish & Seafood", "Light Khichdi & Soups"
];

const GLOBAL_FOOD_OPTIONS = [
    "Home-cooked Comfort", "Mediterranean & Olive Oil Bases", "Pasta & Italian-style",
    "Asian Stir-fries & Noodles", "Continental & Roasts", "Mexican & Wraps",
    "Grain Bowls & Salads", "High-Protein Grills", "Vegetable-Rich Casseroles",
    "Seafood & Baked Fish", "Hearty Soups & Stews"
];

export function FamilyPreferencesSection({
    country,
    initialFavorites = [],
    initialCustomFavorites = [],
    initialSchedule,
    language,
    onSave,
}: Props) {
    const [favorites, setFavorites] = useState<string[]>(initialFavorites);
    const [customFavorites, setCustomFavorites] = useState<string[]>(initialCustomFavorites);
    const [customInput, setCustomInput] = useState("");

    const [schedule, setSchedule] = useState<MealTimetableSchedule>(
        initialSchedule || {
            reminderLeadTimeMinutes: 45,
            weekday: {
                breakfast: { enabled: true, time: "08:00" },
                brunch: { enabled: false, time: "11:00" },
                lunch: { enabled: true, time: "13:00" },
                afternoon_snack: { enabled: false, time: "16:00" },
                high_tea: { enabled: true, time: "17:00" },
                dinner: { enabled: true, time: "20:00" },
                supper: { enabled: false, time: "22:00" },
            },
            useSeparateWeekendSchedule: false,
        }
    );

    const isIndia = !country || country.toLowerCase().includes("india") || country.toLowerCase().includes("bharat");
    const availableOptions = isIndia ? INDIAN_FOOD_OPTIONS : GLOBAL_FOOD_OPTIONS;

    const toggleFavorite = (opt: string) => {
        setFavorites((prev) =>
            prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
        );
    };

    const addCustomFavorite = () => {
        if (customInput.trim() && !customFavorites.includes(customInput.trim())) {
            setCustomFavorites([...customFavorites, customInput.trim()]);
            setCustomInput("");
        }
    };

    const handleTimeChange = (occasion: MealOccasion, time: string, isWeekend = false) => {
        setSchedule((prev) => ({
            ...prev,
            [isWeekend ? "weekend" : "weekday"]: {
                ...(isWeekend ? prev.weekend || prev.weekday : prev.weekday),
                [occasion]: {
                    ...(isWeekend ? prev.weekend?.[occasion] || prev.weekday[occasion] : prev.weekday[occasion]),
                    time,
                },
            },
        }));
    };

    const toggleOccasion = (occasion: MealOccasion, isWeekend = false) => {
        setSchedule((prev) => {
            const target = isWeekend ? prev.weekend || prev.weekday : prev.weekday;
            const current = target[occasion];
            return {
                ...prev,
                [isWeekend ? "weekend" : "weekday"]: {
                    ...target,
                    [occasion]: { ...current, enabled: !current.enabled },
                },
            };
        });
    };

    const labels = {
        en: {
            favHeading: "Which foods does your family like more?",
            favSub: "Select food styles your family loves. MAMAAI will favor these while keeping healthy variety.",
            customPlaceholder: "Add another favorite dish or style (e.g. Biryani, Sourdough toast)...",
            addBtn: "Add",
            timeHeading: "Approximately what time does your family usually have meals?",
            timeSub: "Used to auto-detect the upcoming meal and show gentle timely preparation reminders.",
            separateWeekend: "Use a different meal schedule for weekends",
            saveBtn: "Save Preferences & Meal Timetable",
        },
        hi: {
            favHeading: "आपके परिवार को कौन-से भोजन अधिक पसंद हैं?",
            favSub: "अपनी पसंद के भोजन चुनें। MAMAAI विविधता बनाए रखते हुए इन्हें प्राथमिकता देगा।",
            customPlaceholder: "कोई अन्य पसंदीदा भोजन जोड़ें (उदा. बिरयानी, बाजरे की रोटी)...",
            addBtn: "जोड़ें",
            timeHeading: "आपके परिवार में आमतौर पर भोजन का समय क्या रहता है?",
            timeSub: "अगले भोजन का समय पहचानने और समय पर याद दिलाने के लिए उपयोग किया जाता है।",
            separateWeekend: "सप्ताहांत (Weekend) के लिए अलग समय सेट करें",
            saveBtn: "पसंद और समय सारिणी सुरक्षित करें",
        },
        kn: {
            favHeading: "ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಯಾವ ಆಹಾರಗಳು ಹೆಚ್ಚು ಇಷ್ಟ?",
            favSub: "ನಿಮ್ಮ ಇಷ್ಟದ ಶೈಲಿಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ. MAMAAI ವೈವಿಧ್ಯತೆಯೊಂದಿಗೆ ಇವುಗಳಿಗೆ ಆದ್ಯತೆ ನೀಡುತ್ತದೆ.",
            customPlaceholder: "ಇತರ ಇಷ್ಟದ ತಿನಿಸು ಸೇರಿಸಿ...",
            addBtn: "ಸೇರಿಸಿ",
            timeHeading: "ಸಾಮಾನ್ಯವಾಗಿ ನಿಮ್ಮ ಕುಟುಂಬದ ಊಟದ ಸಮಯ ಯಾವುದು?",
            timeSub: "ಮುಂದಿನ ಊಟವನ್ನು ಗುರುತಿಸಲು ಮತ್ತು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ನೆನಪಿಸಲು ಬಳಸಲಾಗುತ್ತದೆ.",
            separateWeekend: "ವಾರಾಂತ್ಯಕ್ಕೆ (Weekend) ಪ್ರತ್ಯೇಕ ಸಮಯ ಬಳಸಿ",
            saveBtn: "ಇಷ್ಟಗಳು ಮತ್ತು ಸಮಯ ಉಳಿಸಿ",
        },
    }[language];

    return (
        <div className="space-y-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
            {/* 1. Positive Food Preferences */}
            <div>
                <h3 className="text-lg font-bold text-slate-900">{labels.favHeading}</h3>
                <p className="text-xs text-slate-500 mt-1">{labels.favSub}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                    {availableOptions.map((opt) => {
                        const isSelected = favorites.includes(opt);
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => toggleFavorite(opt)}
                                className={`px-3 py-2 text-xs font-semibold rounded-2xl transition border ${isSelected
                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                            >
                                {isSelected ? "✓ " : "+ "}
                                {opt}
                            </button>
                        );
                    })}

                    {customFavorites.map((custom) => (
                        <span
                            key={custom}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                            ★ {custom}
                            <button
                                type="button"
                                onClick={() => setCustomFavorites(customFavorites.filter((c) => c !== custom))}
                                className="text-emerald-600 hover:text-emerald-900 ml-1 font-bold"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>

                {/* Custom entry */}
                <div className="mt-3 flex gap-2">
                    <input
                        type="text"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder={labels.customPlaceholder}
                        className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        type="button"
                        onClick={addCustomFavorite}
                        className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition"
                    >
                        {labels.addBtn}
                    </button>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* 2. Approximate Meal Timetable */}
            <div>
                <h3 className="text-lg font-bold text-slate-900">{labels.timeHeading}</h3>
                <p className="text-xs text-slate-500 mt-1">{labels.timeSub}</p>

                <div className="mt-4 space-y-3">
                    {(["breakfast", "lunch", "high_tea", "dinner"] as MealOccasion[]).map((occ) => {
                        const cfg = schedule.weekday[occ];
                        return (
                            <div key={occ} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={cfg?.enabled ?? true}
                                        onChange={() => toggleOccasion(occ)}
                                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-semibold capitalize text-slate-800">
                                        {occ.replace("_", " ")}
                                    </span>
                                </div>

                                <input
                                    type="time"
                                    value={cfg?.time || "12:00"}
                                    disabled={!cfg?.enabled}
                                    onChange={(e) => handleTimeChange(occ, e.target.value)}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-40"
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Weekend Checkbox Toggle */}
                <div className="mt-4 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="weekendToggle"
                        checked={schedule.useSeparateWeekendSchedule}
                        onChange={(e) =>
                            setSchedule((prev) => ({
                                ...prev,
                                useSeparateWeekendSchedule: e.target.checked,
                                weekend: prev.weekend || { ...prev.weekday },
                            }))
                        }
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="weekendToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        {labels.separateWeekend}
                    </label>
                </div>
            </div>

            <button
                type="button"
                onClick={() => onSave({ favoriteFoodStyles: favorites, customFavoriteFoods: customFavorites, mealSchedule: schedule })}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition text-sm"
            >
                {labels.saveBtn}
            </button>
        </div>
    );
}