# India dietary research review

## Source status

The reviewed five-page PDF is a third-party/internal synthesis dated 1 November 2026. It cites NFHS, Pew, ICMR-NIN, ICAR, government material, commercial market reports and media summaries, but does not provide primary-source links, table identifiers, raw datasets or a bibliography sufficient to independently verify each number. It must not be treated as a production nutrition or behaviour dataset.

| Finding group | Classification | Product use |
| --- | --- | --- |
| NFHS/Pew diet-frequency and regional variation claims | Requires independent verification | Optional research context only; never infer individual diet. |
| ICMR-NIN food-safety/dietary guidance summary | Requires independent verification | Use only after primary guideline review and clinical/nutrition review. |
| Festival, fasting, weekday and gender patterns | Cultural/behavioural tendency | Ask and store explicit customer choices; never apply as a default. |
| Tuesday/Sunday non-veg rhythm | Lower-confidence assumption | Do not encode as an automatic restriction. |
| Market size, delivery orders and price/demand figures | Research-supported recommendation / requires verification | Product strategy only, not meal eligibility. |
| Mixed household, separate protein and member rule scenarios | Research-supported recommendation | Aligns with safe product design after explicit consent. |
| Training blueprint rule priority | Research-supported recommendation | Medical/safety and explicit customer instructions should remain authoritative. |

## Safe takeaways

- Model diet and restriction per member, not by gender, religion, name, geography or population average.
- Treat eggs, fish/seafood, poultry, red meat and other meat permissions as separate explicit choices.
- Festival/fast dates require an approved regional calendar source; customer confirmation is required before applying a festival rule.
- Medical conditions, pregnancy, persistent fatigue and prolonged fasting require escalation, not therapeutic advice.
- Store only consented dietary context, allow editing/deletion, and do not send it to a future provider unless necessary and approved.

## Existing-code audit

| Feature | Status |
| --- | --- |
| Vegetarian, vegan, eggetarian, non-vegetarian, semi-vegetarian | Implemented in family schema/candidate logic |
| Jain | Partial: safety taxonomy references Jain restrictions but family preference enum lacks a first-class Jain value |
| Pescatarian / explicit fish-only | Missing first-class profile permission |
| Mixed household/member rules | Partial: member preferences exist; distinct egg/fish/poultry permissions are not modeled |
| Restricted weekdays and fasting | Partial: attendance and free-text doctor restrictions exist; no structured per-member weekday restriction model |
| Festivals/regional calendar | Missing external-calendar integration by design |
| Allergies/ingredient exclusions | Implemented deterministic safety validation |
| Regional/seasonal preferences | Partial: catalogue tags/text; no verified local seasonal dataset |

## Approval requirement

Independent verification of cited sources, a calendar provider, nutrition provenance, new dietary schema fields and non-vegetarian catalogue expansion are substantial data/model changes. They require owner approval before implementation.
