import type { FamilyMealPlan, FamilyMember, NutritionContext } from "@/lib/shared/contracts";

interface MamaFamilyTableProps {
  members: FamilyMember[];
  nutritionContexts: NutritionContext[];
  mealPlan: FamilyMealPlan;
}

export function MamaFamilyTable({ members, nutritionContexts, mealPlan }: MamaFamilyTableProps) {
  return (
    <section className="table-zone" aria-label="MAMA Family Table">
      <div className="common-meal">
        <p className="eyebrow">Common Family Meal Today</p>
        <h2>{mealPlan.commonMeal.name}</h2>
        <p className="lead">{mealPlan.commonMeal.description}</p>
        <p className="muted">
          {mealPlan.commonMeal.prepTimeMinutes} minutes - {mealPlan.commonMeal.difficulty} - {mealPlan.commonMeal.regionFit}
        </p>
      </div>

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
