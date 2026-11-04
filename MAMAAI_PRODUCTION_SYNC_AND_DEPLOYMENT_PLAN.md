# Production sync and deployment plan

## What local metadata proves

Both `C:\\Users\\HP\\mamaai-preview-isolated` and `C:\\Users\\HP\\mamaai` use remote `https://github.com/rbinnovationllp/mamaai.git`. The latter is on local branch `main`. The isolated checkout is not clean and its `.vercel/project.json` identifies project `mamaai-preview-isolated` (`prj_NQcC4LtOVDZtBNr5lxzdzfQTy8kv`), so it is a separate preview project. Local metadata alone does not prove which Vercel project/branch serves `mamaai.in`; that requires read-only owner-authorised Vercel deployment metadata or Git deployment records.

## Safe transfer plan

1. Freeze a reviewed release commit in the isolated checkout after all P0 tests pass; do not transfer its `.qa`, Dynoxide SQLite files, Playwright artifacts, local secrets, test tables, or QA-only environment values.
2. Compare that commit against the selected production branch using `git diff`; transplant only reviewed source, tests, migrations, and dependency-lock changes.
3. Confirm DynamoDB writes are backward compatible. The added optional family dietary fields are additive; no destructive migration is currently required. Validate production table/GSI compatibility before release.
4. Create a protected staging deployment from the release commit with production-like OIDC, separate data, disabled paid AI/email/payment execution, and run the authenticated smoke suite.
5. Obtain owner approval for a production deployment only after build exit 0, weekly-plan/grocery acceptance evidence, and staging smoke results. Verify the domain, login, entitlement, and rollback route after deployment.
6. Roll back by redeploying the last known-good immutable Vercel deployment/commit; do not roll back data by destructive table operations.

## Current recommendation

**NO-GO for transfer or deployment.** The isolated tree contains a very large set of uncommitted changes and still lacks conclusive weekly-plan and production-build evidence. No production resource was inspected, changed, or accessed.
