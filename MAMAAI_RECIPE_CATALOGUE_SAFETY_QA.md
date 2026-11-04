# Recipe catalogue safety QA

## 2 November 2026 — local implementation evidence

### Catalogue audit method

The regional catalogue currently has **35** stable recipe records. A deterministic audit now inspects every record's existing ingredient lines, classifies known egg, animal, onion, garlic and root-vegetable aliases, and marks aggregate/unresolved ingredient lines as ambiguous. Examples include `mixed vegetables`, `seasonal sabzi`, `palya`, `chutney`, `masala`, `spice base`, `seasoning`, `selected protein`, and generic salad/vegetable-side labels.

No missing composition, quantity, allergen, nutrition or source was invented. Records with any such unresolved line are deliberately not eligible for a member with a strict ingredient rule, allergy, Jain diet, or an explicit denied permission.

### Selection enforcement

`indianFoodCandidatesFor` now accepts planning members and filters every record before regional/routine ranking. It rejects known ingredient conflicts for vegetarian, vegan, Jain and eggetarian diets, known denied member permissions, and recorded ingredient restrictions/allergies. The weekly planner supplies its recovered members to this selection path. The existing final plan validator remains a second gate before persistence.

### Result and limitations

This is a conservative, backward-compatible safety improvement. It does **not** certify all 35 recipes as complete; aggregate records remain unavailable to strict restrictions. The current weekly-plan representation has not been extended with per-member recipe alternatives, so mixed-diet individual variations and their grocery arithmetic are not passed. No fictional database/browser test was executed in this pass, and no external service was used.

### Verification

`npm test`: **121 passed, 0 failed, 0 skipped**. TypeScript completed without errors after the test command. No production build was attempted, consistent with the existing bounded page-data-collection blocker.

### Release recommendation

**NO-GO.** Complete, source-reviewed recipe ingredient decomposition and a separately approved backward-compatible representation for individual meal variations are required before claiming a full mixed-diet customer journey or grocery correctness.
