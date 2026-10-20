# Phase 1 persistence matrix

| Entity | Storage classification | Observed path | Risk |
|---|---|---|---|
| Customer account/family profile | PARTIALLY IMPLEMENTED | UI localStorage -> customer API -> CustomerProfileRepository/DynamoDB | fallback/local data can diverge |
| Members, allergies, restrictions | PARTIALLY IMPLEMENTED | profile UI -> FamilyService -> FamilyMealRepository/DynamoDB; in-memory fallback | loss or ownership verification gap |
| Meal plans/weekly plans/history | PARTIALLY IMPLEMENTED | planner -> MealPlanningService -> FamilyMealRepository; also localStorage/in-memory | loss and retention enforcement gap |
| Pantry/grocery | PARTIALLY IMPLEMENTED | UI localStorage -> PantryRepository/DynamoDB where available | divergence/loss risk |
| Entitlements/payments | PARTIALLY IMPLEMENTED | Razorpay service -> SubscriptionRepository/DynamoDB | provider/staging verification required |
| Preferences/culture/attendance/learning | DEMO/LOCAL STORAGE | browser localStorage; some repository support | device-bound, non-durable |
| Analytics | DEMO/IN-MEMORY | client event -> analytics service/store | not durable |
| Retention records | PARTIALLY IMPLEMENTED | retention service removes in-memory plans; TTL documented | actual DynamoDB job unverified |

No production records were read or changed.
