# MAMA AI Test Plan

## Critical Hackathon Flow

1. Create family.
2. Add members.
3. Capture age, height, weight, preferences, allergies, health context.
4. Calculate nutrition context.
5. Generate one common family meal.
6. Display member-specific modifications.
7. Display member-specific portions.
8. Add fruits and hydration.
9. Replace meal.
10. Recalculate grocery list.
11. Show MAMA Family Table.
12. Collect feedback.

## Unit Tests

- Subscription member limits.
- BMI and nutrition context calculation.
- Structured AI output validation.
- Allergy exclusion.
- Doctor restriction exclusion.
- Grocery recalculation after replacement.
- Family satisfaction score bounds.

## Integration Tests

- `POST /api/families` creates family and members.
- `POST /api/meal-plans` returns validated nutrition context and meal plan.
- `POST /api/meal-plans/{mealPlanId}/replace` changes meal and grocery list.
- Demo endpoint returns fictional data only.

## UI Tests

- Family form works on mobile width.
- Demo family loads.
- Generated common meal is visible.
- Each family member has modification and portion guidance.
- Fruits/hydration are visible.
- Replace meal updates grocery items.
- Disclaimer appears.
- Error and loading states are visible.

## Security Tests

- No real secrets in repository.
- API rejects invalid payloads.
- Allergy/prohibited ingredient rejection works.
- Admin health data access requires authorized role.
- Guest mode cannot access long-term saved history in production mode.

## Release Gate

Do not mark "Hackathon MVP Ready" until:

- Production build succeeds.
- TypeScript has no blocking errors.
- Core APIs work.
- Core mobile UI works.
- AI fallback works without a key.
- OpenAI path is contract-ready.
- Grocery update works after replacement.
- README setup is accurate.
