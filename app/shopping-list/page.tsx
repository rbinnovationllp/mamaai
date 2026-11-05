"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

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
const labels = {
  "en": {
    "title": "Weekly shopping list",
    "intro": "Purchased status and notes belong to your household. Marking a purchase keeps pantry quantities as they are.",
    "date": "Week start date",
    "load": "Load",
    "refresh": "Refresh list",
    "print": "Print",
    "copy": "Copy",
    "stale": "Refresh this list before changing purchased items.",
    "confirm": "Quantity needs confirmation.",
    "note": "Optional note",
    "loadError": "Unable to load the shopping list. Please retry.",
    "setup": "Sign in and generate a weekly plan first.",
    "saveError": "Unable to save the shopping list. Please retry."
  },
  "hi": {
    "title": "साप्ताहिक खरीदारी सूची",
    "intro": "खरीदारी की स्थिति और नोट आपके परिवार के लिए हैं। खरीदी हुई वस्तु चिह्नित करने पर रसोई का स्टॉक वैसा ही रहता है।",
    "date": "सप्ताह की शुरुआत की तारीख",
    "load": "खोलें",
    "refresh": "सूची अपडेट करें",
    "print": "प्रिंट करें",
    "copy": "कॉपी करें",
    "stale": "खरीदारी की स्थिति बदलने से पहले सूची अपडेट करें।",
    "confirm": "मात्रा की पुष्टि करें।",
    "note": "वैकल्पिक नोट",
    "loadError": "खरीदारी सूची नहीं खुल सकी। फिर कोशिश करें।",
    "setup": "साइन इन करें और पहले साप्ताहिक भोजन योजना बनाएँ।",
    "saveError": "खरीदारी सूची सेव नहीं हो सकी। फिर कोशिश करें।"
  },
  "kn": {
    "title": "ವಾರದ ಖರೀದಿ ಪಟ್ಟಿ",
    "intro": "ಖರೀದಿ ಸ್ಥಿತಿ ಮತ್ತು ಟಿಪ್ಪಣಿಗಳು ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಸೇರಿವೆ. ಖರೀದಿಸಿದ ವಸ್ತುವನ್ನು ಗುರುತಿಸಿದಾಗ ಅಡುಗೆಮನೆಯ ದಾಸ್ತಾನು ಹಾಗೆಯೇ ಉಳಿಯುತ್ತದೆ.",
    "date": "ವಾರದ ಆರಂಭದ ದಿನಾಂಕ",
    "load": "ತೆರೆಯಿರಿ",
    "refresh": "ಪಟ್ಟಿಯನ್ನು ನವೀಕರಿಸಿ",
    "print": "ಮುದ್ರಿಸಿ",
    "copy": "ನಕಲಿಸಿ",
    "stale": "ಖರೀದಿ ಸ್ಥಿತಿಯನ್ನು ಬದಲಿಸುವ ಮೊದಲು ಪಟ್ಟಿಯನ್ನು ನವೀಕರಿಸಿ.",
    "confirm": "ಪ್ರಮಾಣವನ್ನು ದೃಢಪಡಿಸಿ.",
    "note": "ಐಚ್ಛಿಕ ಟಿಪ್ಪಣಿ",
    "loadError": "ಖರೀದಿ ಪಟ್ಟಿಯನ್ನು ತೆರೆಯಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    "setup": "ಸೈನ್ ಇನ್ ಮಾಡಿ ಮೊದಲು ವಾರದ ಊಟದ ಯೋಜನೆಯನ್ನು ರಚಿಸಿ.",
    "saveError": "ಖರೀದಿ ಪಟ್ಟಿಯನ್ನು ಉಳಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
  }
};

export default function ShoppingListPage() {
  const { language } = useLanguage();
  const text = labels[language];
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
      setMessage(r.ok ? "" : r.status === 401 || r.status === 404 ? text.setup : text.loadError);
    } catch {
      if (version === requestVersion.current) setMessage(text.loadError);
    }
  }, [text]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(week), 0);
    return () => {
      window.clearTimeout(timer);
      requestVersion.current += 1;
    };
  }, [load, week]);
  const save = async (body: SaveBody) => {
    requestVersion.current += 1;
    try {
      const r = await fetch("/api/weekly-shopping-list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weekStartDate: week, ...body }),
      });
      const b = await r.json();
      if (!r.ok) {
        setMessage(r.status === 401 || r.status === 404 ? text.setup : text.saveError);
        return;
      }
      setList(b.list);
      setMessage("");
    } catch {
      setMessage(text.saveError);
    }
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
        <h1 className="text-3xl font-black">{text.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {text.intro}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="date"
            aria-label={text.date}
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="rounded-xl border p-2"
          />
          <button onClick={() => void load(week)} className="rounded-xl border px-4 font-bold">
            {text.load}
          </button>
          <button
            onClick={() => save({ action: "refresh" })}
            className="rounded-xl bg-emerald-700 px-4 font-bold text-white"
          >
            {text.refresh}
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
            {text.print}
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
            {text.copy}
          </button>
        </div>
        {message && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">{message}</p>
        )}
        {list?.stale && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 font-bold text-red-800">
            {text.stale}
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
                  {text.confirm}
                </p>
              )}
              <input
                className="mt-3 w-full rounded-lg border p-2 text-sm"
                defaultValue={item.note || ""}
                placeholder={text.note}
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
