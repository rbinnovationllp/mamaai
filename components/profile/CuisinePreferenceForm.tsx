"use client";

import React, { useState } from "react";
import type { RegionalCuisinePreference, FoodVarietyMode, FamilyCuisineProfile } from "@/lib/shared/contracts";

interface Props {
    initialProfile?: FamilyCuisineProfile;
    language?: "en" | "hi" | "kn";
    onSave: (profile: FamilyCuisineProfile) => Promise<void>;
}

const CUISINE_OPTIONS: Array<{ id: RegionalCuisinePreference; labelEn: string; labelHi: string; labelKn: string; states: string }> = [
    { id: "north_indian", labelEn: "North Indian", labelHi: "उत्तर भारतीय (North Indian)", labelKn: "ಉತ್ತರ ಭಾರತೀಯ", states: "Punjab, Haryana, UP, Delhi, Rajasthan" },
    { id: "south_indian", labelEn: "South Indian", labelHi: "दक्षिण भारतीय (South Indian)", labelKn: "ದಕ್ಷಿಣ ಭಾರತೀಯ", states: "Karnataka, Tamil Nadu, Kerala, AP, Telangana" },
    { id: "western_indian", labelEn: "Western Indian", labelHi: "पश्चिम भारतीय (Western Indian)", labelKn: "ಪಶ್ಚಿಮ ಭಾರತೀಯ", states: "Maharashtra, Gujarat, Goa" },
    { id: "eastern_indian", labelEn: "Eastern Indian", labelHi: "पूर्वी भारतीय (Eastern Indian)", labelKn: "ಪೂರ್ವ ಭಾರತೀಯ", states: "West Bengal, Odisha, Bihar, Jharkhand" },
    { id: "central_indian", labelEn: "Central Indian", labelHi: "मध्य भारतीय (Central Indian)", labelKn: "ಮಧ್ಯ ಭಾರತೀಯ", states: "Madhya Pradesh, Chhattisgarh" },
    { id: "pahadi", labelEn: "Himalayan / Pahadi", labelHi: "पहाड़ी (Pahadi / Himalayan)", labelKn: "ಹಿಮಾಲಯನ್ / ಪಹಾಡಿ", states: "Uttarakhand, Himachal Pradesh" },
    { id: "kashmiri", labelEn: "Kashmiri", labelHi: "कश्मीरी (Kashmiri)", labelKn: "ಕಾಶ್ಮೀರಿ", states: "Kashmiri home cooking" },
    { id: "northeast_indian", labelEn: "North-East Indian", labelHi: "उत्तर-पूर्वी (North-East)", labelKn: "ಈಶಾನ್ಯ ಭಾರತೀಯ", states: "Assam, Meghalaya, Manipur, etc." },
    { id: "pan_indian", labelEn: "Pan-India / Mixed", labelHi: "मिश्रित भारतीय (Pan-India)", labelKn: "ಮಿಶ್ರ ಭಾರತೀಯ", states: "All regions / flexible" },
];

export function CuisinePreferenceForm({ initialProfile, language = "hi", onSave }: Props) {
    const [selectedCuisines, setSelectedCuisines] = useState<RegionalCuisinePreference[]>(
        initialProfile?.primaryCuisine
            ? [initialProfile.primaryCuisine, ...(initialProfile.secondaryCuisines || [])]
            : ["north_indian"]
    );
    const [primaryCuisine, setPrimaryCuisine] = useState<RegionalCuisinePreference>(
        initialProfile?.primaryCuisine || "north_indian"
    );
    const [varietyMode, setVarietyMode] = useState<FoodVarietyMode>(
        initialProfile?.varietyMode || "mostly_primary"
    );
    const [isSaving, setIsSaving] = useState(false);

    const toggleCuisine = (cuisineId: RegionalCuisinePreference) => {
        let nextSelected: RegionalCuisinePreference[];
        if (selectedCuisines.includes(cuisineId)) {
            if (selectedCuisines.length === 1) return; // Keep at least one
            nextSelected = selectedCuisines.filter((c) => c !== cuisineId);
            if (primaryCuisine === cuisineId) {
                setPrimaryCuisine(nextSelected[0]);
            }
        } else {
            nextSelected = [...selectedCuisines, cuisineId];
        }
        setSelectedCuisines(nextSelected);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const secondary = selectedCuisines.filter((c) => c !== primaryCuisine);
        await onSave({
            primaryCuisine,
            secondaryCuisines: secondary,
            varietyMode,
        });
        setIsSaving(false);
    };

    return (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900">
                    {language === "hi" ? "आपके परिवार का भोजन किस प्रकार का है?" : "What type of food does your family prefer?"}
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {language === "hi"
                        ? "आप कहीं भी रह रहे हों (जैसे कर्नाटक), भोजन आपकी पसंद के अनुसार बनेगा। एक से अधिक विकल्प चुन सकते हैं।"
                        : "Regardless of your current residence, meals will follow your culinary identity. You can select multiple cuisines."}
                </p>
            </div>

            {/* Multi-Select Cuisines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CUISINE_OPTIONS.map((opt) => {
                    const isSelected = selectedCuisines.includes(opt.id);
                    const isPrimary = primaryCuisine === opt.id;
                    return (
                        <div
                            key={opt.id}
                            onClick={() => toggleCuisine(opt.id)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${isSelected
                                    ? "bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                                }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-900">
                                        {language === "hi" ? opt.labelHi : opt.labelEn}
                                    </span>
                                    {isSelected && (
                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">{opt.states}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Primary Cuisine Selector if Multiple Chosen */}
            {selectedCuisines.length > 1 && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-amber-950 block">
                        {language === "hi"
                            ? "मुख्य रूप से सबसे ज्यादा कौन सा भोजन पसंद है? (Primary Cuisine)"
                            : "Which cuisine does your family prefer the most? (Primary)"}
                    </label>
                    <select
                        value={primaryCuisine}
                        onChange={(e) => setPrimaryCuisine(e.target.value as RegionalCuisinePreference)}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                    >
                        {selectedCuisines.map((c) => {
                            const opt = CUISINE_OPTIONS.find((o) => o.id === c);
                            return (
                                <option key={c} value={c}>
                                    {opt ? (language === "hi" ? opt.labelHi : opt.labelEn) : c}
                                </option>
                            );
                        })}
                    </select>
                </div>
            )}

            {/* Variety Mode */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                    {language === "hi" ? "भोजन में विविधता का स्तर (Variety Mode)" : "Food Variety Distribution"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                        { id: "mostly_primary", label: language === "hi" ? "ज्यादातर मुख्य भोजन (~75%)" : "Mostly Primary (~75%)" },
                        { id: "balanced_mix", label: language === "hi" ? "संतुलित मिश्रण (50/50)" : "Balanced Mix (50/50)" },
                        { id: "pan_india_rotation", label: language === "hi" ? "अखिल भारतीय विविधता" : "Pan-India Variety" },
                    ].map((mode) => (
                        <button
                            key={mode.id}
                            type="button"
                            onClick={() => setVarietyMode(mode.id as FoodVarietyMode)}
                            className={`p-2.5 rounded-xl text-xs font-bold border text-center transition ${varietyMode === mode.id
                                    ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold rounded-2xl shadow-md transition disabled:opacity-50"
            >
                {isSaving
                    ? language === "hi" ? "सहेजा जा रहा है..." : "Saving..."
                    : language === "hi" ? "पसंद सेव करें और आगे बढ़ें" : "Save Preferences"}
            </button>
        </div>
    );
}