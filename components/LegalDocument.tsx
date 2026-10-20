import Link from "next/link";

export function LegalDocument({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl px-5 py-12 text-slate-800"><Link href="/" className="text-sm font-semibold text-emerald-800 underline">Back to MAMAAI</Link><h1 className="mt-6 text-3xl font-black text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p><article className="mt-8 space-y-6 leading-7">{children}</article></main>;
}
