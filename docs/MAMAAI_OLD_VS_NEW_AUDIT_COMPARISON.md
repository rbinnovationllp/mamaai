# MAMAAI Old vs New Audit Comparison

Date: 23 October 2026

## Source limitation

The 18 October product review was represented by existing Phase 2 reports. The cited 22–23 October executive audit PDF was unavailable, so this table compares the owner-provided findings with repository evidence rather than claiming a complete 13-versus-27 item reconciliation.

| Earlier-review theme | Executive-audit theme | Actual evidence | Result | Regression evidence |
|---|---|---|---|---|
| Food safety and AI output | Ask MAMA reliability and safe recipes | Structured response validation and deterministic safety gates exist in `lib/ai` and `app/api/ask-mama/route.ts`. | Previously remediated locally; real-provider verification pending. | Safety tests passed. |
| Session/authentication | Account persistence and household isolation | Durable sessions and verified identity routes exist. External durable-store test remains pending. | Partial. | Session isolation tests passed. |
| Subscription navigation/pricing | Checkout identity and plan access | Authenticated Razorpay routes and direct subscription browser tests exist. | Partial. | 8 local browser tests passed. |
| Judge/demo access | Unauthorized evaluator access | Public bypass branch and UI were present. | Corrected locally. | New security assertion passed. |
| Footer/legal trust links | Broken Help route, policy accuracy | Footer linked a missing `/help`; legal pages exist. | Help corrected; legal decisions pending. | Help-route assertion and browser journey passed. |
| Export/delete disclosure | Functional privacy rights | Export API is account-scoped; deletion is only an honest preflight. | Export partial; deletion open. | Security tests passed. |
| Mobile responsiveness | Mobile navigation and Ask MAMA accessibility | Fixed bottom navigation and launcher hierarchy inspected. | Not reproduced locally. | Passed at 360/390/768/1440. |

## Repeated themes

Food safety, customer isolation, subscription trust, mobile usability and truthful policy claims recur across the available evidence. Differences in audit scoring cannot establish regression by themselves.

## Contradictions and risks

- Historical documentation still describes hackathon judge access, while executable public subscription bypass code has now been removed. Documentation must be revised before release.
- `PROJECT_STATUS.md` includes legacy OpenAI/RevenueCat and pricing statements that do not fully match current Gemini/Razorpay source. This is a P1 documentation-quality issue.
- Several repository modules still have production-table fallback values; Preview protection needs isolated environment variables and a full fallback audit before cloud testing.
