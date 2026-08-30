"use client";

import React, { useState, useEffect } from "react";

export interface AlternativeOption {
    title: string;
    description: string;
    prepTimeMinutes: number;
}

interface Props {
    dishName: string;
    description: string;
    mealLabel?: string;
    targetDate?: string;
    prepTimeMinutes: number;
    difficulty?: string;
    costInr: number;
    recipeSteps: string[];
    alternatives?: AlternativeOption[];
    language: "en" | "hi" | "kn";
    onSelectAlternative: (alt: AlternativeOption) => void | Promise<void>;
    onShowAnotherOption: (userCraving?: string) => Promise<void>;
}

export function MealCard({
    dishName,
    description,
    mealLabel,
    targetDate,
    prepTimeMinutes,
    difficulty,
    costInr,
    recipeSteps = [],
    alternatives = [],
    language = "hi",
    onSelectAlternative,
    onShowAnotherOption,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [showCravingInput, setShowCravingInput] = useState(false);
    const [cravingText, setCravingText] = useState("");

    const labels = {
        en: {
            selectedBadge: "Selected Meal",
            recipeHeading: "Recipe Steps",
            watchVideo: "Watch Recipe Video",
            anotherOption: "Show Me Another Option",
            cravingPlaceholder: "e.g., Want something with paneer, or a quick dinner...",
            cravingPrompt: "What would you like to eat instead?",
            swapBtn: "Suggest Custom Option",
            alternativesHeader: "Quick Alternatives",
            selectAlt: "Choose this meal",
            prep: "Prep Time",
            difficulty: "Difficulty",
            easy: "Easy",
            cost: "Est. Cost",
            mins: "mins",
            cancel: "Cancel",
            planning: "Planning...",
        },
        hi: {
            selectedBadge: "चुना गया भोजन",
            recipeHeading: "बनाने की विधि",
            watchVideo: "रेसिपी वीडियो देखें",
            anotherOption: "यह पसंद नहीं है — दूसरा विकल्प दिखाएँ",
            cravingPlaceholder: "उदा. आज पनीर बनाना है, या कुछ स्पेशल खाना है...",
            cravingPrompt: "आज आप किस तरह का खाना चाहते हैं?",
            swapBtn: "नया विकल्प सुझाएँ",
            alternativesHeader: "अन्य उपलब्ध विकल्प",
            selectAlt: "इसे चुनें",
            prep: "तैयारी",
            difficulty: "कठिनाई",
            easy: "आसान",
            cost: "लागत",
            mins: "मिनट",
            cancel: "रद्द करें",
            planning: "योजना बन रही है...",
        },
        kn: {
            selectedBadge: "ಆಯ್ಕೆಮಾಡಿದ ಊಟ",
            recipeHeading: "ಮಾಡುವ ವಿಧಾನ",
            watchVideo: "ರೆಸಿಪಿ ವಿಡಿಯೋ ವೀಕ್ಷಿಸಿ",
            anotherOption: "ಇದು ಬೇಡ — ಬೇರೆ ಆಯ್ಕೆ ತೋರಿಸಿ",
            cravingPlaceholder: "ಉದಾ. ಇಂದು ಪನೀರ್ ಬೇಕು, ಅಥವಾ ಬೇಗನೆ ಆಗುವ ಊಟ...",
            cravingPrompt: "ಇಂದು ನೀವು ಯಾವ ರೀತಿಯ ಊಟ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
            swapBtn: "ಹೊಸ ಆಯ್ಕೆ ಪಡೆಯಿರಿ",
            alternativesHeader: "ಇತರ ಲಭ್ಯವಿರುವ ಆಯ್ಕೆಗಳು",
            selectAlt: "ಇದನ್ನು ಆಯ್ಕೆಮಾಡಿ",
            prep: "ಸಿದ್ಧತೆ",
            difficulty: "ಕಷ್ಟದ ಮಟ್ಟ",
            easy: "ಸುಲಭ",
            cost: "ವೆಚ್ಚ",
            mins: "ನಿಮಿಷ",
            cancel: "ರದ್ದುಮಾಡಿ",
            planning: "ಯೋಜನೆ ಮಾಡಲಾಗುತ್ತಿದೆ...",
        },
    }[language];

    // Dynamic Video Search URL bounded to current active dish name
    const handleWatchVideo = () => {
        if (!dishName) return;
        const cleanDish = dishName.replace(/[^\w\s\u0900-\u097F\u0C80-\u0CFF]/gi, " ").trim();
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${cleanDish} recipe`)}`;
        window.open(searchUrl, "_blank", "noopener,noreferrer");
    };

    const handleSelect = async (alt: AlternativeOption) => {
        setLoading(true);
        await onSelectAlternative(alt);
        setLoading(false);
    };

    const handleSwap = async () => {
        setLoading(true);
        await onShowAnotherOption(cravingText);
        setLoading(false);
        setShowCravingInput(false);
        setCravingText("");
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm max-w-xl mx-auto">
            {/* Header Info */}
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-2">
                <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    {labels.selectedBadge}
                </span>
                {mealLabel && targetDate && (
                    <span className="text-slate-500 font-medium">
                        {mealLabel} | {targetDate}
                    </span>
                )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">{dishName}</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{description}</p>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block mb-0.5">{labels.prep}</span>
                    <span className="text-sm font-bold text-slate-900">{prepTimeMinutes} {labels.mins}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block mb-0.5">{labels.difficulty}</span>
                    <span className="text-sm font-bold text-slate-900">{difficulty || labels.easy}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[11px] text-slate-500 font-medium block mb-0.5">{labels.cost}</span>
                    <span className="text-sm font-bold text-slate-900">₹{costInr}</span>
                </div>
            </div>

            {/* Recipe Steps */}
            {recipeSteps.length > 0 && (
                <div className="mb-6 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
                        {labels.recipeHeading}
                    </h3>
                    <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                        {recipeSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                        ))}
                    </ol>
                </div>
            )}

            {/* Video Action Button */}
            <button
                type="button"
                onClick={handleWatchVideo}
                className="w-full mb-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
            >
                <span>▶</span>
                <span>{labels.watchVideo}</span>
            </button>

            {/* Alternative Options */}
            {alternatives.length > 0 && (
                <div className="mb-6 pt-5 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                        {labels.alternativesHeader}
                    </h4>
                    <div className="space-y-2.5">
                        {alternatives.map((alt, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3.5 bg-emerald-50/40 border border-emerald-100/80 rounded-2xl transition hover:bg-emerald-50"
                            >
                                <div className="pr-3">
                                    <p className="text-xs font-bold text-slate-900">{alt.title}</p>
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                        {alt.prepTimeMinutes} {labels.mins} • {alt.description}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleSelect(alt)}
                                    className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-xl hover:bg-emerald-50 transition shadow-xs whitespace-nowrap shrink-0"
                                >
                                    {labels.selectAlt}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Custom Craving / Replace Dish */}
            <div className="pt-2 border-t border-slate-100">
                {!showCravingInput ? (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setShowCravingInput(true)}
                        className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2"
                    >
                        <span>🔄</span>
                        <span>{labels.anotherOption}</span>
                    </button>
                ) : (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700">
                            {labels.cravingPrompt}
                        </label>
                        <input
                            type="text"
                            value={cravingText}
                            onChange={(e) => setCravingText(e.target.value)}
                            placeholder={labels.cravingPlaceholder}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCravingInput(false)}
                                className="w-1/3 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition"
                            >
                                {labels.cancel}
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleSwap}
                                className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                            >
                                {loading ? labels.planning : labels.swapBtn}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}