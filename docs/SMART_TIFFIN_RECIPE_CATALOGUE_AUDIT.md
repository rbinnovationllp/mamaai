# Smart Tiffin recipe catalogue audit

Catalogue version: `draft-v1`  
Date: 2026-10-26

## Validation rule

Only a recipe with a reviewed serving count plus quantity and unit for every grocery-relevant ingredient may be marked **VERIFIED** and selected into a weekly meal plan. The current curated catalogue has none. The named ingredients below are **draft specification fields**, not quantities.

| Recipe ID | Recipe | Servings | Ingredient quantities / units | Prep + cook | Status | Missing data |
|---|---|---:|---|---:|---|---|
| `paneer-sandwich` | Paneer vegetable sandwich | Not specified | bread, paneer, tomato, cucumber — quantities/units absent | 5 + 5 min | INCOMPLETE | servings, quantities, units, approved source |
| `roti-roll` | Paneer bhurji roti roll | Not specified | prepared roti, paneer, onion — quantities/units absent | 4 + 6 min | INCOMPLETE | servings, quantities, units, approved source |
| `curd-rice` | Curd rice with cucumber | Not specified | cooked rice, curd, cucumber — quantities/units absent | 5 + 0 min | INCOMPLETE | servings, quantities, units, approved source |
| `besan-chilla` | Vegetable besan chilla | Not specified | besan, onion, tomato — quantities/units absent | 4 + 8 min | INCOMPLETE | servings, quantities, units, approved source |
| `idli-stir-fry` | Idli stir-fry | Not specified | prepared idli, onion, tomato — quantities/units absent | 3 + 6 min | INCOMPLETE | servings, quantities, units, approved source |
| `vegetable-poha` | Vegetable poha | Not specified | poha, onion, peas — quantities/units absent | 5 + 8 min | INCOMPLETE | servings, quantities, units, approved source |

Counts: **VERIFIED 0, DRAFT 0, INCOMPLETE 6.**

## RBIL review template

For each recipe, RBIL must approve a source-backed specification containing: recipe ID and version; intended servings; ingredient name; numeric quantity; unit; whether any component must be pre-prepared; active prep/cook time; and any age, allergen, packing, or storage constraint. Until then, suggestions remain viewable/favouritable only and cannot replace a weekly plan slot or change grocery quantities.
