"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { PasswordRecoveryForm, recoveryCopy } from "@/components/account/PasswordRecoveryForm";

const formCopy = {
  "en": {
    "intro": "Use either a registered email or mobile number. Passwords are never stored in browser storage.",
    "name": "Full name",
    "password": "Password",
    "confirm": "Confirm password",
    "stay": "Stay signed in on this device",
    "continue": "Continue",
    "signed": "You are signed in on this device.",
    "error": "We could not complete that request. Check your details and try again."
  },
  "hi": {
    "intro": "अपना पंजीकृत ईमेल या मोबाइल नंबर इस्तेमाल करें। पासवर्ड ब्राउज़र में सेव नहीं होते।",
    "name": "पूरा नाम",
    "password": "पासवर्ड",
    "confirm": "पासवर्ड की पुष्टि करें",
    "stay": "इस डिवाइस पर साइन इन रहें",
    "continue": "जारी रखें",
    "signed": "आप इस डिवाइस पर साइन इन हैं।",
    "error": "अनुरोध पूरा नहीं हो सका। अपना विवरण जाँचें और फिर कोशिश करें।"
  },
  "kn": {
    "intro": "ನೋಂದಾಯಿಸಿದ ಇಮೇಲ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿ. ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸುವುದಿಲ್ಲ.",
    "name": "ಪೂರ್ಣ ಹೆಸರು",
    "password": "ಪಾಸ್‌ವರ್ಡ್",
    "confirm": "ಪಾಸ್‌ವರ್ಡ್ ದೃಢಪಡಿಸಿ",
    "stay": "ಈ ಸಾಧನದಲ್ಲಿ ಸೈನ್ ಇನ್ ಆಗಿಯೇ ಇರಿ",
    "continue": "ಮುಂದುವರಿಸಿ",
    "signed": "ಈ ಸಾಧನದಲ್ಲಿ ನೀವು ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ.",
    "error": "ವಿನಂತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲಾಗಲಿಲ್ಲ. ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
  }
};

export default function AccessPage() {
  const { language } = useLanguage();
  const form = formCopy[language];
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  async function resumeAccount() {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try { response = await fetch("/api/customer/session", { cache: "no-store", signal: controller.signal }); } finally { window.clearTimeout(timer); }
    if (response.status >= 500) throw new Error("SESSION_UNAVAILABLE");
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.authenticated) { const next = typeof data.nextRoute === "string" && data.nextRoute.startsWith("/") && !data.nextRoute.startsWith("//") ? data.nextRoute : "/planner"; router.replace(next); return true; }
    return false;
  }
  useEffect(() => { let active = true; void resumeAccount().catch(() => { if (active) setSessionUnavailable(true); return false; }).finally(() => { if (active) setCheckingSession(false); }); return () => { active = false; }; }, []);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [identifier, setIdentifier] = useState(""), [name, setName] = useState(""), [email, setEmail] = useState(""), [mobile, setMobile] = useState("");
  const [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [stay, setStay] = useState(true), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const text = language === "hi" ? { sign: "साइन इन", create: "अकाउंट बनाएं", identifier: "ईमेल या मोबाइल नंबर", email: "ईमेल (वैकल्पिक)", mobile: "मोबाइल नंबर (वैकल्पिक)", save: "ये रिकवरी कोड सुरक्षित रखें। ये केवल एक बार दिखेंगे।" } : language === "kn" ? { sign: "ಸೈನ್ ಇನ್", create: "ಖಾತೆ ರಚಿಸಿ", identifier: "ಇಮೇಲ್ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ", email: "ಇಮೇಲ್ (ಐಚ್ಛಿಕ)", mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ)", save: "ಈ ರಿಕವರಿ ಕೋಡ್‌ಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಉಳಿಸಿ. ಇವು ಒಮ್ಮೆ ಮಾತ್ರ ಕಾಣಿಸುತ್ತವೆ." } : { sign: "Sign in", create: "Create account", identifier: "Email address or mobile number", email: "Email address (optional)", mobile: "Mobile number (optional)", save: "Save these recovery codes securely. They are shown only once." };
  const input = "mt-1 min-h-12 w-full rounded-xl border border-slate-300 p-3";
  function switchMode(next: typeof mode) { setMode(next); setMessage(""); setCodes([]); setPassword(""); setConfirm(""); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    if (mode === "register" && password !== confirm) { setMessage(recoveryCopy[language].mismatch); return; }
    setBusy(true);
    try {
      const response = await fetch(mode === "login" ? "/api/customer/auth/login" : "/api/customer/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "login" ? { identifier, password, staySignedIn: stay } : { fullName: name, email, mobile, password, confirmPassword: confirm, staySignedIn: stay }) });
      const data = await response.json().catch(() => ({}));
      setMessage(response.ok ? (data.warning || form.signed) : (language === "en" ? data.error?.message || form.error : form.error));
      if (response.ok) { setPassword(""); setConfirm(""); if (Array.isArray(data.recoveryCodes)) setCodes(data.recoveryCodes.filter((v: unknown) => typeof v === "string")); else if (mode === "login") await resumeAccount().catch(() => false); }
    } catch { setMessage(recoveryCopy[language].invalid); } finally { setBusy(false); }
  }
  if (sessionUnavailable) return <main className="px-4 py-8"><p role="status">{language === "hi" ? "Saved sign-in की जांच अभी नहीं हो सकी। कृपया फिर कोशिश करें।" : language === "kn" ? "ಉಳಿಸಿದ sign-in ಪರಿಶೀಲಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ." : "Your saved sign-in could not be checked right now. Please retry."}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-12 rounded-xl bg-emerald-800 px-5 text-white">{language === "hi" ? "फिर कोशिश करें" : language === "kn" ? "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ" : "Retry"}</button></main>;
  if (checkingSession) return <main className="px-4 py-8"><p role="status">{language === "hi" ? "आपका खाता जांच रहे हैं…" : language === "kn" ? "ನಿಮ್ಮ ಖಾತೆ ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…" : "Checking your saved sign-in…"}</p></main>;
  return <main className="min-h-screen bg-[#f8faf9] px-4 py-8"><section className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm"><Link href="/" className="font-bold text-emerald-800">← MAMAAI</Link>
    <div className="mt-5 flex gap-2"><button disabled={busy} type="button" onClick={() => switchMode("login")} className="min-h-11 flex-1 rounded-xl bg-emerald-800 text-sm font-bold text-white">{text.sign}</button><button disabled={busy} type="button" onClick={() => switchMode("register")} className="min-h-11 flex-1 rounded-xl border text-sm font-bold">{text.create}</button></div>
    {mode === "forgot" ? <PasswordRecoveryForm onBack={() => switchMode("login")} /> : <>
      <h1 className="mt-6 text-2xl font-black">{mode === "register" ? text.create : text.sign}</h1><p className="mt-2 text-sm text-slate-600">{form.intro}</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === "login" ? <label className="block text-sm font-bold">{text.identifier}<input autoComplete="username" required value={identifier} onChange={e => setIdentifier(e.target.value)} className={input} /></label> : <>
          <label className="block text-sm font-bold">{form.name}<input autoComplete="name" required value={name} onChange={e => setName(e.target.value)} className={input} /></label>
          <label className="block text-sm font-bold">{text.email}<input autoComplete="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={input} /></label>
          <label className="block text-sm font-bold">{text.mobile}<input autoComplete="tel" value={mobile} onChange={e => setMobile(e.target.value)} className={input} /></label>
        </>}
        <label className="block text-sm font-bold">{form.password}<input autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={12} maxLength={256} required type="password" value={password} onChange={e => setPassword(e.target.value)} className={input} /></label>
        {mode === "register" && <label className="block text-sm font-bold">{form.confirm}<input autoComplete="new-password" minLength={12} maxLength={256} required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={input} /></label>}
        <label className="flex items-center gap-2 text-sm"><input checked={stay} onChange={e => setStay(e.target.checked)} type="checkbox" />{form.stay}</label><button disabled={busy} className="min-h-12 w-full rounded-xl bg-emerald-800 font-bold text-white">{busy ? "…" : form.continue}</button>
      </form>
      <button type="button" disabled={busy} onClick={() => switchMode("forgot")} className="mt-5 min-h-11 text-sm font-bold text-emerald-800 underline">{recoveryCopy[language].title}</button>
      {message && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">{message}</p>}
      {codes.length > 0 && <section className="mt-4 rounded-xl border border-amber-300 p-4"><h2 className="font-bold">{text.save}</h2><ul className="mt-3 grid grid-cols-2 gap-2 font-mono">{codes.map(code => <li key={code}>{code}</li>)}</ul></section>}
    </>}
  </section></main>;
}
