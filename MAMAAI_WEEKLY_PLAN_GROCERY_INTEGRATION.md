# Weekly-plan to automatic-grocery integration

## Existing path

1. Family Profile persists owner-scoped members and planning preferences.
2. `POST /api/weekly-meal-plans` authenticates, checks entitlement and calls `WeeklyMealPlanningService.generateOrGet`.
3. The service generates Monday–Sunday slots, includes office/school tiffins by attendance role, validates safety, aggregates recipe requirements, subtracts compatible pantry inventory and saves `WeeklyMealPlan`.
4. `weeklyGroceryRequirements`, procurement schedule and reminders are saved on that plan.
5. `POST /api/weekly-shopping-list` with `action: "refresh"` copies the saved weekly requirements into an owner/family-scoped editable shopping list while preserving existing purchased state and notes for matching item IDs.

This already supports the requested customer flow conceptually: **Generate weekly plan → automatically derive requirements → refresh persisted shopping list.** It must not require manual recipe construction. The current UI exposes “Generate Weekly Plan” in the planner; it should call the weekly endpoint and, after success, automatically call shopping-list refresh rather than require a separate user action.

## Minimal safe integration correction proposed (owner approval not yet requested)

After a successful weekly-plan response in `app/planner/page.tsx`:

1. issue same-origin `POST /api/weekly-shopping-list` with `{ weekStartDate, action: "refresh" }`;
2. show the returned list/count and a link to `/shopping-list`;
3. if refresh fails, keep the saved weekly plan, show a retry action, and do not claim a saved grocery list;
4. preserve purchased/note state via the existing server-side fingerprint merge.

This is a small local integration change, but it should be implemented only after an authenticated weekly-plan browser test confirms route payload and failure behavior.

## Contract boundaries

- Quantities come only from selected meal ingredient requirements. Incompatible/unverified units are marked “Quantity needs confirmation.”
- Pantry is deducted for compatible units only.
- Shopping-list edits currently support **purchased status and note**, not quantity editing.
- Purchases **never deduct pantry stock**. Quantity editing and automatic pantry deduction are future enhancements and should not be silently added.
- Replacing a weekly slot recomputes grocery requirements and increments plan version; shopping-list GET detects stale fingerprints and requires refresh before item updates.

## Validation plan

Use the fictional five-member vegetarian household to assert: seven days, Tuesday fasting, two weekday office tiffins, paneer preference, child/senior safety, vegetarian ingredients, pantry deficit math, owner isolation, save/reopen, replacement-driven stale list detection, and preserved purchased/note state after refresh.

## Release blockers

1. Run the complete authenticated weekly endpoint → shopping-list refresh/reload test.
2. Connect planner success to automatic refresh or clearly label the shopping-list action.
3. Capture a reliable isolated build exit code.
4. Do not enable external AI until provider, privacy, cost, cache and safety approval is complete.
