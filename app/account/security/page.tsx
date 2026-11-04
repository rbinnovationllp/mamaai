"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { RecoveryCodeRegeneration } from "@/components/account/RecoveryCodeRegeneration";
import { DeviceTransferManagement } from "@/components/account/DeviceTransferManagement";

type Device = { deviceId: string; label: string; confirmationDueAt?: string; confirmedAt?: string; revokedAt?: string };
type Status = { activeDeviceId: string; mobileVerificationStatus: string; devices: Device[]; transfers: { transferId: string; status: string; createdAt: string }[]; freeTransfersRemaining: number };

export default function AccountSecurityPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/customer/devices");
      if (!response.ok) throw new Error("Device status request failed");
      setStatus(await response.json());
    } catch { setMessage("Unable to load account security. Sign in again if your session expired."); }
  }, []);
  useEffect(() => {
    let active = true;
    void fetch("/api/customer/devices")
      .then(async (response) => {
        if (!response.ok) throw new Error("Device status request failed");
        return response.json() as Promise<Status>;
      })
      .then((nextStatus) => { if (active) setStatus(nextStatus); })
      .catch(() => { if (active) setMessage("Unable to load account security. Sign in again if your session expired."); });
    return () => { active = false; };
  }, []);

  async function logout() {
    const response = await fetch("/api/customer/logout", { method: "POST" });
    if (response.ok) window.location.assign("/");
    else setMessage("Unable to sign out. Please try again.");
  }
  async function confirmDevice() {
    setConfirming(true); setMessage("");
    try {
      const response = await fetch("/api/customer/devices/confirm", { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      setMessage(response.ok ? "This device is confirmed." : payload?.error?.message || "Confirmation was rejected. Sign in again if your session expired.");
      if (response.ok) await load();
    } finally { setConfirming(false); }
  }

  const active = status?.devices.find((device) => device.deviceId === status.activeDeviceId);
  const confirmationPending = Boolean(active?.confirmationDueAt && !active.confirmedAt && !active.revokedAt);
  return <main className="min-h-screen bg-[#f8faf9] px-4 py-8 text-slate-900">
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">
      <Link href="/more" className="text-sm font-bold text-emerald-800">← More</Link>
      <h1 className="mt-4 text-2xl font-black">Account Security</h1>
      <p className="mt-2 text-sm text-slate-600">{status?.mobileVerificationStatus === "verified" ? "Mobile verified" : "Mobile number not verified"}</p>
      {status ? <>
        <section className="mt-5 rounded border p-4" aria-labelledby="current-device-heading">
          <h2 id="current-device-heading" className="font-bold">Current device</h2>
          {status.devices.map((device) => <p key={device.deviceId} className="mt-2 text-sm">{device.label}{device.deviceId === status.activeDeviceId ? " — Active" : ""}{device.revokedAt ? " — Revoked" : ""}{device.confirmationDueAt && !device.confirmedAt ? ` — Confirm by ${new Date(device.confirmationDueAt).toLocaleDateString()}` : ""}</p>)}
          {confirmationPending ? <button type="button" disabled={confirming} onClick={confirmDevice} className="mt-3 min-h-11 rounded bg-emerald-800 px-4 font-bold text-white disabled:opacity-50">{confirming ? "Confirming…" : "Confirm This Device"}</button> : null}
        </section>
        <ChangePasswordForm />
        <RecoveryCodeRegeneration />
        <p className="mt-4 text-sm">Free transfers remaining this year: {status.freeTransfersRemaining}.</p>
        <DeviceTransferManagement transfers={status.transfers} />
        <Link href="/account/access" className="mt-3 inline-flex min-h-11 items-center rounded bg-emerald-800 px-4 font-bold text-white">Sign in or recover on another device</Link>
        <section className="mt-4 rounded border p-4"><h2 className="font-bold">Lost device</h2><p className="mt-1 text-sm">Use a saved recovery code. If none is available, contact RBIL support for an ownership review; household details alone are not accepted as proof.</p></section>
        <button type="button" onClick={logout} className="mt-4 min-h-11 rounded border border-rose-300 px-4 font-bold text-rose-700">Log out</button>
      </> : <p role="status" className="mt-5">{message || "Loading…"}</p>}
      {status && message ? <p role="status" className="mt-4 text-sm text-slate-700">{message}</p> : null}
    </div>
  </main>;
}
