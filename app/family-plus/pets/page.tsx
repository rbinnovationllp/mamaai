"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppPageNav } from "@/components/AppPageNav";
import { FamilyPlusPetActions } from "@/components/FamilyPlusPetActions";
type Pet = { petId: string; name: string; species: string };
type Item = {
  itemId: string;
  name: string;
  safety: { classification: string; reasons: string[] };
  reminders?: string[];
};
type Schedule = {
  scheduleId: string;
  time: string;
  frequency: string;
  status: string;
  reviewReason?: string;
};
async function call(url: string, init?: RequestInit) {
  const r = await fetch(url, init),
    b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.error?.code || "Feature currently unavailable");
  return b;
}
export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([]),
    [id, setId] = useState(""),
    [items, setItems] = useState<Item[]>([]),
    [schedules, setSchedules] = useState<Schedule[]>([]),
    [notice, setNotice] = useState("");
  const requestVersion = useRef(0);
  const load = useCallback(async (next = "") => {
    const version = ++requestVersion.current;
    try {
      const p = await call("/api/family-plus/pets");
      const chosen = next || p.pets[0]?.petId || "";
      if (version !== requestVersion.current) return;
      setPets(p.pets);
      setId(chosen);
      if (!chosen) {
        setItems([]);
        setSchedules([]);
        setNotice("");
        return;
      }
      const [a, b] = await Promise.all([
        call(`/api/family-plus/pet-pantry?petId=${chosen}`),
        call(`/api/family-plus/pet-schedules?petId=${chosen}`),
      ]);
      if (version === requestVersion.current) {
        setItems(a.items);
        setSchedules(b.schedules);
        setNotice("");
      }
    } catch (e) {
      if (version === requestVersion.current) setNotice(e instanceof Error ? e.message : "Feature unavailable");
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(""), 0);
    return () => {
      window.clearTimeout(timer);
      requestVersion.current += 1;
    };
  }, [load]);
  const post = async (e: React.FormEvent<HTMLFormElement>, url: string) => {
    e.preventDefault();
    const d: any = Object.fromEntries(new FormData(e.currentTarget));
    ["approximateAgeMonths", "weightKg", "quantity", "minimumQuantity"].forEach(
      (k) => {
        if (d[k] !== undefined && d[k] !== "") d[k] = Number(d[k]);
        else delete d[k];
      },
    );
    ["allergies", "foodPreferences", "ownerFeedingPreferences", "preferredFoodProducts", "foodDislikes"].forEach((key) => {
      if (typeof d[key] === "string") d[key] = d[key].split(",").map((value: string) => value.trim()).filter(Boolean);
    });
    try {
      await call(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      e.currentTarget.reset();
      await load(id);
    } catch (x) {
      setNotice(x instanceof Error ? x.message : "Unable to save");
    }
  };
  return (
    <main className="min-h-screen bg-[#f8faf9] px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <AppPageNav />
        <h1 className="mt-6 text-3xl font-black">Family+ pet care</h1>
        <p className="mt-2 text-sm text-slate-600">
          A private household record. Feeding safety statuses do not replace
          veterinary advice.
        </p>
        {notice && (
          <p role="status" className="mt-4 rounded bg-amber-50 p-3 text-sm">
            {notice}
          </p>
        )}
        <section className="mt-5 rounded-xl bg-white p-4">
          <h2 className="font-bold">Our Family — dogs and cats</h2>
          <p className="mt-2 text-sm text-slate-600">Optional: add only the details you know. Pet records are separate from human family profiles and stay under your signed-in account.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pets.map((p) => (
              <div key={p.petId} className="rounded border p-2">
                <button
                  onClick={() => void load(p.petId)}
                  className="font-bold"
                >
                  {p.name} — {p.species}
                </button>
                <FamilyPlusPetActions
                  kind="pet"
                  id={p.petId}
                  petId={p.petId}
                  onDone={async () => load(p.petId)}
                />
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => void post(e, "/api/family-plus/pets")}
            className="mt-4 grid gap-2 sm:grid-cols-2"
          >
            <label className="grid gap-1 text-sm font-medium">Pet name<input name="name" required placeholder="Pet name" className="border p-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Species<select name="species" className="border p-2"><option value="dog">Dog</option><option value="cat">Cat</option></select></label>
            <label className="grid gap-1 text-sm font-medium">Approximate age in months (optional)<input name="approximateAgeMonths" type="number" min="0" max="360" placeholder="Unknown is okay" className="border p-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Weight in kg (optional)<input name="weightKg" type="number" min="0.1" max="150" step="0.1" placeholder="Unknown is okay" className="border p-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Food preferences (optional)<input name="foodPreferences" placeholder="e.g. chicken, wet food" className="border p-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Known allergies (optional)<input name="allergies" placeholder="e.g. chicken, fish" className="border p-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Current food (optional)<input name="currentFood" placeholder="Brand/product or unknown" className="border p-2" /></label>
            <label className="grid gap-1 text-sm font-medium">Current diet<select name="currentDiet" className="border p-2"><option value="commercial">Commercial pet food</option><option value="home_prepared">Home prepared</option><option value="mixed">Mixed</option><option value="veterinary_diet">Veterinarian/prescription diet</option><option value="unknown">Unknown</option></select></label>
            <label className="grid gap-1 text-sm font-medium sm:col-span-2">Veterinarian-provided dietary instructions (optional)<textarea name="veterinaryDietaryInstructions" maxLength={1000} placeholder="Copy only instructions you were given; the app will direct special needs back to your veterinarian." className="min-h-20 border p-2" /></label>
            <input type="hidden" name="activityLevel" value="moderate" />
            <input type="hidden" name="indoorOutdoor" value="indoor" />
            <button className="rounded bg-emerald-800 p-2 font-bold text-white sm:col-span-2">
              Add pet
            </button>
          </form>
        </section>
        {id && (
          <>
            <section className="mt-5 rounded-xl bg-white p-4">
              <h2 className="font-bold">Pet-food pantry and reminders</h2>
              {items.map((i) => (
                <div key={i.itemId} className="mt-2 rounded border p-2">
                  <b>{i.name}</b> — {i.safety.classification}
                  <FamilyPlusPetActions
                    kind="pantry"
                    id={i.itemId}
                    petId={id}
                    onDone={async () => load(id)}
                  />
                  <p className="text-sm text-amber-800">
                    {i.safety.reasons.join(" ")} {i.reminders?.join(" ")}
                  </p>
                </div>
              ))}
              <form
                onSubmit={(e) => void post(e, "/api/family-plus/pet-pantry")}
                className="mt-4 grid gap-2 sm:grid-cols-2"
              >
                <input type="hidden" name="petId" value={id} />
                <input
                  name="name"
                  required
                  placeholder="Food name"
                  className="border p-2"
                />
                <select name="classification" className="border p-2">
                  <option value="unknown">Unknown / review</option>
                  <option value="complete">Complete food</option>
                  <option value="treat">Treat</option>
                </select>
                <input
                  name="quantity"
                  type="number"
                  defaultValue="1"
                  className="border p-2"
                />
                <input name="unit" defaultValue="pack" className="border p-2" />
                <input type="hidden" name="minimumQuantity" value="0" />
                <input type="hidden" name="storageStatus" value="unknown" />
                <button className="rounded bg-emerald-800 p-2 font-bold text-white sm:col-span-2">
                  Add pantry food
                </button>
              </form>
            </section>
            <section className="mt-5 rounded-xl bg-white p-4">
              <h2 className="font-bold">Feeding schedules</h2>
              {schedules.map((s) => (
                <div key={s.scheduleId} className="mt-2 rounded border p-2">
                  <b>{s.time}</b> — {s.frequency} — {s.status}
                  <FamilyPlusPetActions
                    kind="schedule"
                    id={s.scheduleId}
                    petId={id}
                    onDone={async () => load(id)}
                  />
                  {s.reviewReason && (
                    <p className="text-sm text-amber-800">
                      Review: {s.reviewReason}
                    </p>
                  )}
                </div>
              ))}
              <form
                onSubmit={(e) => void post(e, "/api/family-plus/pet-schedules")}
                className="mt-4 grid gap-2 sm:grid-cols-2"
              >
                <input type="hidden" name="petId" value={id} />
                <select required name="pantryItemId" className="border p-2">
                  <option value="">Choose food</option>
                  {items.map((i) => (
                    <option key={i.itemId} value={i.itemId}>
                      {i.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  name="time"
                  type="time"
                  defaultValue="08:00"
                  className="border p-2"
                />
                <input type="hidden" name="frequency" value="daily" />
                <input
                  type="hidden"
                  name="quantitySource"
                  value="requires_review"
                />
                <input type="hidden" name="status" value="requires_review" />
                <button className="rounded bg-emerald-800 p-2 font-bold text-white sm:col-span-2">
                  Create schedule for review
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
