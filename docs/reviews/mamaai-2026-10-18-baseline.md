# MAMAAI baseline audit - 19 October 2026

## Scope and evidence

This baseline is a source review of the local repository, the existing public read-only QA results in `C:\Users\HP\rbil-testing`, and the independent product review dated 18 October 2026. It does not inspect production secrets, production data, deployed cloud configuration, or live payments. Findings use CONFIRMED, PARTIALLY IMPLEMENTED, NOT VERIFIED, and NOT APPLICABLE as required.

## Current architecture

- Frontend: Next.js 16.2.10, React 19.2.7, TypeScript, Tailwind.
- Backend: Next.js route handlers and services, Zod contracts, custom signed customer sessions and admin proxy guard.
- Data: DynamoDB repositories with an in-memory fallback/demo store. The README states family, meal-plan, pantry, parts of analytics, and full user identity are not yet durably production-connected.
- AI: Gemini libraries are installed; AI service, prompt module, structured schema and deterministic fallback exist. README describes live OpenAI/Gemini integrations as architecture-ready rather than required for Judge Access.
- Billing: Razorpay subscription, verification, webhook, idempotency and DynamoDB repository code exist; RevenueCat is integration-ready. Live configuration and provider results are NOT VERIFIED.
- Hosting: Vercel-ready Next.js configuration and Vercel Analytics dependency. Actual production/staging settings are NOT VERIFIED.

## Finding-by-finding baseline

| Review concern | Status | Evidence | Risk / action |
|---|---|---|---|
| Responsive header, mobile navigation, language support | PARTIALLY IMPLEMENTED | Navigation and mobile-nav components exist; prior Playwright checks found no 375px overflow and language selector behaviour on the public site. | Audit 320-1440px layouts in repository tests; do not assume all breakpoints pass. |
| Brand consistency | PARTIALLY IMPLEMENTED | Footer uses MAMAAI; AGENTS and README retain MAMA AI identifiers. | Inventory product-visible strings before changing branding. |
| Pricing clarity and routing | PARTIALLY IMPLEMENTED | Subscription UI and Razorpay flow code exist; README and source list inconsistent prices/feature claims in places. | Reconcile public display, provider plans and entitlements before a pricing proposal. No price changes. |
| Safety validation | PARTIALLY IMPLEMENTED | Zod schema and `SafetyValidationService` check explicit restriction names and diet conflicts. | Current matching is string-based; aliases, derivatives, infant hazards, diabetes, fasting and pet toxic-food safeguards require code/test verification. |
| Pet safety | PARTIALLY IMPLEMENTED | Product knowledge base mentions toxic foods; subscription UI advertises pet planning. | Gate personalized pet recommendations until species-specific deterministic validation is verified. |
| Medical and prompt safety | NOT VERIFIED | Product documentation has non-medical intent; no complete adversarial test suite was found in current baseline. | Add refusal and prompt-injection regression cases before launch. |
| Authentication/session handling | PARTIALLY IMPLEMENTED | `requireUser`, signed headers, session cookies and admin proxy guard exist. | Verify expiry, logout, recovery and production configuration; Firefox initialization errors from public QA remain open. |
| Family data isolation | NOT VERIFIED | DynamoDB repositories use user/family keys, but two-account staging isolation tests were not found or run. | Test with isolated staging accounts before launch. |
| Payments/entitlements | PARTIALLY IMPLEMENTED | Razorpay verify/webhook/idempotency code and repository interfaces exist. | Do not run live payments; verify test-mode webhooks and ownership in staging. |
| Privacy, terms, refund, deletion/export pages | PARTIALLY IMPLEMENTED | Footer links terms/privacy/disclaimer; routes, refund policy, deletion and export user flows require verification. | Review legal text against actual processing and verified company details. |
| Retention | PARTIALLY IMPLEMENTED | 15-day retention references exist in API/AI documentation. | Do not alter policy; verify jobs, TTL and actual deletion behaviour. |
| Analytics and cost controls | PARTIALLY IMPLEMENTED | Vercel Analytics and custom privacy-conscious event paths exist; README calls analytics persistence incomplete. | Audit consent, retention, per-user AI limits and actual provider cost data. |
| Tests and delivery controls | PARTIALLY IMPLEMENTED | Node tests and lint/build scripts exist; no full safety/authorization/e2e suite was verified in this baseline. | Run local validation after changes and use staging for integration tests. |

## Baseline conclusion

The repository contains more production-oriented safeguards than the external review could observe, but the source and its own README confirm that the application remains a hackathon/demo build with incomplete durable persistence, identity, analytics and production integration. It must not be declared production-ready from this audit.

## Next implementation sequence

1. Create a remediation checklist with source-level evidence and explicit acceptance tests.
2. Implement low-risk, non-pricing UI and legal-link corrections in an isolated working state.
3. Strengthen deterministic safety validation and add the mandatory safety regressions.
4. Audit authorization, data isolation, API rate limiting, retention and dependency vulnerabilities in staging.
5. Prepare pricing and launch documents; request approval before any pricing, retention, pet, migration or deployment action.
