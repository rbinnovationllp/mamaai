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
12. Adjust meal-wise family strength, fasting status, and guests.
13. Verify ingredient quantities and grocery totals update.
14. Confirm country of residence and preferred food culture/cuisine influence the plan.
15. Confirm detailed meal plan shows 15-day retention notice and export action.
16. Collect feedback.

## Judge/Demo Access Tests

- Home page shows a prominent Try Demo / Judge Access option on mobile and desktop.
- Judge Access loads without registration, login, payment, or subscription setup.
- Judge Access uses only fictional demo family profiles.
- Judge can see multiple family members immediately.
- Judge can see one common family meal and member-specific adjustments.
- Judge can see fruits, hydration, grocery list, and disclaimer.
- Judge can click Replace Meal and see the grocery list update.
- Judge can select meal attendance, mark a fictional member as fasting, add guests, and see ingredient quantities update.
- Judge can choose High Tea / Evening Snack and receive a suitable high-tea meal.
- Judge can submit feedback.
- Judge mode payment bypass does not alter normal subscription member-limit checks.

## Unit Tests

- Subscription member limits.
- BMI and nutrition context calculation.
- Structured AI output validation.
- Allergy exclusion.
- Food allergy and ingredient allergy hard-restriction checks.
- Excluded ingredient and dietary restriction checks.
- Food dislike and disliked-meal individual modification checks.
- Soft dislike preference-resolution options are generated without treating dislike as an allergy.
- Doctor restriction exclusion.
- Grocery recalculation after replacement.
- Deterministic ingredient quantity scaling from meal attendance.
- Fasting members are excluded from normal meal quantities.
- Fasting-aware suggestions use allowed foods and avoided foods from member profile.
- High-tea meal slot returns a high-tea style meal, not a lunch/dinner plate.
- Meal plans include `expiresAt` and retention metadata.
- Expired detailed meal plans can be removed without deleting safety/personalization profiles.
- Country of residence and cuisine preferences are stored separately.
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
- Meal-wise strength controls work on mobile.
- Fasting toggle creates fasting-aware recommendations.
- Guest count changes displayed ingredient requirements and grocery quantities.
- High Tea and Evening Snack options are selectable.
- Country of residence is editable in custom family creation.
- Preferred food culture/cuisine is editable in custom family creation.
- Retention notice appears with Download / Export / Save option.
- View Recipe / How to Cook opens for every generated common meal.
- Recipe modal shows ingredients, quantities, servings, steps, prep/cook time, difficulty, nutrition, cost, adjustments, alternatives, and video recommendation metadata.
- Watch How to Cook returns official YouTube API results when `YOUTUBE_API_KEY` is configured.
- Watch How to Cook returns a safe third-party YouTube search fallback when `YOUTUBE_API_KEY` is absent.
- External video results are labeled as third-party content, not medically or nutritionally verified by MAMA AI.
- Preference-resolution card shows the three choices for separate alternative, one common meal, and two compatible options when a soft dislike affects only part of the family.
- Disclaimer appears.
- Error and loading states are visible.

## Security Tests

- No real secrets in repository.
- API rejects invalid payloads.
- Allergy/prohibited ingredient rejection works.
- Admin health data access requires authorized role.
- Guest mode cannot access long-term saved history in production mode.
- Judge/Demo Access cannot expose real personal or medical data.
- RevenueCat webhook secrets are not exposed to the frontend.
- AWS credentials and table/bucket names are server-side only except safe public app URL.
- DynamoDB TTL never targets allergy, restriction, fasting, subscription, or account records.
- S3 exports are private and should be served by signed URL in production.

## Release Gate

Do not mark "Hackathon MVP Ready" until:

- Production build succeeds.
- TypeScript has no blocking errors.
- Core APIs work.
- Core mobile UI works.
- AI fallback works without a key.
- OpenAI path is contract-ready.
- Grocery update works after replacement.
- Meal-wise ingredient quantities and fasting requirements work.
- README setup is accurate.
