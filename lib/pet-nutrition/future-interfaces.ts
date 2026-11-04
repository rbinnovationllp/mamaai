export interface ClimateContext { classification: "hot" | "cold" | "humid" | "moderate"; observedAt: string; sourceId: string; seasonalNote?: string; }
export interface RetailerAvailability { retailerName: string; address?: string; productListed: boolean; retailerIdentified: boolean; stockStatus: "verified" | "not_verified"; verifiedAt?: string; sourceId?: string; }
export const climateSafetyNote = "Climate may inform hydration, storage, and spoilage reminders only; it must not alter calories or portions automatically.";
