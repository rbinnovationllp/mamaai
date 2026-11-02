# MAMAAI Phase 3B.1 — Database Isolation Report

Date: 23 October 2026

## Scope

This phase made local source and test changes only. No AWS request, Vercel deployment, DynamoDB access, IAM change, production configuration change, payment action, Gemini call, commit, or push was performed.

## Baseline

The recorded working tree was already modified before this phase by prior approved work. Existing uncommitted changes included public subscription/UI, food-safety, documentation, and test changes. Phase 3B.1 added the configuration guard and database-isolation test suite listed below; it did not reset, stage, commit, or overwrite prior work.

## Original unsafe paths

| Original path | Original risk | Correction |
|---|---|---|
| `lib/repositories/dynamodb-client.ts` | `AWS_REGION` default and `MAMA_AI_TABLE_NAME` fallback could create a non-isolated client/table selection | Uses centralized validated configuration and lazy validated client creation |
| `lib/repositories/dynamo.ts` | Split-table names fell back to legacy table identifiers; client accepted empty credentials/default region | Dynamic validated table getters and validated client delegate |
| `lib/fair-use.ts` | Direct `MAMA_AI_APP` fallback | Uses `getMamaAiTableName()` |
| `lib/monthly-memory.ts` | Direct `MAMA_AI_APP` fallback | Uses `getMamaAiTableName()` |
| `app/api/analytics/track/route.ts` | Direct production analytics-table fallback and explicit empty AWS credentials | Uses validated analytics table/client; removes credential construction |
| `app/api/admin/analytics/route.ts` | Direct production analytics-table fallback | Uses validated analytics table/client |
| `app/meal-plans/replace-dish/route.ts` | Retired route imported and initialized Gemini/DynamoDB before returning 410 | Reduced to a dependency-free 410 route |
| `lib/services/family-service.ts` | Non-production DynamoDB failures could be presented from in-memory storage | Preview/test persistence failures now rethrow rather than falling back |

## Implemented configuration rules

New file: `lib/server/dynamodb-configuration.ts`.

- Runtime is derived only from server environment (`VERCEL_ENV` / `NODE_ENV`), never a request header or client input.
- Preview requires `VERCEL_ENV=preview`; test requires `NODE_ENV=test`.
- Preview/test require explicit `AWS_REGION`, `MAMA_AI_DYNAMODB_TABLE_NAME`, `MAMA_AI_ANALYTICS_TABLE_NAME`, and `MAMA_AI_AWS_IDENTITY_SCOPE`.
- Preview requires `MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated`; tests require `test-isolated`.
- Preview/test table names must match `mamaai-preview-*` or `mamaai-test-*`.
- Known production identifiers (`MAMA_AI_APP`, `MAMA_AI_ANALYTICS_EVENTS`, and the RBIL visitor-counter table) are rejected in Preview/test.
- Missing or invalid configuration throws `DynamoDbConfigurationError` before a DynamoDB document client is created or a command is sent.
- Production keeps its established variable names and transition defaults for compatibility. Those defaults are available only to the production runtime.
- The AWS SDK document client is cached only after validated configuration supplies its region. No direct route initializes a client from `AWS_REGION || ...` or passes empty credential strings.

## Files changed in this phase

- `.env.example` — removes production-looking resource defaults and documents explicit Preview/test values.
- `lib/server/dynamodb-configuration.ts` — new centralized guard.
- `lib/repositories/dynamodb-client.ts` — validated client/table access.
- `lib/repositories/dynamo.ts` — guarded legacy compatibility layer.
- `lib/fair-use.ts`
- `lib/monthly-memory.ts`
- `app/api/analytics/track/route.ts`
- `app/api/admin/analytics/route.ts`
- `app/meal-plans/replace-dish/route.ts`
- `lib/services/family-service.ts`
- `tests/database-isolation.test.cjs` — new synthetic configuration regression tests.

## Evidence

`tests/database-isolation.test.cjs` proves that:

1. Missing Preview table configuration fails.
2. Missing/invalid Preview region fails.
3. Preview identity scope must be explicit.
4. Known production names and arbitrary non-isolated table names are rejected.
5. Test runtime also requires explicit isolated configuration.
6. Legacy table names cannot fall back in test runtime.
7. Production variable names remain compatible in the production runtime.
8. Former direct-client paths no longer contain fallback expressions.
9. The retired endpoint imports no AWS/Gemini client.
10. Failure messages do not include secrets, tokens, or access-key material.

## Remaining risks and required cloud verification

The identity-scope variable prevents an accidental unlabelled Preview configuration; it cannot independently prove what IAM principal Vercel uses. Actual enforcement still requires a dedicated AWS role/user whose policy names only the isolated table and indexes. The current known `mamaai-preview-test` table has zero GSIs, while the application needs `GSI1` for customer export, safety-report review, subscription lookup, and CRM queries. Those workflows remain blocked until an isolated schema decision and AWS approval.

A future protected deployment must verify that every required Preview variable is explicit, no production credential/table/bucket variable is present, and a missing table configuration yields a controlled failure response.

## Approval boundary

Phase 3B.2 requires separate RBIL approval for read-only AWS/IAM verification, then any isolated resource/index/identity/project creation. This report does not authorize those actions.

