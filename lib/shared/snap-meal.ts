export const SNAP_MEAL_ACCEPT = "image/png,image/jpeg,image/webp";
export const MAX_SNAP_MEAL_BYTES = 5 * 1024 * 1024;
export type SnapMealItem = { name: string; portion: string; uncertain?: boolean };
export type SnapMealEntry = { id: string; date: string; mealType: "breakfast"|"lunch"|"snacks"|"dinner"; memberIds: string[]; items: SnapMealItem[]; exceptions: Array<{ memberId: string; items: SnapMealItem[] }>; source: "photo"|"text"|"manual"; createdAt: string };
export function dayForSnap(date: string) { const parsed = new Date(`${date}T12:00:00`); return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][parsed.getDay()] ?? date; }
export function snapSummary(items: SnapMealItem[]) { return items.map((item) => `${item.name}${item.portion ? ` (${item.portion})` : ""}`).join(", "); }
