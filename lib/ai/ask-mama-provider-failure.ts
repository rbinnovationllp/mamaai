export function isAskMamaProviderBusy(error: unknown): boolean {
  const status = Number((error as { status?: number; statusCode?: number })?.status ?? (error as { statusCode?: number })?.statusCode);
  return status === 503;
}

export function askMamaProviderBusyMessage(): string {
  return "Ask MAMA is temporarily busy. Please try again in a few minutes. Your saved family meal plans are still available.";
}
