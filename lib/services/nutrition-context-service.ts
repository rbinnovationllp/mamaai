import type { FamilyMember, NutritionContext } from "@/lib/shared/contracts";

const activityMultiplier: Record<FamilyMember["activityLevel"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9
};

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Above healthy range";
  return "High range";
}

export class NutritionContextService {
  analyze(members: FamilyMember[]): NutritionContext[] {
    return members.map((member) => this.analyzeMember(member));
  }

  private analyzeMember(member: FamilyMember): NutritionContext {
    const notes: string[] = [];
    const specialPopulation =
      member.age < 18 ||
      member.age > 70 ||
      member.specialStatuses.some((status) =>
        ["Pregnancy", "Lactation", "Recently hospitalized", "Recovering from surgery", "Recovering from prolonged illness"].includes(status)
      );

    let bmi: number | undefined;
    let estimatedCalories: number | undefined;
    let proteinGuidanceGrams: number | undefined;

    if (member.heightCm && member.weightKg) {
      bmi = Number((member.weightKg / (member.heightCm / 100) ** 2).toFixed(1));
      notes.push("BMI is an estimate from supplied height and weight.");
      proteinGuidanceGrams = Math.round(member.weightKg * (member.activityLevel === "heavy" || member.activityLevel === "athlete" ? 1.4 : 0.9));
    }

    if (!specialPopulation && member.heightCm && member.weightKg) {
      const base = 10 * member.weightKg + 6.25 * member.heightCm - 5 * member.age + (member.gender === "male" ? 5 : -161);
      estimatedCalories = Math.round(base * activityMultiplier[member.activityLevel]);
      notes.push("Adult calorie estimate uses Mifflin-St Jeor style BMR with activity multiplier.");
    } else {
      notes.push("Detailed calorie formulas are avoided for children, elderly, pregnancy, lactation, and recovery contexts.");
    }

    const requiresProfessionalGuidance =
      member.healthConditions.length > 0 ||
      member.doctorRestrictions.length > 0 ||
      member.specialStatuses.length > 0 ||
      member.age < 18 ||
      member.age > 70;

    return {
      memberId: member.memberId,
      bmi,
      bmiCategory: bmi ? bmiCategory(bmi) : undefined,
      estimatedCalories,
      proteinGuidanceGrams,
      carbGuidance: member.healthConditions.some((condition) => condition.toLowerCase().includes("diabetes"))
        ? "Prefer controlled portions of low-GI carbohydrates with fiber-rich vegetables."
        : "Use balanced portions of grains or millets with vegetables and protein.",
      fatGuidance: "Prefer moderate visible fats and home-style preparation.",
      fiberGuidance: "Include vegetables, pulses, and whole foods as tolerated.",
      hydrationGuidanceMl: member.age < 12 ? 1400 : member.age > 70 ? 1800 : 2200,
      calculationNotes: notes,
      requiresProfessionalGuidance
    };
  }
}
