"use client";

import React, { useState } from "react";
import { MemberMealAttendanceStatus, DayAttendancePlan, MealSlot } from "@/lib/shared/contracts";

interface FamilyMemberSummary {
    memberId: string;
    name: string;
    relationship: string;
    age: number;
}

interface Props {
    members: FamilyMemberSummary[];
    savedPattern?: DayAttendancePlan;
    language?: "en" | "hi" | "kn";
    onSubmit: (attendance: DayAttendancePlan) => void;
}

const MEAL_SLOTS: Array<{ id: keyof DayAttendancePlan; slotKey: MealSlot; label: string; icon: string }> = [
    { id: "breakfast", slotKey: "breakfast", label: "Breakfast", icon: "🍳" },
    { id: "lunch", slotKey: "lunch", label: "Lunch", icon: "🍱" },
    { id: "snacks", slotKey: "snacks", label: "High Tea / Snacks", icon: "☕" },
    { id: "dinner", slotKey: "dinner", label: "Dinner", icon: "🍲" },
];

export function MealAttendanceGrid({ members, savedPattern, language = "hi", onSubmit }: Props) {
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
            guestCountBySlot: {
                breakfast: 0,
                lunch: 0,
                snacks: 0,
                dinner: 0,
            },
        };
    };

    const [attendance, setAttendance] = useState<DayAttendancePlan>(getDefaultState());
    const [activeTab, setActiveTab] = useState<keyof DayAttendancePlan>("lunch");

    const currentSlotKey = MEAL_SLOTS.find((s) => s.id === activeTab)?.slotKey || "lunch";
    const activeGuestCount = attendance.guestCountBySlot?.[currentSlotKey] || 0;

    const setGuestCount = (count: number) => {
        const nextCount = Math.max(0, count);
        setAttendance((prev) => ({
            ...prev,
            guestCountBySlot: {
                ...prev.guestCountBySlot,
                [currentSlotKey]: nextCount,
            },
        }));
    };

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

    const labels = {
        en: {
            heading: "Who will be eating each meal today?",
            subheading: "Select who is eating at home, packing tiffin, or add additional visiting guests.",
            allHome: "All at Home",
            allSkip: "Skip Meal",
            home: "Home",
            tiffin: "Tiffin",
            skip: "Skip",
            guests: "Visiting Guests",
            guestHelp: "Extra adult portions added to recipe & grocery",
            submit: "Generate Plan for Present Members & Guests",
        },
        hi: {
            heading: "आज हर भोजन कौन खाएगा?",
            subheading: "घर पर खाने वाले, टिफिन ले जाने वाले सदस्य और अतिरिक्त मेहमान चुनें।",
            allHome: "सभी घर पर",
            allSkip: "यह भोजन छोड़ें",
            home: "घर पर",
            tiffin: "टिफिन",
            skip: "नहीं खाएंगे",
            guests: "अतिरिक्त मेहमान (Guests)",
            guestHelp: "मेहमानों के अनुसार रेसिपी और किराने की मात्रा बढ़ेगी",
            submit: "सदस्यों और मेहमानों के लिए भोजन प्लान करें",
        },
        kn: {
            heading: "ಇಂದು ಪ್ರತಿ ಊಟವನ್ನು ಯಾರು ತಿನ್ನುತ್ತಾರೆ?",
            subheading: "ಮನೆಯಲ್ಲಿ ತಿನ್ನುವವರು, ಟಿಫಿನ್ ಮತ್ತು ಹೆಚ್ಚುವರಿ ಅತಿಥಿಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            allHome: "ಎಲ್ಲರೂ ಮನೆಯಲ್ಲಿ",
            allSkip: "ಊಟ ಬಿಡಿ",
            home: "ಮನೆಯಲ್ಲಿ",
            tiffin: "ಟಿಫಿನ್",
            skip: "ತಿನ್ನುವುದಿಲ್ಲ",
            guests: "ಹೆಚ್ಚುವರಿ ಅತಿಥಿಗಳು (Guests)",
            guestHelp: "ಅತಿಥಿಗಳ ಸಂಖ್ಯೆಗೆ ತಕ್ಕಂತೆ ಅಡುಗೆ ಪ್ರಮಾಣ ಹೆಚ್ಚಾಗುತ್ತದೆ",
            submit: "ಯೋಜನೆ ರಚಿಸಿ",
        },
    }[language];

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm max-w-2xl mx-auto">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">{labels.heading}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{labels.subheading}</p>
            </div>

            {/* Slot Selection Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4">
                {MEAL_SLOTS.map((slot) => {
                    const count = Object.values(attendance[slot.id] || {}).filter((s) => s !== "skip").length;
                    const guests = attendance.guestCountBySlot?.[slot.slotKey] || 0;
                    return (
                        <button
                            key={slot.id}
                            type="button"
                            onClick={() => setActiveTab(slot.id)}
                            className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center justify-center ${activeTab === slot.id
                                    ? "bg-white text-emerald-700 shadow-sm font-semibold"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <span className="text-sm">{slot.icon}</span>
                            <span className="text-xs mt-0.5 truncate w-full">{slot.label.split(" ")[0]}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                                {count}/{members.length} {guests > 0 ? `+${guests}G` : ""}
                            </span>
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
                        className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-100 transition"
                    >
                        {labels.allHome}
                    </button>
                    <button
                        type="button"
                        onClick={() => setAllForSlot(activeTab, "skip")}
                        className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
                    >
                        {labels.allSkip}
                    </button>
                </div>
            </div>

            {/* Guest Count Stepper */}
            <div className="mb-4 flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <div>
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <span>👥</span>
                        <span>{labels.guests}</span>
                    </p>
                    <p className="text-[10px] text-amber-800 mt-0.5">{labels.guestHelp}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setGuestCount(activeGuestCount - 1)}
                        disabled={activeGuestCount === 0}
                        className="w-8 h-8 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-sm flex items-center justify-center disabled:opacity-40 hover:bg-amber-100 transition"
                    >
                        -
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-amber-950">
                        {activeGuestCount}
                    </span>
                    <button
                        type="button"
                        onClick={() => setGuestCount(activeGuestCount + 1)}
                        className="w-8 h-8 rounded-xl bg-amber-600 text-white font-bold text-sm flex items-center justify-center hover:bg-amber-700 transition shadow-sm"
                    >
                        +
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
                                    {labels.home}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMemberStatus(activeTab, member.memberId, "tiffin")}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${currentStatus === "tiffin"
                                            ? "bg-amber-500 text-white shadow-sm font-semibold"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    {labels.tiffin}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMemberStatus(activeTab, member.memberId, "skip")}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${currentStatus === "skip"
                                            ? "bg-slate-400 text-white shadow-sm font-semibold"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    {labels.skip}
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
                <span>{labels.submit}</span>
                <span>→</span>
            </button>
        </div>
    );
}