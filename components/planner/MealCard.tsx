// components/planner/MealCard.tsx
"use client";

import React, { useState } from "react";

interface AlternativeOption {
    title: string;
    description: string;
    prepTimeMinutes: number;
}

interface Props {
    dishName: string;
    description: string;
    prepTimeMinutes: number;
    costInr: number;
    recipeSteps: string[];
    alternatives?: AlternativeOption[];
    language: "en" | "hi" | "kn";
    onSelectAlternative: (alt: AlternativeOption) => void;
    onShowAnotherOption: (userCraving?: string) => Promise<void>;
}

export function MealCard({
    dishName,
    description,
    prepTimeMinutes,
    costInr,
    recipeSteps,
    alternatives = [],
    language,
    onSelectAlternative,
    onShowAnotherOption,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [showCravingInput, setShowCravingInput] = useState(false);
    const [cravingText, setCravingText] = useState("");

    const labels = {
        en: {
            anotherOption: "Show Me Another Option",
            cravingPlaceholder: "e.g., Want something with paneer, or a quick dinner...",
            cravingPrompt: "What would you like to eat instead?",
            swapBtn: "Suggest Custom Option",
            alternativesHeader: "Quick Alternatives",
            selectAlt: "Choose this meal",
            prep: "Prep Time",
            cost: "Est. Cost",
            mins: "mins",
        },
        hi: {
            anotherOption: "यह पसंद नहीं है — दूसरा विकल्प दिखाएँ",
            cravingPlaceholder: "उदा. आज पनीर बनाना है, या कुछ स्पेशल खाना है...",
            cravingPrompt: "आज आप किस तरह का खाना चाहते हैं?",
            swapBtn: "नया विकल्प सुझाएँ",
            alternativesHeader: "अन्य उपलब्ध विकल्प",
            selectAlt: "इसे चुनें",
            prep: "तैयारी",
            cost: "लागत",
            mins: "मिनट",
        },
        kn: {
            anotherOption: "ಇದು ಬೇಡ — ಬೇರೆ ಆಯ್ಕೆ ತೋರಿಸಿ",
            cravingPlaceholder: "ಉದಾ. ಇಂದು ಪನೀರ್ ಬೇಕು, ಅಥವಾ ಬೇಗನೆ ಆಗುವ ಊಟ...",
            cravingPrompt: "ಇಂದು ನೀವು ಯಾವ ರೀತಿಯ ಊಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
            swapBtn: "ಹೊಸ ಆಯ್ಕೆ ಪಡೆಯಿರಿ",
            alternativesHeader: "ಇತರ ಲಭ್ಯವಿರುವ ಆಯ್ಕೆಗಳು",
            selectAlt: "ಇದನ್ನು ಆಯ್ಕೆಮಾಡಿ",
            prep: "ಸಿದ್ಧತೆ",
            cost: "ವೆಚ್ಚ",
            mins: "ನಿಮಿಷ",
        },
    }[language];

    const handleSwap = async () => {
        setLoading(true);
        await onShowAnotherOption(cravingText);
        setLoading(false);
        setShowCravingInput(false);
        setCravingText("");
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-xl mx-auto">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold mb-2">
                <span>रात का खाना | {new Date().toISOString().slice(0, 10)}</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{dishName}</h1>
            <p className="text-sm text-slate-600 mb-6">{description}</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="text-[11px] text-slate-400 block">{labels.prep}</span>
                    <span className="text-sm font-bold text-slate-800">{prepTimeMinutes} {labels.mins}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="text-[11px] text-slate-400 block">कठिनाई</span>
                    <span className="text-sm font-bold text-slate-800">आसान</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="text-[11px] text-slate-400 block">{labels.cost}</span>
                    <span className="text-sm font-bold text-slate-800">₹{costInr}</span>
                </div>
            </div>

            {/* Pre-Generated 2-3 Instant Alternatives */}
            {alternatives.length > 0 && (
                <div className="mb-6 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        {labels.alternativesHeader}
                    </h4>
                    <div className="space-y-2">
                        {alternatives.map((alt, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">{alt.title}</p>
                                    <p className="text-xs text-slate-500">{alt.prepTimeMinutes} {labels.mins} • {alt.description}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectAlternative(alt)}
                                    className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-50 transition"
                                >
                                    {labels.selectAlt}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Show Another Option Button & Optional Craving Input */}
            <div className="pt-2 border-t border-slate-100">
                {!showCravingInput ? (
                    <button
                        type="button"
                        onClick={() => setShowCravingInput(true)}
                        className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-2xl transition flex items-center justify-center gap-2"
                    >
                        <span>🔄</span>
                        <span>{labels.anotherOption}</span>
                    </button>
                ) : (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <label className="block text-xs font-semibold text-slate-700">
                            {labels.cravingPrompt}
                        </label>
                        <input
                            type="text"
                            value={cravingText}
                            onChange={(e) => setCravingText(e.target.value)}
                            placeholder={labels.cravingPlaceholder}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCravingInput(false)}
                                className="w-1/3 py-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleSwap}
                                className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
                            >
                                {loading ? "Planning..." : labels.swapBtn}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}