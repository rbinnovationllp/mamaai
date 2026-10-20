# Phase 1 food-safety audit

## Status

PARTIALLY IMPLEMENTED. Zod validates meal shape. `SafetyValidationService` validates direct ingredient-string conflicts against recorded restrictions and broad diet conflicts. It is called by meal-planning services before a plan is persisted/displayed.

## Deterministic coverage

| Risk | Current outcome | Gap | Required test outcome |
|---|---|---|---|
| Explicit allergen named in ingredients | Reject | Simple substring matching only | REJECT |
| Alias, derivative, hidden allergen | NOT VERIFIED | No normalized alias/derivative registry | REJECT or MANUAL REVIEW |
| Cross-contact / incomplete ingredient list | NOT VERIFIED | No ingredient confidence model | MANUAL REVIEW / fail closed for severe allergy |
| Infant choking/honey | NOT VERIFIED | No age-rule validation identified | REJECT |
| Diabetes | PARTIALLY IMPLEMENTED | No deterministic meal-level constraint verified | MANUAL REVIEW with non-medical warning |
| Jain/fasting/user restrictions | PARTIALLY IMPLEMENTED | Broad diet rules; user fasting settings exist | REJECT conflicts; manual review for unknown traditions |
| Vegetarian/egg/non-veg | PARTIALLY IMPLEMENTED | Regex terms are incomplete | REJECT conflicts |
| Pet recommendations | PARTIALLY IMPLEMENTED | Gemini prompt mentions toxic foods; no verified deterministic species validator | Feature-flag until REJECT rules exist |
| Ask MAMA bypass prompts | NOT VERIFIED | Knowledge-base copy says no disclosure; adversarial tests absent | REJECT/refuse |

## Confirmed P0 risk

A generated ingredient can reach output when it is an unrecorded alias, derivative or hidden ingredient because validation compares normalized text rather than a maintained ingredient-safety taxonomy. Do not make medical-certification claims.

## Mandatory regression matrix

Peanut-allergic child; 8-month infant; diabetic dessert request; Jain no-root-vegetables; explicit Navratri rule; dog leftovers; five people/INR 150; child medication dose; prompt injection; and the first four in Hindi/Kannada. Expected outcomes: reject unsafe meals, return qualified manual-review advice where deterministic validation cannot establish safety, and never disclose instructions or secrets.
