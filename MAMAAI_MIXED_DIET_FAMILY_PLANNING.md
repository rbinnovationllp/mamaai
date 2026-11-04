# Mixed-diet family planning design

## Rule model

The correct decision order is: deterministic safety/allergy limits; explicit current customer instruction; explicit individual fast/festival rule; explicit individual weekday rule; household logistics; then preferences, budget, region and variety. No rule may be inferred from identity, place or demographic tendency.

## Proposed additive member fields (approval required)

- `animalFoodPermissions`: `{ eggs, fishSeafood, poultry, redMeat, pork, beef }` as explicit allow/avoid values.
- `restrictedWeekdays`: member-specific day and permitted categories.
- `fastingProfile`: style, permitted ingredients, grain/onion/garlic rules and dates selected by customer.
- `festivalOverrides`: customer-confirmed calendar event IDs/date range only.
- `tiffinConstraints`: packability, storage/reheat and available time.

## Planning output

Produce a shared vegetarian base where viable, with separately identified optional proteins only for members who explicitly permit them. Ingredient and grocery lines must retain category/permission provenance so a vegetarian member never receives egg/meat by substitution.

## Fictional acceptance scenario

Father vegetarian Tuesday fast; mother vegetarian; son allows non-veg except Tuesday/Thursday; daughter-in-law egg-only and paneer preference; child vegetarian. Expected: shared vegetarian base, no egg/meat in vegetarian servings, permitted protein variation for son only, tiffin-safe weekday slots, fasting-safe father alternative, consolidated groceries with separately labelled animal-food lines.

## Current limitation

Current profile data cannot faithfully represent this scenario because fish, poultry and other meats are not separately permissioned. It is a design and approval item, not a passed product capability.
