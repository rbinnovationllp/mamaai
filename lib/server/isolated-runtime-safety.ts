import type { NextResponse } from "next/server";

type Environment = NodeJS.ProcessEnv;

function value(environment: Environment, name: string) {
  const raw = environment[name]?.trim();
  return raw || undefined;
}

export function isIsolatedRuntime(environment: Environment = process.env): boolean {
  const marker = value(environment, "MAMA_AI_ISOLATED_PREVIEW");
  const isolatedIndicators = [
    value(environment, "MAMA_AI_AWS_IDENTITY_SCOPE") === "preview-isolated",
    value(environment, "MAMA_AI_DYNAMODB_TABLE_NAME")?.startsWith("mamaai-preview-") === true,
    value(environment, "AWS_ROLE_ARN")?.includes(":role/MAMAAI-Vercel-Preview-Role") === true,
  ].some(Boolean);
  return marker === "true" || isolatedIndicators;
}

export function isolatedFeatureEnabled(name: string, environment: Environment = process.env): boolean {
  return value(environment, name) === "true";
}

export function isIsolatedFeatureBlocked(name: string, environment: Environment = process.env): boolean {
  return isIsolatedRuntime(environment) && !isolatedFeatureEnabled(name, environment);
}

export function isolatedFeatureDisabledResponse(feature: string) {
  return { error: { code: "ISOLATED_FEATURE_DISABLED", message: `${feature} is disabled in this isolated environment.` } };
}
