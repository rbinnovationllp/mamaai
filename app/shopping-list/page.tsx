"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type Item = {
  itemId: string;
  name: string;
  quantityToPurchase: string;
  purchased: boolean;
  note?: string;
  quantityNeedsConfirmation?: boolean;
};
type List = { weekStartDate: string; stale: boolean; items: Item[] };
type SaveBody = {
  action: "refresh" | "update_item";
  itemId?: string;
  purchased?: boolean;
  note?: string;
};
const monday = () => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
export default function ShoppingListPage() {
  const [week, setWeek] = useState(monday);
  const [list, setList] = useState<List | null>(null);
  const [message, setMessage] = useState("");
  const requestVersion = useRef(0);
  const load = useCallback(async (weekStartDate: string) => {
    const version = ++requestVersion.current;
    try {
      const r = await fetch(`/api/weekly-shopping-list?weekStartDate=${weekStartDate}`);
      const b = await r.json();
      if (version !== requestVersion.current) return;
      setList(b.list);
      setMessage(r.ok ? "" : b.error?.message || "Unable to load list.");
    } catch {
      if (version === requestVersion.current) setMessage("Sign in and generate a weekly plan first.");
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(week), 0);
    return () => {
      window.clearTimeout(timer);
      requestVersion.current += 1;
    };
  }, [load, week]);
  const save = async (body: SaveBody) => {
    requestVersion.current += 1;
    const r = await fetch("/api/weekly-shopping-list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weekStartDate: week, ...body }),
    });
    const b = await r.json();
    if (!r.ok) {
      setMessage(b.error?.message || "Unable to save.");
      return;
    }
    setList(b.list);
    setMessage("");
  };
  const csv = () => {
    if (!list) return;
    const csv = [
      ["Ingredient", "Quantity", "Purchased", "Note"],
      ...list.items.map((i) => [
        i.name,
        i.quantityToPurchase,
        i.purchased ? "Yes" : "No",
        i.note || "",
      ]),
    ]
      .map((r) =>
        r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `shopping-list-${week}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <main className="min-h-screen bg-amber-50 p-4 sm:p-8">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-black">Weekly shopping list</h1>
        <p className="mt-2 text-sm text-slate-600">
          Purchased status and notes are household-owned. Purchases never deduct
          pantry stock.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="date"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="rounded-xl border p-2"
          />
          <button onClick={() => void load(week)} className="rounded-xl border px-4 font-bold">
            Load
          </button>
          <button
            onClick={() => save({ action: "refresh" })}
            className="rounded-xl bg-emerald-700 px-4 font-bold text-white"
          >
            Refresh list
          </button>
          <button
            onClick={csv}
            disabled={!list}
            className="rounded-xl border px-4 font-bold disabled:opacity-50"
          >
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-xl border px-4 font-bold"
          >
            Print
          </button>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(
                list?.items
                  .map(
                    (i) =>
                      `${i.purchased ? "✓" : "○"} ${i.name}: ${i.quantityToPurchase}`,
                  )
                  .join("\n") || "",
              )
            }
            disabled={!list}
            className="rounded-xl border px-4 font-bold disabled:opacity-50"
          >
            Copy
          </button>
        </div>
        {message && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">{message}</p>
        )}
        {list?.stale && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 font-bold text-red-800">
            This list is stale. Refresh before changing purchased items.
          </p>
        )}
        <div className="mt-5 grid gap-3">
          {list?.items.map((item) => (
            <article key={item.itemId} className="rounded-2xl border p-4">
              <label className="flex gap-3 font-bold">
                <input
                  type="checkbox"
                  checked={item.purchased}
                  disabled={list.stale}
                  onChange={(e) =>
                    save({
                      action: "update_item",
                      itemId: item.itemId,
                      purchased: e.target.checked,
                    })
                  }
                />
                <span>
                  {item.name} — {item.quantityToPurchase}
                </span>
              </label>
              {item.quantityNeedsConfirmation && (
                <p className="mt-2 text-xs text-amber-800">
                  Quantity needs confirmation.
                </p>
              )}
              <input
                className="mt-3 w-full rounded-lg border p-2 text-sm"
                defaultValue={item.note || ""}
                placeholder="Optional note"
                onBlur={(e) =>
                  e.target.value !== item.note &&
                  save({
                    action: "update_item",
                    itemId: item.itemId,
                    note: e.target.value,
                  })
                }
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
