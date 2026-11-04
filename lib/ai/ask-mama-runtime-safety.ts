import type { AskMamaRequestKind } from "./ask-mama-response-safety";
import { isIsolatedFeatureBlocked } from "../server/isolated-runtime-safety";

export function isAskMamaPreviewBlocked(environment: NodeJS.ProcessEnv = process.env): boolean {
  return isIsolatedFeatureBlocked("MAMA_AI_PREVIEW_ASK_MAMA_ENABLED", environment)
    || (environment.VERCEL_ENV === "preview" && environment.MAMA_AI_PREVIEW_ASK_MAMA_ENABLED !== "true");
}

export function askMamaUnavailableMessage(kind: AskMamaRequestKind): string {
  return kind === "specific_food_advice"
    ? "Specific food recommendations are temporarily unavailable. Please try again later after Ask MAMA can validate a complete ingredient list against your saved family profile."
    : "Ask MAMA is temporarily unavailable. Please try again in a moment.";
}

