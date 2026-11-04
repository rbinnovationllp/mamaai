import type { PetProfileRecord } from "@/lib/pets/contracts";
import type { AppLanguage } from "@/lib/i18n";

export type PetMealPlan = {
  petId: string;
  petName: string;
  species: "dog" | "cat";
  lifeStage: "kitten_or_puppy" | "adult" | "senior" | "unknown";
  recommendation: string;
  foodPreferences: string[];
  safetyNotes: string[];
  needsVeterinaryReview: boolean;
};

function lifeStage(pet: PetProfileRecord): PetMealPlan["lifeStage"] {
  if (pet.approximateAgeMonths === undefined) return "unknown";
  if (pet.approximateAgeMonths < 12) return "kitten_or_puppy";
  if (pet.approximateAgeMonths >= 84) return "senior";
  return "adult";
}

/**
 * Deliberately deterministic and non-prescriptive. This prepares a separate
 * pet-food reminder, never a recipe or an estimated feeding amount.
 */
export function createPetMealPlan(pet: PetProfileRecord, language: AppLanguage = "en"): PetMealPlan {
  const stage = lifeStage(pet);
  const preferences = [...new Set([
    ...(pet.foodPreferences ?? []),
    ...(pet.ownerFeedingPreferences ?? []),
    ...(pet.preferredFoodProducts ?? []),
  ])];
  const needsVeterinaryReview = pet.currentDiet === "veterinary_diet"
    || Boolean(pet.veterinaryDietaryInstructions?.trim())
    || (pet.healthConditions?.length ?? 0) > 0;
  const currentFood = pet.currentFood?.trim();
  const speciesLabel = pet.species === "cat" ? "cat" : "dog";
  const copy = {
    en: { recorded: `Continue the recorded ${speciesLabel} food (${currentFood}) only if it remains appropriate for ${pet.name}; follow its label feeding guide or your veterinarian's instructions.`, choose: `Choose a nutritionally complete food labelled for a ${stage === "unknown" ? "suitable life stage" : stage.replace("_", " ")} ${speciesLabel}; follow its label feeding guide or your veterinarian's instructions.`, separate: "This is separate from the family meal plan. Do not use human meals or leftovers as a complete pet diet.", portions: "Do not use this plan to calculate a feeding amount. Follow the selected food label or veterinarian instructions for portions.", allergies: "Avoid recorded allergies", veterinarian: "A medical condition, prescription/veterinary diet, or veterinarian instruction is recorded. Ask the veterinarian for a personalised feeding plan before changing food." },
    hi: { recorded: `${pet.name} के लिए दर्ज ${speciesLabel} food (${currentFood}) तभी जारी रखें जब वह उपयुक्त हो; हिस्सों के लिए food label या veterinarian के निर्देश मानें।`, choose: `${speciesLabel} के लिए उसकी life stage के अनुरूप nutritionally complete food चुनें; हिस्सों के लिए food label या veterinarian के निर्देश मानें।`, separate: "यह family meal plan से अलग है। मानव भोजन या leftovers को complete pet diet न मानें।", portions: "इस plan से feeding quantity न निकालें। हिस्सों के लिए food label या veterinarian के निर्देश मानें।", allergies: "दर्ज allergies से बचें", veterinarian: "Medical condition, prescription/veterinary diet या veterinarian instruction दर्ज है। Food बदलने से पहले व्यक्तिगत सलाह के लिए veterinarian से बात करें।" },
    kn: { recorded: `${pet.name} ಗೆ ದಾಖಲಿಸಿರುವ ${speciesLabel} food (${currentFood}) ಸೂಕ್ತವಾಗಿದ್ದರೆ ಮಾತ್ರ ಮುಂದುವರಿಸಿ; ಪ್ರಮಾಣಕ್ಕಾಗಿ food label ಅಥವಾ veterinarian ಸೂಚನೆ ಅನುಸರಿಸಿ.`, choose: `${speciesLabel} ಗೆ ಅದರ life stage ಗೆ ಸೂಕ್ತವಾದ nutritionally complete food ಆಯ್ಕೆಮಾಡಿ; ಪ್ರಮಾಣಕ್ಕಾಗಿ food label ಅಥವಾ veterinarian ಸೂಚನೆ ಅನುಸರಿಸಿ.`, separate: "ಇದು family meal plan ನಿಂದ ಪ್ರತ್ಯೇಕ. ಮಾನವ ಆಹಾರ ಅಥವಾ leftovers ಅನ್ನು ಸಂಪೂರ್ಣ pet diet ಎಂದು ಪರಿಗಣಿಸಬೇಡಿ.", portions: "ಈ plan ನಿಂದ feeding quantity ಲೆಕ್ಕಿಸಬೇಡಿ. ಪ್ರಮಾಣಕ್ಕಾಗಿ food label ಅಥವಾ veterinarian ಸೂಚನೆ ಅನುಸರಿಸಿ.", allergies: "ದಾಖಲಿಸಿದ allergies ತಪ್ಪಿಸಿ", veterinarian: "Medical condition, prescription/veterinary diet ಅಥವಾ veterinarian instruction ದಾಖಲಾಗಿದೆ. ಆಹಾರ ಬದಲಿಸುವ ಮೊದಲು ವೈಯಕ್ತಿಕ ಸಲಹೆಗೆ veterinarian ಅನ್ನು ಸಂಪರ್ಕಿಸಿ." },
  }[language];
  const recommendation = currentFood ? copy.recorded : copy.choose;
  const safetyNotes = [copy.separate, copy.portions];
  if (pet.allergies.length) safetyNotes.push(`${copy.allergies}: ${pet.allergies.join(", ")}.`);
  if (needsVeterinaryReview) safetyNotes.push(copy.veterinarian);
  return { petId: pet.petId, petName: pet.name, species: pet.species, lifeStage: stage, recommendation, foodPreferences: preferences, safetyNotes, needsVeterinaryReview };
}
