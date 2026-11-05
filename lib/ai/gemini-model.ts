const supportedModels = new Set(["gemini-2.5-flash", "gemini-3.8-flash"]);

export function configuredAskMamaGeminiModel(environment: NodeJS.ProcessEnv = process.env): string {
  const configured = environment.MAMA_AI_GEMINI_MODEL?.trim();
  if (!configured) return "gemini-2.5-flash";
  if (!supportedModels.has(configured)) throw new Error("Unsupported Ask MAMA Gemini model configuration.");
  return configured;
}
