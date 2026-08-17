"use client";

import { useState } from "react";

type Customer = {
  userId: string;
  plan?: string;
  status?: string;
  paymentStatus?: string;
  paymentChannel?: string;
  razorpaySubscriptionId?: string;
  renewsAt?: string;
  checkedAt?: string;
};

const statuses = ["active", "trialing", "past_due", "cancelled", "expired"];

export function AdminCrmPanel() {
  const [status, setStatus] = useState("active");
  const [adminSecret, setAdminSecret] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [note, setNote] = useState("");

  const headers = adminSecret ? { Authorization: `Bearer ${adminSecret}` } : undefined;

  async function loadCustomers() {
    setMessage("Loading customers...");
    const response = await fetch(`/api/admin/customers?status=${status}&limit=25`, { headers });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error?.message ?? "Unable to load customers.");
      return;
    }
    setCustomers(data.customers ?? []);
    setMessage(`${data.customers?.length ?? 0} ${status} customer records loaded.`);
  }

  async function saveNote() {
    if (!selectedUserId || !note.trim()) {
      setMessage("Select a user and enter a note first.");
      return;
    }
    const response = await fetch(`/api/admin/customers/${encodeURIComponent(selectedUserId)}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify({ note }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error?.message ?? "Unable to save note.");
      return;
    }
    setNote("");
    setMessage("Support note saved and audit logged.");
  }

  async function exportCustomers() {
    setMessage("Preparing export...");
    const response = await fetch(`/api/admin/exports/customers?status=${status}`, { headers });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error?.message ?? "Unable to export customers.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mamaai-customers-${status}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Minimized customer export downloaded and audit logged.");
  }

  return (
    <section className="panel wide-panel">
      <h2>Customer CRM</h2>
      <p className="muted">
        DynamoDB-backed paid customer lookup, support notes and minimized export. Use your admin bearer secret if your
        browser does not already have an admin session cookie.
      </p>
      <div className="crm-controls">
        <label>
          Admin bearer secret
          <input value={adminSecret} onChange={(event) => setAdminSecret(event.target.value)} type="password" />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button className="button" type="button" onClick={loadCustomers}>
          Load Customers
        </button>
        <button className="button secondary" type="button" onClick={exportCustomers}>
          Export JSON
        </button>
      </div>
      {message && <p className="status">{message}</p>}
      <div className="crm-table">
        <div className="crm-row crm-head">
          <span>User</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Payment</span>
          <span>Renews</span>
        </div>
        {customers.map((customer) => (
          <button
            className="crm-row"
            type="button"
            key={customer.userId}
            onClick={() => setSelectedUserId(customer.userId)}
          >
            <span>{customer.userId}</span>
            <span>{customer.plan ?? "-"}</span>
            <span>{customer.status ?? "-"}</span>
            <span>{customer.paymentStatus ?? customer.paymentChannel ?? "-"}</span>
            <span>{customer.renewsAt ?? customer.checkedAt ?? "-"}</span>
          </button>
        ))}
      </div>
      <div className="crm-note-box">
        <label>
          Support note for {selectedUserId || "selected user"}
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </label>
        <button className="button" type="button" onClick={saveNote}>
          Save Note
        </button>
      </div>
    </section>
  );
}
