"use client";

import { useEffect, useMemo, useState } from "react";
import { MamaFamilyTable } from "./MamaFamilyTable";
import type {
  CreateFamilyMemberInput,
  Family,
  FamilyMealPlan,
  FamilyMember,
  NutritionContext
} from "@/lib/shared/contracts";
import { demoMemberInputs } from "@/lib/shared/demo-data";

type DemoResponse = {
  family: Family;
  members: FamilyMember[];
  nutritionContexts: NutritionContext[];
  mealPlan: FamilyMealPlan;
};

const demoSteps = [
  "Fictional family profile",
  "Multiple family members",
  "Nutrition context",
  "One common family meal",
  "Personal portions and adjustments",
  "Fruit and hydration",
  "Replace meal",
  "Updated grocery list",
  "MAMA Family Table",
  "Feedback"
];

const initialMember: CreateFamilyMemberInput = {
  name: "New Member",
  relationship: "Family member",
  age: 30,
  gender: "female",
  heightCm: 160,
  weightKg: 60,
  activityLevel: "moderate",
  goals: ["Healthy living"],
  dietType: "vegetarian",
  likes: [],
  dislikes: [],
  allergies: [],
  healthConditions: [],
  doctorRestrictions: [],
  specialStatuses: []
};

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]) {
  return value.join(", ");
}

export function FamilyFlow() {
  const [judgeMode, setJudgeMode] = useState(true);
  const [familyName, setFamilyName] = useState("Bhartiya Demo Family");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [members, setMembers] = useState<CreateFamilyMemberInput[]>(demoMemberInputs);
  const [createdFamily, setCreatedFamily] = useState<Family | null>(null);
  const [createdMembers, setCreatedMembers] = useState<FamilyMember[]>([]);
  const [nutritionContexts, setNutritionContexts] = useState<NutritionContext[]>([]);
  const [mealPlan, setMealPlan] = useState<FamilyMealPlan | null>(null);
  const [status, setStatus] = useState("Loading fictional demo family...");
  const [error, setError] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const canGenerate = useMemo(() => Boolean(createdFamily), [createdFamily]);

  useEffect(() => {
    loadDemo();
  }, []);

  async function loadDemo(mode: "judge" | "standard" = "standard") {
    setJudgeMode(mode === "judge");
    setError("");
    setFeedbackSaved(false);
    setStatus(mode === "judge" ? "Opening Judge Access with fictional demo data..." : "Loading fictional demo family...");
    const response = await fetch("/api/demo");
    const data = (await response.json()) as DemoResponse;
    setCreatedFamily(data.family);
    setCreatedMembers(data.members);
    setNutritionContexts(data.nutritionContexts);
    setMealPlan(data.mealPlan);
    setFamilyName(data.family.name);
    setCity(data.family.city);
    setState(data.family.state);
    setMembers(data.members.map(({ memberId: _memberId, familyId: _familyId, ...member }) => member));
    setStatus(
      mode === "judge"
        ? "Judge Access ready. Review the family profile, common meal, personal guidance, fruit, hydration, grocery list, and try Replace Meal."
        : "Demo family loaded. You can edit members, recreate the family, or replace the meal."
    );
  }

  function updateMember(index: number, patch: Partial<CreateFamilyMemberInput>) {
    setMembers((current) => current.map((member, itemIndex) => (itemIndex === index ? { ...member, ...patch } : member)));
  }

  async function createFamily() {
    setError("");
    setFeedbackSaved(false);
    setStatus("Creating family and saving members...");

    const response = await fetch("/api/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "demo-user",
        family: {
          name: familyName,
          country: "India",
          state,
          city,
          cuisinePreferences: ["Indian", "Home-style"],
          budget: { type: "daily", amount: 450, currency: "INR" },
          kitchenProfile: {
            equipment: ["Gas stove", "Pressure cooker", "Mixer/grinder"],
            cookingTimePreference: "under_30"
          },
          subscriptionPlan: "family_premium"
        },
        members
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "Family creation failed.");
      setStatus("");
      return;
    }

    setCreatedFamily(data.family);
    setCreatedMembers(data.members);
    setMealPlan(null);
    setNutritionContexts([]);
    setStatus("Family created. Ready to analyze profiles and generate one common family meal.");
  }

  async function generateMeal() {
    if (!createdFamily) return;

    setError("");
    setFeedbackSaved(false);
    setStatus("Analyzing profiles and generating one common family meal...");

    const response = await fetch("/api/meal-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyId: createdFamily.familyId,
        planType: "daily",
        targetDate: new Date().toISOString().slice(0, 10)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "Meal generation failed.");
      setStatus("");
      return;
    }

    setNutritionContexts(data.nutritionContexts);
    setMealPlan(data.mealPlan);
    setStatus("Common family meal generated with portions, modifications, fruit, hydration, and grocery list.");
  }

  async function replaceMeal() {
    if (!mealPlan) return;

    setError("");
    setFeedbackSaved(false);
    setStatus("Replacing meal and recalculating grocery list...");

    const response = await fetch(`/api/meal-plans/${mealPlan.mealPlanId}/replace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "ingredient_unavailable",
        unavailableIngredients: ["Rice"],
        dislikedFoods: []
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error?.message ?? "Meal replacement failed.");
      setStatus("");
      return;
    }

    setMealPlan(data.mealPlan);
    setStatus("Meal replaced. Grocery list and estimated cost have been updated.");
  }

  async function saveFeedback(rating: "loved" | "good" | "average" | "dont_suggest_again") {
    if (!mealPlan) return;

    setError("");
    setStatus("Saving family feedback...");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealPlanId: mealPlan.mealPlanId,
        rating
      })
    });

    if (!response.ok) {
      setError("Feedback could not be saved.");
      setStatus("");
      return;
    }

    setFeedbackSaved(true);
    setStatus("Feedback saved for future personalization.");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <span>MAMA AI</span>
        </div>
        <p className="muted">The Wisdom of Maa. The Intelligence of AI.</p>
      </header>

      <main className="main">
        <section className="hero">
          <p className="eyebrow">One Family. Different Needs. One Intelligent Meal Plan.</p>
          <h1>What Shall MAMA Plan for Your Family Today?</h1>
          <div className="judge-banner">
            <div>
              <p className="eyebrow">Codex Hackathon Judge Access</p>
              <h2>Try the full MAMA AI demo without registration or payment.</h2>
              <p>
                Uses only fictional family data and shows the core innovation in minutes: one common family meal with
                personalized portions, modifications, fruit, hydration, replacement, grocery update, and the MAMA Family Table.
              </p>
            </div>
            <button className="button judge-button" onClick={() => loadDemo("judge")}>
              Try Demo / Judge Access
            </button>
          </div>
          <p className="lead">
            Create a family, add the needs of each family member, and generate one practical common meal with personal portions,
            fruit, hydration, and a grocery list that updates when the meal changes.
          </p>
          <div className="actions">
            <button className="button" onClick={generateMeal} disabled={!canGenerate}>
              Plan Today
            </button>
            <button className="button secondary" onClick={() => loadDemo("standard")}>
              Load Demo Family
            </button>
            <button className="button secondary" onClick={replaceMeal} disabled={!mealPlan}>
              Replace Meal
            </button>
          </div>
          {judgeMode ? (
            <div className="demo-steps" aria-label="Judge demo checklist">
              {demoSteps.map((step, index) => (
                <span key={step}>
                  {index + 1}. {step}
                </span>
              ))}
            </div>
          ) : null}
          <p className={error ? "status error" : "status"}>{error || status}</p>
        </section>

        <div className="grid">
          <section className="panel">
            <div className="member-header">
              <h2>{judgeMode ? "Fictional Judge Demo Family" : "Create Family"}</h2>
              {judgeMode ? <span className="pill">Payment bypass: demo only</span> : null}
            </div>
            {judgeMode ? (
              <p className="notice">
                Judge Access uses preloaded fictional profiles only. It does not use real personal or medical data and does
                not require RevenueCat, Google Play Billing, or account registration.
              </p>
            ) : null}
            <div className="field-grid">
              <div className="row">
                <label>
                  Family name
                  <input value={familyName} onChange={(event) => setFamilyName(event.target.value)} />
                </label>
                <label>
                  City
                  <input value={city} onChange={(event) => setCity(event.target.value)} />
                </label>
              </div>
              <label>
                State
                <input value={state} onChange={(event) => setState(event.target.value)} />
              </label>
              <div className="member-list">
                <div className="member-header">
                  <h2>Add Members</h2>
                  <button className="button secondary" onClick={() => setMembers((current) => [...current, initialMember])}>
                    Add Member
                  </button>
                </div>

                {members.map((member, index) => (
                  <article className="member-item" key={`${member.name}-${index}`}>
                    <div className="member-header">
                      <strong>{member.name || "Family member"}</strong>
                      <button
                        className="button secondary"
                        onClick={() => setMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        disabled={members.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="field-grid">
                      <div className="row">
                        <label>
                          Name
                          <input value={member.name} onChange={(event) => updateMember(index, { name: event.target.value })} />
                        </label>
                        <label>
                          Relationship
                          <input value={member.relationship} onChange={(event) => updateMember(index, { relationship: event.target.value })} />
                        </label>
                      </div>
                      <div className="row">
                        <label>
                          Age
                          <input
                            type="number"
                            value={member.age}
                            onChange={(event) => updateMember(index, { age: Number(event.target.value) })}
                          />
                        </label>
                        <label>
                          Activity
                          <select
                            value={member.activityLevel}
                            onChange={(event) => updateMember(index, { activityLevel: event.target.value as CreateFamilyMemberInput["activityLevel"] })}
                          >
                            <option value="sedentary">Sedentary</option>
                            <option value="light">Light</option>
                            <option value="moderate">Moderate</option>
                            <option value="heavy">Heavy</option>
                            <option value="athlete">Athlete</option>
                          </select>
                        </label>
                      </div>
                      <div className="row">
                        <label>
                          Height cm
                          <input
                            type="number"
                            value={member.heightCm ?? ""}
                            onChange={(event) => updateMember(index, { heightCm: Number(event.target.value) })}
                          />
                        </label>
                        <label>
                          Weight kg
                          <input
                            type="number"
                            value={member.weightKg ?? ""}
                            onChange={(event) => updateMember(index, { weightKg: Number(event.target.value) })}
                          />
                        </label>
                      </div>
                      <label>
                        Health context
                        <input
                          value={joinList(member.healthConditions)}
                          onChange={(event) => updateMember(index, { healthConditions: splitList(event.target.value) })}
                          placeholder="Diabetes, hypertension"
                        />
                      </label>
                      <label>
                        Allergies and doctor restrictions
                        <input
                          value={joinList([...member.allergies, ...member.doctorRestrictions])}
                          onChange={(event) => {
                            const values = splitList(event.target.value);
                            updateMember(index, { allergies: values, doctorRestrictions: [] });
                          }}
                          placeholder="Peanut, avoid sugary beverages"
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
              <button className="button" onClick={createFamily}>
                {judgeMode ? "Recreate Demo Family" : "Create Family"}
              </button>
            </div>
          </section>

          <section className="stack">
            {mealPlan && createdMembers.length ? (
              <>
                <MamaFamilyTable members={createdMembers} nutritionContexts={nutritionContexts} mealPlan={mealPlan} />

                <section className="panel">
                  <h2>Auto-Updated Grocery List</h2>
                  <div className="grocery">
                    {mealPlan.groceryItems.map((item) => (
                      <div className="grocery-item" key={item.itemId}>
                        <p className="mini-title">{item.name}</p>
                        <p className="muted">
                          {item.quantityToPurchase} · INR {item.estimatedCost.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="muted">
                    Estimated meal cost: INR {mealPlan.estimatedCost.mealCost.amount} · Daily estimate: INR{" "}
                    {mealPlan.estimatedCost.dailyCost.amount}
                  </p>
                </section>

                <section className="panel subscription-panel">
                  <h2>Subscription Architecture</h2>
                  <p className="muted">
                    Judge Access safely bypasses payment for demo review. Production entitlement remains server-side and
                    RevenueCat-ready.
                  </p>
                  <div className="plan-grid">
                    <div>
                      <p className="mini-title">Family Starter</p>
                      <p className="muted">INR 199/month · 4 members</p>
                    </div>
                    <div>
                      <p className="mini-title">Family Premium</p>
                      <p className="muted">INR 399/month · 6 members</p>
                    </div>
                    <div>
                      <p className="mini-title">Family Plus</p>
                      <p className="muted">INR 599/month · 10 members</p>
                    </div>
                  </div>
                </section>

                <section className="panel">
                  <h2>Family Feedback</h2>
                  <div className="actions">
                    <button className="button secondary" onClick={() => saveFeedback("loved")}>
                      Loved It
                    </button>
                    <button className="button secondary" onClick={() => saveFeedback("good")}>
                      Good
                    </button>
                    <button className="button secondary" onClick={() => saveFeedback("average")}>
                      Average
                    </button>
                    <button className="button warn" onClick={() => saveFeedback("dont_suggest_again")}>
                      Do Not Suggest
                    </button>
                  </div>
                  {feedbackSaved ? <p className="notice">Feedback saved for personalization.</p> : null}
                </section>

                <p className="notice">{mealPlan.disclaimer}</p>
              </>
            ) : (
              <section className="panel">
                <h2>MAMA Family Table</h2>
                <p className="lead">Create a family, then plan today to see the common family dish and personal guidance for each member.</p>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
