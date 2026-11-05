import type { AppLanguage } from "../i18n";
import type { AskMamaRequestKind } from "./ask-mama-response-safety";
import { isIsolatedFeatureBlocked } from "../server/isolated-runtime-safety";

export function isAskMamaPreviewBlocked(environment: NodeJS.ProcessEnv = process.env): boolean {
  return isIsolatedFeatureBlocked("MAMA_AI_PREVIEW_ASK_MAMA_ENABLED", environment)
    || (environment.VERCEL_ENV === "preview" && environment.MAMA_AI_PREVIEW_ASK_MAMA_ENABLED !== "true");
}

export function askMamaUnavailableMessage(kind: AskMamaRequestKind, language: AppLanguage = "en"): string {
  if (language === "hi") {
    return kind === "specific_food_advice"
      ? "खाने के विशेष सुझाव अभी उपलब्ध नहीं हैं। बाद में फिर कोशिश करें।"
      : "Ask MAMA अभी उपलब्ध नहीं है। थोड़ी देर बाद फिर कोशिश करें।";
  }
  if (language === "kn") {
    return kind === "specific_food_advice"
      ? "ನಿರ್ದಿಷ್ಟ ಆಹಾರ ಸಲಹೆಗಳು ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ. ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
      : "Ask MAMA ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ. ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";
  }
  return kind === "specific_food_advice"
    ? "Specific food recommendations are temporarily unavailable. Please try again later after Ask MAMA can validate a complete ingredient list against your saved family profile."
    : "Ask MAMA is temporarily unavailable. Please try again in a moment.";
}

