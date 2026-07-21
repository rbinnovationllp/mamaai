"use client";

import { useState } from "react";
import Image from "next/image";
import type { FamilyMealPlan, FamilyMember, NutritionContext, RecipeVideoSearchResponse } from "@/lib/shared/contracts";

interface MamaFamilyTableProps {
  members: FamilyMember[];
  nutritionContexts: NutritionContext[];
  mealPlan: FamilyMealPlan;
  familyContext?: {
    country?: string;
    region?: string;
    preferredLanguage?: string;
    cuisine?: string[];
    dietaryPreference?: string;
  };
}

export function MamaFamilyTable({ members, nutritionContexts, mealPlan, familyContext }: MamaFamilyTableProps) {
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [selectedPreferenceOption, setSelectedPreferenceOption] = useState<string | null>(null);
  const [videoSearch, setVideoSearch] = useState<RecipeVideoSearchResponse | null>(null);
  const [videoStatus, setVideoStatus] = useState("");
  const recipe = mealPlan.commonMeal.recipe;
  const selectedOption = mealPlan.preferenceResolution?.options.find((option) => option.optionId === selectedPreferenceOption);

  async function watchHowToCook() {
    setVideoStatus("Searching for suitable recipe videos...");
    setVideoSearch(null);
    const response = await fetch("/api/recipes/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dishName: mealPlan.commonMeal.name,
        country: familyContext?.country,
        region: familyContext?.region,
        preferredLanguage: familyContext?.preferredLanguage,
        cuisine: familyContext?.cuisine,
        dietaryPreference: familyContext?.dietaryPreference,
        healthyPreparation: true,
        familyRequirements: mealPlan.memberCustomizations.flatMap((customization) => customization.safetyNotes)
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setVideoStatus(data.error?.message ?? "Video search failed.");
      return;
    }
    setVideoSearch(data);
    setVideoStatus(data.note);
  }

  return (
    <section className="table-zone" aria-label="MAMA Family Table">
      <div className="common-meal">
        <p className="eyebrow">Common Family Meal Today</p>
        <h2>{mealPlan.commonMeal.name}</h2>
        <p className="lead">{mealPlan.commonMeal.description}</p>
        <p className="muted">
          {mealPlan.commonMeal.prepTimeMinutes} minutes - {mealPlan.commonMeal.difficulty} - {mealPlan.commonMeal.regionFit}
        </p>
        <p className="notice">
          Estimated if cooked as suggested: {mealPlan.commonMeal.nutritionEstimate.caloriesKcal} kcal,{" "}
          {mealPlan.commonMeal.nutritionEstimate.proteinGrams} g protein, {mealPlan.commonMeal.nutritionEstimate.carbsGrams} g carbs,{" "}
          {mealPlan.commonMeal.nutritionEstimate.fatGrams} g fat, and {mealPlan.commonMeal.nutritionEstimate.fiberGrams} g fiber for the family meal.
        </p>
        <button className="button" onClick={() => setRecipeOpen(true)}>
          View Recipe / How to Cook
        </button>
      </div>

      {recipeOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Recipe for ${recipe.title}`}>
          <div className="recipe-modal">
            <div className="member-header">
              <div>
                <p className="eyebrow">How to Cook</p>
                <h2>{recipe.title}</h2>
              </div>
              <button className="button secondary" onClick={() => setRecipeOpen(false)}>
                Close
              </button>
            </div>

            <div className="recipe-meta">
              <span>Serves {recipe.servings}</span>
              <span>Prep {recipe.prepTimeMinutes} min</span>
              <span>Cook {recipe.cookTimeMinutes} min</span>
              <span>{recipe.difficulty}</span>
              <span>INR {recipe.estimatedCost.amount}</span>
            </div>

            <section className="recipe-section">
              <h3>Ingredients</h3>
              <div className="grocery">
                {recipe.ingredients.map((ingredient) => (
                  <div className="grocery-item" key={`${ingredient.name}-${ingredient.quantity}`}>
                    <p className="mini-title">{ingredient.name}</p>
                    <p className="muted">
                      {ingredient.quantity} - INR {ingredient.estimatedCost.amount}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="recipe-section">
              <h3>Steps</h3>
              <ol className="recipe-steps">
                {recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="recipe-section">
              <h3>Estimated Nutrition</h3>
              <p className="muted">
                {recipe.estimatedNutrition.caloriesKcal} kcal, {recipe.estimatedNutrition.proteinGrams} g protein,{" "}
                {recipe.estimatedNutrition.carbsGrams} g carbs, {recipe.estimatedNutrition.fatGrams} g fat,{" "}
                {recipe.estimatedNutrition.fiberGrams} g fiber.
              </p>
            </section>

            <section className="recipe-section">
              <h3>Family Adjustments</h3>
              <ul className="recipe-list">
                {recipe.familyAdjustments.map((adjustment) => (
                  <li key={adjustment}>{adjustment}</li>
                ))}
                {mealPlan.memberCustomizations.map((customization) => (
                  <li key={customization.memberId}>
                    {customization.memberName}: {customization.modification}
                  </li>
                ))}
              </ul>
            </section>

            <section className="recipe-section">
              <h3>Alternatives</h3>
              <ul className="recipe-list">
                {recipe.alternativeIngredients.map((alternative) => (
                  <li key={alternative}>{alternative}</li>
                ))}
              </ul>
            </section>

            {recipe.videoRecommendation ? (
              <section className="recipe-section">
                <h3>Watch How to Cook</h3>
                <p className="feature-status">
                  <span>Optional external service</span>
                  Written recipe is fully available. Video discovery may be limited in this testing version.
                </p>
                <button className="button" onClick={watchHowToCook}>
                  Watch How to Cook
                </button>
                <p className="muted">{recipe.videoRecommendation.note}</p>
                {videoStatus ? (
                  <div className="notice">
                    {videoSearch?.statusLabel ? <p className="mini-title">{videoSearch.statusLabel}</p> : null}
                    <p>{videoStatus}</p>
                  </div>
                ) : null}
                {videoSearch ? (
                  videoSearch.results.length ? (
                    <div className="video-results">
                      {videoSearch.results.map((video) => (
                        <a className="video-result" href={video.url} key={video.url} target="_blank" rel="noreferrer">
                          {video.thumbnailUrl ? <Image src={video.thumbnailUrl} alt="" width={112} height={63} unoptimized /> : null}
                          <span>
                            <strong>{video.title}</strong>
                            <small>{video.channelTitle}</small>
                            <small>{video.thirdPartyDisclaimer}</small>
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      {mealPlan.preferenceResolution?.hasSoftConflict ? (
        <section className="panel preference-card">
          <p className="eyebrow">Family Preference Choice</p>
          <h2>Keep satisfaction high without extra cooking?</h2>
          <p className="lead">{mealPlan.preferenceResolution.prompt}</p>
          <div className="preference-affected">
            {mealPlan.preferenceResolution.affectedMembers.map((member) => (
              <div className="grocery-item" key={member.memberId}>
                <p className="mini-title">{member.memberName}</p>
                <p className="muted">Does not prefer: {member.conflicts.join(", ")}</p>
                <p className="muted">Simple alternative: {member.suggestedAlternative}</p>
              </div>
            ))}
          </div>
          <div className="preference-options">
            {mealPlan.preferenceResolution.options.map((option) => (
              <button
                className={option.optionId === selectedPreferenceOption ? "button" : "button secondary"}
                key={option.optionId}
                onClick={() => setSelectedPreferenceOption(option.optionId)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="notice">
            {selectedOption
              ? `${selectedOption.description} ${selectedOption.cookingImpact}`
              : `${mealPlan.preferenceResolution.minimumCookingStrategy} Recommended: ${
                  mealPlan.preferenceResolution.options.find((option) => option.optionId === mealPlan.preferenceResolution?.recommendedOptionId)?.label
                }.`}
          </p>
        </section>
      ) : null}

      <div className="family-table">
        {mealPlan.memberCustomizations.map((customization) => {
          const member = members.find((item) => item.memberId === customization.memberId);
          const nutrition = nutritionContexts.find((item) => item.memberId === customization.memberId);
          const fruit = mealPlan.fruits.find((item) => item.memberId === customization.memberId);
          const hydration = mealPlan.hydration.find((item) => item.memberId === customization.memberId);

          return (
            <article className="panel person" key={customization.memberId}>
              <h3>{customization.memberName}</h3>
              <p className="muted">{member?.relationship} - Age {member?.age}</p>
              <div className="stack">
                <p>
                  <span className="mini-title">Modification: </span>
                  {customization.modification}
                </p>
                <p>
                  <span className="mini-title">Portion: </span>
                  {customization.portionGuidance}
                </p>
                {fruit ? (
                  <p>
                    <span className="mini-title">Fruit: </span>
                    {fruit.fruit}, {fruit.portion}
                  </p>
                ) : null}
                {hydration ? (
                  <p>
                    <span className="mini-title">Hydration: </span>
                    {hydration.guidance}
                  </p>
                ) : null}
                {nutrition?.bmi ? (
                  <p className="muted">
                    BMI estimate: {nutrition.bmi} ({nutrition.bmiCategory})
                  </p>
                ) : null}
                {customization.safetyNotes.length ? <p className="notice">{customization.safetyNotes.join(" ")}</p> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
