"use client";
import React, { useState } from "react";
import { FAMILY_PROFILE_DOCUMENT_ACCEPT, FAMILY_PROFILE_DOCUMENT_EXAMPLE, FAMILY_PROFILE_DOCUMENT_TEMPLATE, type FamilyDocumentImport } from "@/lib/shared/family-profile-document";

export type ImportedProfileReview = FamilyDocumentImport;
export function FamilyProfileDocumentImport({ onApply }: { onApply: (draft: ImportedProfileReview) => void }) {
  const [text, setText] = useState(""); const [files, setFiles] = useState<File[]>([]); const [draft, setDraft] = useState<ImportedProfileReview | null>(null); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setNotice("");
    try {
      const encoded = await Promise.all(files.map((file) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); })));
      const response = await fetch("/api/family-profile/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, files: encoded }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message || "Unable to read this document.");
      setDraft(data.draft); setNotice("Review every field below. Nothing has been saved yet.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to read this document."); } finally { setBusy(false); }
  };
  return <section className="mb-8 rounded-3xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-200 sm:p-6">
    <h2 className="text-2xl font-bold text-amber-950">Fill your family profile from a document</h2>
    <p className="mt-2 text-sm leading-6 text-amber-900">Paste notes or upload up to five clear photo/scan/PDF pages. MAMAAI prepares an editable draft only; it never saves the original document.</p>
    <details className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700"><summary className="cursor-pointer font-bold">Printable / copyable blank form and filled example</summary><p className="mt-2 font-semibold">Required: household people and meals; each person’s name. Everything else is optional.</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">{FAMILY_PROFILE_DOCUMENT_TEMPLATE}</pre><p className="mt-3 font-semibold">Filled example</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs">{FAMILY_PROFILE_DOCUMENT_EXAMPLE}</pre></details>
    <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">Paste typed notes<textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className="rounded-xl border border-amber-200 bg-white p-3 font-normal" placeholder="Paste the copyable form or notes here." /></label>
    <label className="mt-3 grid gap-2 text-sm font-semibold text-slate-700">Or add photo / scan / PDF pages<input type="file" multiple accept={FAMILY_PROFILE_DOCUMENT_ACCEPT} onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))} className="rounded-xl border border-amber-200 bg-white p-3 text-sm font-normal" />{files.length ? <span className="text-xs font-normal">{files.map((f) => f.name).join(", ")}</span> : null}</label>
    <button type="button" onClick={submit} disabled={busy || (!text.trim() && !files.length)} className="mt-4 min-h-11 rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Reading for review…" : "Read and prepare review"}</button>
    {notice ? <p className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-amber-900">{notice}</p> : null}
    {draft ? <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-amber-200"><h3 className="font-bold text-slate-950">Review draft — nothing saved</h3><p className="text-sm">Household: {draft.household.people ?? "not supplied"} people · cuisines: {draft.household.cuisines.join(", ") || "not supplied"}</p>{draft.members.map((member, index) => <article key={`${member.name}-${index}`} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{member.name}</strong> — {member.relation}; allergies: {member.allergyStatus === "no_known" ? "no known allergies" : member.allergyStatus === "unanswered" ? "unanswered" : member.allergies.join(", ")}; clinician advice: {member.doctorAdvice.join(", ") || "unanswered"}{member.uncertain.length ? <p className="mt-1 font-semibold text-red-700">Resolve: {member.uncertain.join(", ")}</p> : null}</article>)}{draft.uncertainties.map((item) => <p key={item} className="font-semibold text-red-700">Resolve: {item}</p>)}<button type="button" onClick={() => onApply(draft)} disabled={draft.uncertainties.length > 0 || draft.members.some((m) => m.allergyStatus === "unanswered" || m.uncertain.some((f) => /allerg|doctor|clinician/i.test(f)))} className="min-h-11 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Apply reviewed draft to this form</button><p className="text-xs text-slate-600">You can still edit all profile and meal-history fields below, then use the normal Save Family button to confirm.</p></div> : null}
  </section>;
}
