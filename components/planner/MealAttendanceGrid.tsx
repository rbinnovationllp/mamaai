// components/planner/MealAttendanceGrid.tsx
"use client";

import React, { useState, useEffect } from "react";
import { MemberMealAttendanceStatus, DayAttendancePlan } from "@/lib/shared/contracts";

interface FamilyMemberSummary {
    memberId: string;
    name: string;
    relationship: string;
    age: number;
}

interface Props {
    members: FamilyMemberSummary[];
    savedPattern?: DayAttendancePlan;
    onSubmit: (attendance: DayAttendancePlan) => void;
}

const MEAL_SLOTS: Array<{ id: keyof DayAttendancePlan; label: string; icon: string }> = [
    { id: "breakfast", label: "Breakfast", icon: "🍳" },
    { id: "lunch", label: "Lunch", icon: "🍱" },
    { id: "snacks", label: "High Tea / Snacks", icon: "☕" },
    { id: "dinner", label: "Dinner", icon: "🍲" },
];

export function MealAttendanceGrid({ members, savedPattern, onSubmit }: Props) {
    const getDefaultState = (): DayAttendancePlan => {
        if (savedPattern) return savedPattern;
        const initialSlot: Record<string, MemberMealAttendanceStatus> = {};
        members.forEach((m) => {
            initialSlot[m.memberId] = "home";
        });
        return {
            breakfast: { ...initialSlot },
            lunch: { ...initialSlot },
            snacks: { ...initialSlot },
            dinner: { ...initialSlot },
        };
    };

    const [attendance, setAttendance] = useState<DayAttendancePlan>(getDefaultState());
    const [activeTab, setActiveTab] = useState<keyof DayAttendancePlan>("lunch");

    const setMemberStatus = (slot: keyof DayAttendancePlan, memberId: string, status: MemberMealAttendanceStatus) => {
        setAttendance((prev) => ({
            ...prev,
            [slot]: {
                ...prev[slot],
                [memberId]: status,
            },
        }));
    };

    const setAllForSlot = (slot: keyof DayAttendancePlan, status: MemberMealAttendanceStatus) => {
        const updatedSlot: Record<string, MemberMealAttendanceStatus> = {};
        members.forEach((m) => {
            updatedSlot[m.memberId] = status;
        });
        setAttendance((prev) => ({ ...prev, [slot]: updatedSlot }));
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm max-w-2xl mx-auto">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">Who is eating each meal today?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                    Select who is eating at home, needs a packed tiffin, or is skipping.
                </p>
            </div>

            {/* Slot Selection Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4">
                {MEAL_SLOTS.map((slot) => {
                    const count = Object.values(attendance[slot.id] || {}).filter((s) => s !== "skip").length;
                    return (
                        <button
                            key={slot.id}
                            onClick={() => setActiveTab(slot.id)}
                            className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center ${activeTab === slot.id
                                    ? "bg-white text-emerald-700 shadow-sm font-semibold"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <span className="text-sm">{slot.icon}</span>
                            <span className="text-xs mt-0.5 truncate w-full">{slot.label.split(" ")[0]}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{count}/{members.length}</span>
                        </button>
                    );
                })}
            </div>

            {/* Quick Slot Actions */}
            <div className="flex items-center justify-between gap-2 mb-3 px-1">
                <span className="text-xs font-semibold text-slate-700">
                    {MEAL_SLOTS.find((s) => s.id === activeTab)?.label}
                </span>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => setAllForSlot(activeTab, "home")}
                        className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg"
                    >
                        All at Home
                    </button>
                    <button
                        type="button"
                        onClick={() => setAllForSlot(activeTab, "skip")}
                        className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg"
                    >
                        Skip Meal
                    </button>
                </div>
            </div>

            {/* Member Attendance Rows */}
            <div className="space-y-2 mb-6">
                {members.map((member) => {
                    const currentStatus = attendance[activeTab]?.[member.memberId] || "home";
                    return (
                        <div
                            key={member.memberId}
                            className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl"
                        >
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                                <p className="text-[11px] text-slate-500 capitalize">{member.relationship} • Age {member.age}</p>
                            </div>

                            {/* 3-State Segmented Control */}
                            <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
                                <button
                                    type="button"
                                    onClick={() => setMemberStatus(activeTab, member.memberId, "home")}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${currentStatus === "home"
                                            ? "bg-white text-emerald-800 shadow-sm font-semibold"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Home
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMemberStatus(activeTab, member.memberId, "tiffin")}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${currentStatus === "tiffin"
                                            ? "bg-amber-500 text-white shadow-sm font-semibold"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Tiffin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMemberStatus(activeTab, member.memberId, "skip")}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${currentStatus === "skip"
                                            ? "bg-slate-400 text-white shadow-sm font-semibold"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Submit Button */}
            <button
                type="button"
                onClick={() => onSubmit(attendance)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-md transition text-sm flex items-center justify-center gap-2"
            >
                <span>Generate Plan for Present Members</span>
                <span>→</span>
            </button>
        </div>
    );
}