import { randomUUID } from "crypto";

export type AskMamaStage = "sdk_init" | "model_init" | "provider_call" | "response_parse" | "validation";

function enabled() {
  return process.env.MAMA_AI_DYNAMODB_LOCAL === "true" && process.env.MAMA_AI_LOCAL_QA === "true" && !process.env.VERCEL && !process.env.VERCEL_ENV;
}

export function askMamaDiagnosticId() { return randomUUID(); }

function safeProviderMessage(error: unknown, status: number) {
  if (!Number.isFinite(status) || !error || typeof (error as { message?: unknown }).message !== "string") return undefined;
  return (error as { message: string }).message
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/AIza[\w-]+/g, "[redacted-key]")
    .replace(/(authorization)\s*[:=]\s*Bearer\s+\S+/gi, "$1=[redacted]")
    .replace(/(api[_ -]?key|cookie)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .replace(/\s+/g, " ").trim().slice(0, 240) || undefined;
}

export function logAskMamaDiagnostic(id: string, stage: AskMamaStage, error: unknown, state: { invoked: boolean; received: boolean; parsed: boolean }) {
  if (!enabled()) return;
  const candidate = error as { name?: string; status?: number; statusCode?: number; code?: string };
  const status = Number(candidate?.status ?? candidate?.statusCode);
  const category = status === 401 || status === 403 ? "provider_auth" : status === 404 ? "model_access" : status === 429 ? "provider_quota" : status >= 500 ? "provider_server" : candidate?.name === "SyntaxError" ? "response_parse" : /timeout|abort/i.test(String(candidate?.name)) ? "network_timeout" : "application_error";
  console.info("LOCAL_QA_ASK_MAMA_DIAGNOSTIC", { id, stage, category, providerStatus: Number.isFinite(status) ? status : undefined, providerCode: typeof candidate?.code === "string" ? candidate.code.slice(0, 64) : undefined, providerMessage: safeProviderMessage(error, status), invoked: state.invoked, received: state.received, parsed: state.parsed });
}
