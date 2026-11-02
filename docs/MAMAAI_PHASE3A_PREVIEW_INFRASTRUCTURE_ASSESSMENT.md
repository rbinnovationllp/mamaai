# MAMAAI Phase 3A — Preview Infrastructure Assessment

Date: 23 October 2026

## Scope and evidence boundary

This is a local, read-only assessment. No AWS, Vercel, DNS, payment, Gemini, or production-data operation was performed. Cloud findings marked **owner-provided** came from the earlier AWS Console and Vercel CLI output supplied in this workstream; they were not revalidated with cloud credentials in this phase.

## Current architecture observed in source

| Area | Observed implementation | Confidence |
|---|---|---|
| Web runtime | Next.js 16 App Router with API route handlers | Confirmed locally |
| Hosting link | `.vercel/repo.json` links this checkout to Vercel project `mamaai` (`prj_9h5IlJQ0tXf6rI3ckmWd26pFWa6h`) | Confirmed locally |
| Backend | Next.js route handlers, not a separate Lambda/Amplify backend in this repository | Confirmed locally |
| Customer authentication | Durable opaque `mamaai_customer_session`, verified through `DynamoDbSessionRepository`; signed headers are a separate trusted-server mechanism | Confirmed locally |
| Main persistence | AWS SDK DynamoDB repositories using a PK/SK single-table pattern | Confirmed locally |
| Primary data table | `MAMA_AI_DYNAMODB_TABLE_NAME` with legacy `MAMA_AI_TABLE_NAME` compatibility | Confirmed locally |
| Analytics | Vercel Analytics component and DynamoDB analytics route code | Confirmed locally; hosted settings unverified |
| AI | Gemini server integration; Preview Ask MAMA gate closes unless `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=true` | Confirmed locally |
| Billing | Razorpay service/routes controlled by server environment variables | Confirmed locally; provider setup unverified |
| Object storage | S3 configuration exists; source documentation describes exports/assets, but a running storage integration was not verified | Partially confirmed |
| Domain/DNS | Production URL references `mamaai.in`; no DNS zone or Vercel domain configuration is stored locally | Unverified |
| CI/CD | Git/Vercel linkage is present; no repository workflow or infrastructure-as-code definition was found | Confirmed only for this checkout |
| Monitoring | Vercel Analytics and application console logging are present; no Sentry, CloudWatch dashboard, log drain, or alert configuration was found locally | Partially confirmed |

No Cognito integration was found. The application does not provide evidence of a separate managed identity provider from source alone.

## Known existing infrastructure

The following is owner-provided evidence from earlier Phase 2 work and requires a future read-only verification before it is relied on:

- AWS account: `624719611353`; region: `ap-south-1`.
- Isolated table: `mamaai-preview-test`, on-demand, `PK`/`SK`, TTL attribute `expiresAt`, zero GSIs.
- Preview IAM user: `mamaai-preview-test-user` with the customer-managed policy `MamaaiPreviewDynamoDBOnly`.
- Production tables to protect: `MAMA_AI_APP`, `MAMA_AI_ANALYTICS_EVENTS`, and the RBIL visitor-counter table.
- Vercel login/project visibility was previously confirmed for the RBIL team, but the existing `mamaai` project has Preview-scoped variables shared with Production, including AWS and Razorpay-related names. Values were not read in this phase.

## Environment-variable structure and risks

`.env.example` documents application variables for `AUTH_SECRET`, AWS region/table/index names, S3, Gemini, Razorpay, demo mode, and public application URL. It is a template, not proof of hosted values.

The template itself contains production-looking defaults (`MAMA_AI_APP` and `mamaai-prod-assets`). It must never be copied unchanged into Preview.

The current project also has direct legacy table fallbacks:

- `app/meal-plans/replace-dish/route.ts`
- `lib/fair-use.ts`
- `lib/monthly-memory.ts`
- `app/api/analytics/track/route.ts`
- `app/api/admin/analytics/route.ts`

Those paths can select `MAMA_AI_APP` or `MAMA_AI_ANALYTICS_EVENTS` when their environment variables are absent. Existing Preview checks cover some repository configuration, but not every direct SDK client. This is a **P0 Preview-isolation blocker**: Preview must fail closed before an isolated deployment is allowed.

`FamilyService` also has an in-memory fallback for non-production DynamoDB failures. That is useful for local development but makes persistence verification invalid if used in Preview. Preview must instead return a controlled error when its isolated database is unavailable.

## Required Preview design

Use a **separate Vercel project**, proposed name `mamaai-preview-isolated`, rather than the linked live `mamaai` project. This prevents the currently shared Preview/Production variable scope from becoming an accidental production-data boundary.

| Boundary | Required design |
|---|---|
| URL | Vercel-generated protected URL, for example `mamaai-preview-isolated-<branch>-rbinnovationllps-projects.vercel.app`; do not add or change DNS |
| Access | Vercel Authentication / Deployment Protection restricted to RBIL testers; do not use a public exception |
| Application secret | Fresh random Preview-only `AUTH_SECRET`, never copied from Production |
| Database | Only the isolated `mamaai-preview-test` table after schema/index compatibility is proven; no production table variable or credential may exist |
| Credentials | A dedicated least-privilege identity limited to that table and required index ARNs. Prefer short-lived credentials/role federation where the chosen Vercel integration supports it; do not create access keys in this phase |
| Data | Two synthetic households only; no real email, phone, food profile, or payment data |
| Payment | Omit all Razorpay keys, plan IDs, and webhook secret until a separate test-mode approval. Server routes must report unavailable rather than calling a provider |
| AI | Omit `GEMINI_API_KEY`; retain `MAMA_AI_PREVIEW_ASK_MAMA_ENABLED=false` until separate approval |
| Storage | Omit S3 configuration unless a selected test requires it. If required later, create a separate bucket/prefix and restricted identity; never reuse production storage |
| Demo/judge paths | Set demo and judge access to false/absent; do not place test keys in the project |
| Logs | Use Vercel deployment/function logs for the test window, with redaction review. Do not log session tokens, AI prompts containing dietary details, or secrets |

## Isolation gates before any deployment

1. Replace every direct production-table fallback with a single Preview-aware configuration resolver that throws when a required isolated resource is absent.
2. Make Preview DynamoDB outages fail closed for persistence-requiring flows; do not use in-memory success responses as proof of Preview persistence.
3. Confirm required GSIs. Current code uses `GSI1` for subscription lookup, safety-report status review, customer export, and CRM queries. The known isolated table has zero GSIs, so those flows cannot be validated until a compatible isolated schema is approved.
4. Create and review the separate Vercel project with Deployment Protection before attaching any environment variables.
5. Validate environment names/scopes only; do not copy production values.
6. Test the deployment's `/api` failure behavior before introducing synthetic accounts, Gemini, or Razorpay.

## Phase 2 local evidence

- `npm test`: 34 passed, 0 failed.
- TypeScript check: passed.
- Production build: compiled successfully locally.
- Local Playwright: 13 passed, 0 failed, 0 skipped across eight viewport widths.

These checks establish local code behavior. They do not establish hosted persistence, payment, AI, domain, or production readiness.

## Assessment conclusion

The live Vercel project is not a suitable isolated Preview target because its Preview scope has previously contained production-associated variables. A separate protected Vercel project and an isolated DynamoDB configuration are the safer design. Phase 3B is blocked until the P0 fail-closed database configuration work is completed and RBIL approves resource creation/deployment.
