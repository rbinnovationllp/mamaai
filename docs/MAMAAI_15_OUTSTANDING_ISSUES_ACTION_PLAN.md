# MAMAAI — 15 outstanding issues action plan

Date: 23 October 2026

This plan reconciles the current source with `audit-input/MAMAAI_QA_Audit.zip`. It does not repeat the 12 fully resolved issues. No cloud or production action is included.

## Partially resolved

| ID | Consultant problem | Completed work | Still missing | Local-only? | External verification | RBIL approval | Next action / priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ISS-002 | Checkout could take payment without a mapped customer. | Server-side Razorpay routes require verified identity; plan tier is resolved server-side; webhook idempotency exists. | Actual Razorpay test checkout, webhook signature and durable record mapping. | No. | Razorpay + isolated DynamoDB/Vercel. | Yes, test credentials/webhook target. | **P0:** run a controlled test-mode transaction only after Preview approval. |
| ISS-003 | Ask MAMA crashed on ordinary culinary queries. | Missing/invalid Gemini returns controlled fail-closed responses; structured meal outputs are validated. | Real provider latency/error/retry behavior and UI behavior under real response failure. Curated meal fallback is intentionally not used for food advice because it could bypass safety validation. | Mock coverage only. | Gemini + isolated Preview. | Yes, paid/free-tier usage approval. | **P0:** run bounded synthetic prompts after Preview launch. |
| ISS-008 | Planner looped after profile completion. | Family-profile save API, session issuance and local planner protections exist. | Full persisted profile → reload → planner generation test against durable storage. | Partly. | Isolated DynamoDB/Vercel. | Yes, synthetic records. | **P1:** test this first after Preview provisioning. |
| ISS-014 | Family profile was localStorage-only. | Authenticated repository and `/api/customer/family-profile` save path exist. | Actual registration/login, durable storage proof, cross-device synchronization; local fallback remains. | No. | DynamoDB/Vercel. | Yes. | **P1:** finish ISS-001 lifecycle, then test two synthetic accounts. |
| ISS-023 | Pet-food benefits conflicted with safety disclaimer. | Visible subscription copy now states pet planning is unavailable; pet prompts are blocked. | Remove/rewrite legacy pet assertions in knowledge-base/product copy and conduct a complete capability inventory. | Yes. | None required for copy audit. | No policy decision if only removing unsupported claims. | **P2:** safe local copy audit; do not activate pet features. |

## Confirmed unresolved

| ID | Consultant problem | Completed work | Still missing | Local-only? | External verification | RBIL approval | Next action / priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ISS-001 | No customer authentication or registration routes. | Durable opaque-session primitives, verified protected routes and cookie controls exist. | Login, signup, recovery, identity proofing, rate-limited registration UX and durable identity store. | Not safely complete without durable Preview store. | DynamoDB/Vercel; email/OTP if chosen. | Yes: authentication method and communications provider. | **P0:** RBIL choose password, OTP, OAuth, or staged invite-only identity design. |
| ISS-005 | Public export page did not deliver account data. | Verified-user JSON export route and repository aggregation exist. | Authentication UX, complete cloud inventory/GSI1, secure delivery decision, real export verification. | No. | DynamoDB/Vercel. | Yes: delivery format, retention and identity-verification policy. | **P0:** enable only after ISS-001 and GSI1 tests. |
| ISS-006 | Public deletion page did not erase accounts. | Authenticated preflight exists and deletion is intentionally disabled. | Approved retention rules, confirmation factor, session bulk-revocation lookup, deletion worker/audit process. | Design work only. | DynamoDB/Vercel; email/OTP if selected. | Yes: legal retention and deletion policy. | **P0:** keep disabled until policy and schema are approved. |
| ISS-015 | Pantry was device-local only. | Authenticated Pantry API/repository exists; UI attempts sync and reports fallback. | User lifecycle, durable writes, data migration/reconciliation and cross-device test. | No. | DynamoDB/Vercel. | Yes for synthetic-data test. | **P1:** validate after ISS-001/Preview; do not claim sync before then. |
| ISS-019 | Every route used the same title. | Root metadata is valid. | Per-route Next.js `metadata`/`generateMetadata` values. | Yes. | Browser/SEO check only. | No. | **P2:** local metadata batch. |
| ISS-020 | Every route used the same description. | Root metadata is valid. | Per-route descriptions. | Yes. | Browser/SEO check only. | No. | **P2:** implement alongside ISS-019. |
| ISS-026 | Mobile dock uses Unicode glyphs. | Dock is functional, horizontal and labeled. | Approved SVG icon component set and visual/device review. | Yes. | Local Playwright/device check. | No. | **P2:** replace in a focused design batch. |

## Awaiting RBIL legal/privacy approval

| ID | Consultant problem | Completed work | Still missing / question for RBIL | Recommended options | Priority |
| --- | --- | --- | --- | --- | --- |
| ISS-012 | Refund policy stated rules were unapproved while checkout existed. | Policy makes no invented refund promise; payment remains outside this phase. | What refund window, cancellation timing, taxes, partial-period handling, support channel and Razorpay dispute process are approved? | (A) keep payments disabled until counsel-approved policy; **recommended**. (B) approve a specific written policy and publish it before enabling checkout. | P1 |
| ISS-013 | Terms described themselves as drafts. | Draft status is truthful. | Who is the contracting entity, governing law, service eligibility, subscription/cancellation terms, liability limits and acceptance mechanism? | (A) retain draft label and keep commercial launch blocked; **recommended**. (B) provide counsel-approved final terms for insertion. | P1 |
| ISS-024 | Privacy notice contemplated consent but no consent control existed. | Privacy text avoids claiming consent is collected. | Which analytics are essential, which require consent, retention period, languages, withdrawal behavior and legal basis apply? | (A) disable non-essential analytics until policy is approved; **recommended**. (B) approve a consent model, then implement a bilingual preference control. | P2 |

## Safe local P0/P1 implementation assessment

No additional P0/P1 correction was applied in this phase. The unresolved P0/P1 work requires durable isolated persistence, external provider exercise, or RBIL policy decisions. A local-only login/export/deletion façade would be misleading and would weaken the existing fail-closed posture.

## Status after this work

All **15 remain not fully resolved**: 5 partial, 7 unresolved, 3 awaiting RBIL approval. Exact blockers are: isolated DynamoDB with GSI1; a protected Preview deployment; approved authentication and account-recovery design; synthetic identity creation; Razorpay/Gemini controlled tests; and refund/terms/privacy/retention decisions.
