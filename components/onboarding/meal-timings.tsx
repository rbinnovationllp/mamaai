// components/profile/MealTimingsForm.tsx
"use client";

import React from "react";
import { MealTimingPattern } from "@/lib/shared/contracts";

interface Props {
    timings: MealTimingPattern;
    onChange: (updated: MealTimingPattern) => void;
}

export function MealTimingsForm({ timings, onChange }: Props) {
    const handleChange = (slot: keyof MealTimingPattern, val: string) => {
        onChange({
            ...timings,
            [slot]: val || undefined,
        });
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-slate-800">
                    Daily Family Meal Timings <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Optional</span>
                </h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">
                This is optional. Providing your family&apos;s usual meal timings helps MAMAAI suggest the right meal at the right time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Breakfast (e.g. 08:00 AM)</label>
                    <input
                        type="time"
                        value={timings?.breakfast || ""}
                        onChange={(e) => handleChange("breakfast", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Lunch (e.g. 01:30 PM)</label>
                    <input
                        type="time"
                        value={timings?.lunch || ""}
                        onChange={(e) => handleChange("lunch", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">High Tea / Snacks (e.g. 05:00 PM)</label>
                    <input
                        type="time"
                        value={timings?.snacks || ""}
                        onChange={(e) => handleChange("snacks", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dinner (e.g. 08:30 PM)</label>
                    <input
                        type="time"
                        value={timings?.dinner || ""}
                        onChange={(e) => handleChange("dinner", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
                    />
                </div>
            </div>
        </div>
    );
}