# Food knowledge-base gap analysis

## Existing assets

`lib/food/indian-food-database.ts` contains regional Indian candidate recipes with ingredients, category, preparation time, estimated costs and text seasonal suitability. `AIService` has deterministic meal candidates, serving/quantity logic and localization. Safety tests cover known allergens, fasting/Jain constraints, child hazards and multilingual aliases.

## Gaps

| Data area | Current state | Gap / recommendation |
| --- | --- | --- |
| Recipe yields | Structured ingredient strings exist | Require source-backed yield and household-unit conversion per recipe before treating quantities as grocery-grade. |
| Nutrition | Heuristic balance and safety checks | Add licensed/authoritative nutrient-source references; show estimates, never clinical precision. |
| Seasonality | Text labels such as “All season” | Add dated state/market source, confidence and last-reviewed fields. |
| Cost | Embedded estimates | Add market/source/date/currency metadata; retain “estimate” labeling. |
| Allergens/substitutions | Rule matching and candidate data | Add explicit ingredient taxonomy, derivatives and evidence-backed substitutions. |
| Life stages | Child/senior safety checks | Add review-owned suitability flags; no therapeutic claims. |
| Tiffin | Attendance/role logic | Add recipe-level packability, hold time and reheating constraints. |
| Regional provenance | Region/state/cuisine tags | Add recipe source, reviewer, attribution/licence and last review date. |

## Required recipe record additions

`recipeId`, provenance/source URL or licensed source ID, reviewer, reviewedAt, yieldServings, ingredient canonical IDs, quantity confidence, compatible-unit family, allergen tags, dietary tags, tiffin handling notes, seasonality source/date/confidence, cost source/date/range, and safety-review version.

No external nutrition or seasonal source was fetched during this audit. Adding those data feeds or making clinical/nutrition claims requires owner approval and subject-matter review.

## Third-party dietary research update

The reviewed PDF supports using individual, consented rules and mixed-household planning as a product direction. Its statistical, market and weekday claims are not imported as product facts because citations need independent primary-source verification. See `MAMAAI_INDIA_DIETARY_RESEARCH_REVIEW.md` for classifications and `MAMAAI_MIXED_DIET_FAMILY_PLANNING.md` for the additive schema/design proposal.
