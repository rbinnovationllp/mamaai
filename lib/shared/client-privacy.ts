// Deliberately keep personal household data out of browser-persistent storage.
// Saved data is rehydrated from authenticated API responses after sign-in.
export const SENSITIVE_BROWSER_STORAGE_KEYS = [
  "mamaai_household_members_v1",
  "mamaai_customer_account_v1",
  "mamaai_family_profile_draft_v1",
  "mamaai_culture_profile_v1",
  "mamaai_pantry_items_v1",
  "mamaai_family_learning_v1",
  "mamaai_today_attendance_v1",
  "mamaai_yesterday_attendance_v1",
  "mamaai_regular_weekday_attendance_v1",
  "mamaai_current_meal_plan_v1",
  "mamaai_weekly_master_plan_v1",
  "mamaai_next_week_master_plan_v1",
  "mamaai_last_successful_plan",
  "mamaai_confirmed_slots",
];

export async function clearSensitiveBrowserData() {
  if (typeof window === "undefined") return;
  for (const key of SENSITIVE_BROWSER_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
  // Earlier PWA builds used mamaai-pwa-* cache names. The current worker is
  // public-assets-only, but removing old caches closes the upgrade path.
  if ("caches" in window) {
    const keys = await window.caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("mamaai-pwa-")).map((key) => window.caches.delete(key)));
  }
}
