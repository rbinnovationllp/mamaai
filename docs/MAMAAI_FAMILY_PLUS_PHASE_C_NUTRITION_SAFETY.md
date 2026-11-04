# Family+ Phase C nutrition safety

## Evidence and licensing
The rule metadata records source, version/publication category, species, status, and review date. Public guidance may inform screening: [WSAVA Global Nutrition Guidelines](https://wsava.org/global-guidelines/global-nutrition-guidelines/), [FEDIAF 2025 nutritional guidelines](https://europeanpetfood.org/self-regulation/nutritional-guidelines/), and [ASPCA Poison Control](https://www.aspca.org/pet-care/aspca-poison-control). These sources do not authorize copying proprietary nutrient databases. Manufacturer labels are only accepted as product-specific evidence after review; commercial catalogues, paid toxicology databases, and detailed nutrient tables require licence/permission review.

## Active deterministic rules
Known dog/cat allium and xylitol/birch-sugar hazards block. Cat lily exposure blocks. Unknown household foods return `insufficient_information`; they are never safe or complete diets. Product classification requires verified source status, species, life stage, allergy compatibility, complete-food declaration, and feeding-guide reference. Medical conditions, veterinary instructions, or veterinary diets return `veterinary_review_required`. The engine generates no calories, portions, recipes, or medical advice.

## Future interfaces
Climate and retailer contracts exist without network calls. Climate only supports storage/hydration context. Retailer availability can only be `verified` with a provider source; otherwise it is explicitly `not_verified`.

## Data protection proposal
Minimize veterinary text; encrypt at rest through DynamoDB, use owner-derived access paths, and log only staff action metadata when a future reviewer workflow is approved. Pet data should appear in authenticated export/delete inventories. Account closure must revoke sessions and then follow an RBIL-approved retention schedule; irreversible automated deletion is not enabled.

## Blockers
No veterinary expert review, licensed nutrient/product catalogue, manufacturer verification process, product data pipeline, pet pantry, feeding-plan persistence, weather provider, retailer provider, or authenticated cloud integration has been approved/tested. Family+ must remain unavailable in the UI.
