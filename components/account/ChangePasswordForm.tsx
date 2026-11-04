"use client";

import { FormEvent, useState } from "react";

const PASSWORD_HELP = "Use 12 to 256 characters. Do not reuse your current password.";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (newPassword !== confirmation) { setMessage("New passwords do not match."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword, confirmation }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(payload?.error?.message || "Password change was not completed."); return; }
      setCurrentPassword(""); setNewPassword(""); setConfirmation("");
      setMessage("Password changed. Please sign in again to continue securely.");
      window.setTimeout(() => window.location.assign("/account/access"), 900);
    } catch { setMessage("Unable to change your password. Please try again."); }
    finally { setSubmitting(false); }
  }

  const passwordType = showPasswords ? "text" : "password";
  return <section className="mt-4 rounded border p-4" aria-labelledby="change-password-heading">
    <h2 id="change-password-heading" className="font-bold">Change password</h2>
    <p className="mt-1 text-sm text-slate-600">{PASSWORD_HELP}</p>
    <form className="mt-3 space-y-3" onSubmit={submit}>
      <label className="block text-sm font-medium">Current password<input required autoComplete="current-password" type={passwordType} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded border px-3" /></label>
      <label className="block text-sm font-medium">New password<input required minLength={12} maxLength={256} autoComplete="new-password" type={passwordType} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded border px-3" /></label>
      <label className="block text-sm font-medium">Confirm new password<input required minLength={12} maxLength={256} autoComplete="new-password" type={passwordType} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 min-h-11 w-full rounded border px-3" /></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} /> Show passwords</label>
      {message ? <p role="status" className="text-sm text-slate-700">{message}</p> : null}
      <button type="submit" disabled={submitting} className="min-h-11 rounded bg-emerald-800 px-4 font-bold text-white disabled:opacity-50">{submitting ? "Changing password…" : "Change password"}</button>
    </form>
  </section>;
}
