"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = { id: string; name: string; scheduleRole?: "school_going" | "working" | "other" };
type Suggestion = { id: string; name: string; availableIngredients: string[]; missingIngredients: string[]; totalMinutes: number; requiresPreprepared: string[]; instructions: string[]; packingAdvice: string; safetyNote?: string; suitability: string; quantitySpecification: { status: "VERIFIED" | "DRAFT" | "INCOMPLETE"; note: string } };

export default function SmartTiffinPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [type, setType] = useState<"school_tiffin" | "office_tiffin" | "general">("general");
  const [memberId, setMemberId] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [minutes, setMinutes] = useState<5 | 10 | 15>(10);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/customer/family-profile").then((r) => r.ok ? r.json() : null).then((data) => setMembers(data?.familyProfile?.members ?? [])).catch(() => setMembers([])); }, []);
  const eligible = members.filter((member) => type === "general" || !member.scheduleRole || member.scheduleRole === (type === "school_tiffin" ? "school_going" : "working"));

  async function generate() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/tiffin-suggestions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, memberId: memberId || undefined, manualIngredients: ingredients.split(",").map((value) => value.trim()).filter(Boolean), maxMinutes: minutes, onlyAvailable }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message || "Unable to prepare suggestions.");
      setSuggestions(body.suggestions); setMessage(body.suggestions.length ? "Curated suggestions use your usable pantry items without changing inventory." : "No matching option was found. Try more time or add ingredients.");
    } catch (error) { setSuggestions([]); setMessage(error instanceof Error ? error.message : "Unable to prepare suggestions."); }
    finally { setLoading(false); }
  }
  async function saveFavourite(item: Suggestion) {
    const response = await fetch("/api/tiffin-favourites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipeId: item.id, recipeName: item.name, tiffinType: type }) });
    setMessage(response.ok ? "Saved to your tiffin favourites." : "Unable to save favourite.");
  }

  return <main className="min-h-screen bg-amber-50 px-4 py-7 text-slate-900 sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/planner" className="text-sm font-bold text-emerald-800">← Meal planner</Link>
    <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-amber-100 sm:p-7"><p className="text-sm font-bold text-amber-700">झटपट टिफिन सुझाव</p><h1 className="mt-1 text-3xl font-black">What Can I Pack Today?</h1><p className="mt-2 text-sm leading-6 text-slate-600">Choose a tiffin and MAMAAI will prioritize usable household pantry items. Suggestions do not deduct stock or promise storage safety.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-1 font-bold">Tiffin type<select value={type} onChange={(e) => { setType(e.target.value as typeof type); setMemberId(""); }} className="rounded-xl border p-3"><option value="general">General quick tiffin</option><option value="school_tiffin">School tiffin</option><option value="office_tiffin">Office tiffin</option></select></label>
      <label className="grid gap-1 font-bold">Family member (optional)<select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="rounded-xl border p-3"><option value="">General suggestion</option>{eligible.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      <label className="grid gap-1 font-bold">Cooking time<select value={minutes} onChange={(e) => setMinutes(Number(e.target.value) as 5 | 10 | 15)} className="rounded-xl border p-3"><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option></select></label>
      <label className="grid gap-1 font-bold sm:col-span-2">Add ingredients you have (comma separated)<input value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="e.g. paneer, bread, tomato" className="rounded-xl border p-3" /></label></div>
      <label className="mt-4 flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> Only ingredients available at home</label>
      <button type="button" onClick={generate} disabled={loading} className="mt-5 min-h-12 w-full rounded-2xl bg-emerald-700 px-5 font-bold text-white disabled:opacity-60">{loading ? "Finding options…" : "Generate suggestions"}</button>{message && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-slate-700">{message}</p>}
    </section>
    <div className="mt-5 grid gap-4">{suggestions.map((item) => <article key={item.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-black">{item.name}</h2><span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">{item.totalMinutes} min</span></div><p className="mt-3 text-sm">Available: {item.availableIngredients.join(", ") || "None confirmed"}</p>{item.missingIngredients.length > 0 && <p className="mt-1 text-sm font-semibold text-amber-800">Missing: {item.missingIngredients.join(", ")}</p>}{item.requiresPreprepared.length > 0 && <p className="mt-1 text-sm font-semibold text-amber-800">Must already be prepared: {item.requiresPreprepared.join(", ")}</p>}<ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">{item.instructions.map((step) => <li key={step}>{step}</li>)}</ol><p className="mt-3 text-sm text-slate-600">Packing: {item.packingAdvice}</p><p className="mt-1 text-sm text-slate-600">{item.suitability}</p>{item.safetyNote && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">{item.safetyNote}</p>}<p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-950">Recipe quantity status: {item.quantitySpecification.status}. {item.quantitySpecification.note}</p><button type="button" disabled title="Selection is available only for recipes with reviewed quantities." className="mt-4 min-h-10 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-500">Choose This Tiffin — quantity review required</button><button type="button" onClick={() => saveFavourite(item)} className="mt-3 min-h-10 rounded-xl border border-emerald-200 px-4 text-sm font-bold text-emerald-900">Save favourite</button></article>)}</div>
  </div></main>;
}
