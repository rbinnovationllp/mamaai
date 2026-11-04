# MAMAAI Family+ Phase B foundation

## Scope completed locally
This batch implements only authenticated, owner-scoped pet-profile persistence for dogs and cats. It does not implement pet-food recommendations, portions, nutritional calculations, climate, retailer discovery, product availability, shopping lists, payments, or user-interface access. The homepage Family+ card remains an unavailable-feature dialog.

## Architecture decisions
- Family+ is the existing `family_plus` entitlement at INR 999/month. `premium` remains INR 599/month and is not eligible.
- A subscription must be `active` or `trialing`; expired, cancelled, missing, Starter, and Premium records fail with `403 FAMILY_PLUS_REQUIRED`.
- Profiles use `PK=USER#<userId>`, `SK=PET_PROFILE#<petId>`. Every read, update, and delete derives ownership from the verified session; no owner ID is accepted from client input.
- Supported species are only dogs and cats. The contract requires birth date or approximate age, positive weight, activity, indoor/outdoor setting, diet context, and bounded safety text.
- The proposed default cap is five pet profiles per Family+ account. `MAMA_AI_FAMILY_PLUS_PET_LIMIT` may set an integer from 1 to 10. RBIL must approve the production cap before public enablement.
- Pet medical/veterinary instructions are sensitive information. No new staff view was created; retention, export, deletion, and staff-access rules require separate approval.

## API surface
- `GET /api/family-plus/pets`
- `POST /api/family-plus/pets`
- `GET /api/family-plus/pets/:petId`
- `PUT /api/family-plus/pets/:petId`
- `DELETE /api/family-plus/pets/:petId`

All routes require a verified user and active/trialing `family_plus`, then use the centralized DynamoDB client. Isolated deployments remain subject to OIDC and fail-closed table configuration.

## Nutrition safety boundary
No nutrition recommendation engine is enabled. A later engine needs a separate versioned veterinary evidence base, source provenance, species-specific toxicity and contraindication rules, confidence labels, and veterinary-review escalation for therapeutic diets, complex conditions, or insufficient data. Human-food safety rules must not be reused.

## Preserved roadmap
1. Pet pantry: product/variant, life-stage suitability, quantity, expiry, storage, and pet-safety classification.
2. Feeding plans: structured, evidence-linked schedules with persistence and safety validation; no unverified homemade complete-diet or portion claims.
3. Climate: optional coarse locality and reliable weather data for hydration/storage guidance only, never automatic portion changes.
4. Retailers: consented provider integration, manual locality fallback, clearly labelled unverified stock, and no invented availability or price.
5. Shopping lists only after product provenance and pet-pantry safety validation.

## Synthetic test arrangement
Use synthetic users with mocked subscription records and mocked DynamoDB commands. Cover non-Family+ and expired rejection, cross-user IDs, invalid species, missing age, invalid weight, updates/deletes, and the pet cap. No real customer, payment, or cloud action is required.

## Required approval before the next stage
RBIL must approve the production cap, veterinary evidence sources/licensing, medical-data policy, and first feeding-plan scope. Weather, retailer, product, Gemini, and payment integrations each need separate approval.
