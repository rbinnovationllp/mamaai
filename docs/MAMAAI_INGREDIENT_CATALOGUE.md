# Daily Planner Ingredient Catalogue

The initial catalogue is centralised in `lib/shared/daily-meal-planner.ts`. It contains vegetables; pulses; rice, flour and grains; masalas; dairy; salad ingredients; cooking essentials; fruit/snacks; eggs/non-vegetarian foods; and leftovers/ready food.

It uses stable canonical labels such as `Potato / Aloo` and `Moong Dal`. The UI supports a customer-entered “other ingredients” list; planners must never assume common ingredients are present. Hindi and Kannada UI headings are included; canonical identifiers avoid language-specific duplicate records. Broader synonym search and image/voice ingredient input are planned extensions and must remain review-first.
