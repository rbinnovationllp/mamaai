# MAMAAI intelligent meal-planning architecture

## Current implementation: evidence-based assessment

MAMAAI currently uses a **deterministic, rules-and-catalogue planner**, not a live AI meal generator. `lib/ai/ai-service.ts` selects from coded meal candidates and the regional Indian food database; it produces portions, ingredients, alternatives, estimated costs, member customisations, safety warnings and grocery requirements. `WeeklyMealPlanningService` calls that same service for Monday–Sunday and persists a `WeeklyMealPlan`.

The word “AI” in `AIService` is therefore a product name, not evidence of an external model inference call. The actual external Gemini paths are Ask MAMA, meal-history extraction and `lib/geminiService.ts`; all are guarded by `GEMINI_API_KEY` or explicit preview safety behavior and were not activated for local QA.

| Capability | Status | Evidence |
| --- | --- | --- |
| Mandatory diet/allergy/restriction validation | Implemented and working | `SafetyValidationService` is applied before saved daily/weekly output. |
| Family ages, preferences, dislikes, tiffins, attendance | Implemented and working | Profile is transformed to `FamilyMember` records in `WeeklyMealPlanningService`. |
| Vegetarian/regional candidate selection | Implemented and working | `indian-food-database.ts`, regional matching and deterministic candidate selection. |
| Budget/cooking-habit context | Partially implemented | Preference becomes a generic daily budget (₹700) and low-cost flag; it is not a user-entered priced optimisation. |
| Pantry-aware grocery deficit | Implemented and working | Weekly aggregation normalizes compatible units and subtracts local pantry stock. |
| Pantry-aware meal selection | Partially implemented | Planner UI adjusts groceries; candidate ranking does not demonstrably optimise for pantry use. |
| Seasonal availability | Partially implemented | Catalogue has text seasonal suitability; no dated/local market availability dataset or filter is shown. |
| Medical/nutrition reasoning | Safety constrained, not clinical | Restrictions are validated; no therapeutic diet or clinical precision should be claimed. |
| Live contextual model reasoning | Requires external AI authorization | Gemini-capable paths exist but must stay disabled until approved. |

## Recommended hybrid architecture

1. **Profile compiler (deterministic):** normalize household, diet, allergens, fasting, life-stage flags, tiffin roles, budget, kitchen, pantry and locale into a minimal planning context.
2. **Safety gate (deterministic, first and last):** reject prohibited foods, unclear allergy conflicts, unsafe child food, unsupported medical claims and unverified quantities.
3. **Structured candidate/ranking layer:** query only recipes with sourced ingredient yields; score regional fit, seasonality confidence, pantry deficit, budget, prep time, variety and tiffin suitability. Store score reasons.
4. **Optional AI ranker/explainer:** only after explicit provider approval. Send minimized context and candidate IDs/attributes, never raw account exports. AI may rank or explain but cannot create ingredients, quantities, safety exemptions, or identity decisions.
5. **Validator and persistence:** deterministic validation, atomic weekly-plan save, grocery re-aggregation, owner-scoped shopping-list refresh.

### Why hybrid is recommended

| Model | Quality | Safety/reliability | Cost | Recommendation |
| --- | --- | --- | --- | --- |
| Deterministic only | Predictable but less flexible | Highest | Near-zero | Present fallback and safety baseline |
| Hybrid rules + optional AI | Better explanations/context | Strong if rules are authoritative | Bounded/cached | **Recommended** |
| Fully AI-generated | Flexible prose | Unsafe/unreliable quantities and constraints | Variable | Do not use for final food plan output |

## Provider control and cost design

- Provider interface: `rankCandidates(context, candidates)`, `explainRecommendation(plan)`; no direct recipe/grocery authoring API.
- Cache key: normalized family safety/profile revision + pantry revision + week + locale + candidate catalogue version; cache whole weekly plans and invalidate on relevant changes.
- Rate limits: one generation per household/week with explicit regenerate budget; per-user/provider spend cap and durable audit without prompts containing unnecessary personal data.
- Cost: calculate from approved provider input/output token prices at rollout; do not publish a numeric estimate before choosing model, locale prompt size and cache hit target.
- Fail closed: unavailable provider returns deterministic plan only when it passes the same validator, labelled “rules-based”; never present it as live AI.

## Implementation phases requiring owner approval

1. Data provenance and recipe-yield work.
2. Candidate scoring/reason taxonomy and deterministic weekly integration.
3. Optional provider adapter, cost guard, privacy review and explicit enablement.
4. Offline eval set of fictional households; human nutrition/safety review before production rollout.
