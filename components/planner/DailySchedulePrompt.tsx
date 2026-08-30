// components/planner/DailySchedulePrompt.tsx
"use client";

import React, { useState, useEffect } from "react";
import { resolveNextMealSlot, NextMealSlotResult } from "@/lib/planner/time-engine";
import { MealSlot, MealTimingPattern } from "@/lib/shared/contracts";

interface Member {
    memberId: string;
    name: string;
}

interface Props {
    savedTimings?: MealTimingPattern;
    familyMembers: Member[];
    onGeneratePlan: (payload: {
        mealSlot: MealSlot;
        timing: string;
        attendance: Array<{ memberId: string; status: "home" | "tiffin" | "eating_out" | "fasting" }>;
        isException: boolean;
    }) => void;
}

export function DailySchedulePrompt({ savedTimings, familyMembers, onGeneratePlan }: Props) {
    const [nextSlot, setNextSlot] = useState<{ slot: MealSlot; scheduledTime: string; isTomorrow: boolean }>({
        slot: "lunch",
        scheduledTime: "13:30",
        isTomorrow: false,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [activeTiming, setActiveTiming] = useState(nextSlot.scheduledTime);
    const [attendance, setAttendance] = useState<Record<string, "home" | "tiffin" | "eating_out" | "fasting">>({});

    useEffect(() => {
        // Resolve using browser local clock
        const resolved = resolveNextMealSlot(savedTimings, new Date());
        setNextSlot(resolved);
        setActiveTiming(resolved.scheduledTime);

        // Default: all members eating at home
        const initialAttendance: Record<string, "home" | "tiffin" | "eating_out" | "fasting"> = {};
        familyMembers.forEach((m) => {
            initialAttendance[m.memberId] = "home";
        });
        setAttendance(initialAttendance);
    }, [savedTimings, familyMembers]);

    const handleQuickPlan = () => {
        onGeneratePlan({
            mealSlot: nextSlot.slot,
            timing: activeTiming,
            attendance: Object.entries(attendance).map(([memberId, status]) => ({ memberId, status })),
            isException: false,
        });
    };

    const handleCustomPlan = () => {
        onGeneratePlan({
            mealSlot: nextSlot.slot,
            timing: activeTiming,
            attendance: Object.entries(attendance).map(([memberId, status]) => ({ memberId, status })),
            isException: true,
        });
    };

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        Upcoming Meal: {nextSlot.slot.toUpperCase()} ({activeTiming})
                    </span>
                    <h2 className="text-lg font-bold text-slate-800 mt-2">
                        Is today&apos;s meal schedule following your usual family routine?
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                        Detected from your local device time ({new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(new Date())}).
                    </p>
                </div>

                {!isEditing && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleQuickPlan}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
                        >
                            Yes, Plan My Day
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
                        >
                            No, Change Today
                        </button>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="mt-6 pt-6 border-t border-emerald-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Today&apos;s Adjusted Meal Time</label>
                            <input
                                type="time"
                                value={activeTiming}
                                onChange={(e) => setActiveTiming(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <label className="block text-xs font-semibold text-slate-700 mb-2">Member Availability & Tiffin</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {familyMembers.map((member) => (
                            <div key={member.memberId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                <span className="text-sm font-medium text-slate-800">{member.name}</span>
                                <select
                                    value={attendance[member.memberId] || "home"}
                                    onChange={(e) => setAttendance({ ...attendance, [member.memberId]: e.target.value as any })}
                                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                                >
                                    <option value="home">Home Dining</option>
                                    <option value="tiffin">Pack Tiffin / Dabba</option>
                                    <option value="eating_out">Eating Out / Skip</option>
                                    <option value="fasting">Fasting / Vrat</option>
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCustomPlan}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                            Generate Adjusted Plan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}