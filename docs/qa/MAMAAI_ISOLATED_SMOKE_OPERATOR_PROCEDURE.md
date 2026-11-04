# Isolated smoke-test operator procedure

Purpose: run the existing bounded smoke route against the isolated Vercel Production deployment without exposing its secret to chat, source control, browser storage or application logs.

Scope: `rbinnovationllps-projects/mamaai-preview-isolated` only. Do not use this procedure against `mamaai`, `mamaai.in` or `www.mamaai.in`.

## Current readiness status — 28 October 2026

Read-only `vercel env ls production` inspection confirms both smoke-variable names, all required isolated AWS-variable names and the Production scope in the linked isolated project. Values remain hidden and were not read. RBIL has confirmed the smoke flag is currently `false`; this is the required disabled state until a controlled test window is approved. Because Vercel applies environment-variable changes only to newly built deployments, an isolated-only redeploy is required after any flag change.

The deployment remains Vercel Authentication-protected. A normal browser login grants interactive viewing access but does not add the application smoke-secret header. For the operator request, use Vercel's official Protection Bypass for Automation with its own project-scoped secret. That secret passes Vercel's outer deployment protection only; `MAMA_AI_ISOLATED_SMOKE_TEST_SECRET` remains separate, required application authorization. Do not use a public protection exception or disable Vercel Authentication.

## Preconditions an RBIL operator must confirm in Vercel

1. Select project `mamaai-preview-isolated`, Production environment.
2. Confirm the project remains protected by Vercel Authentication.
3. Confirm (without copying values into chat) that isolated configuration names are present and match the approved preview scope: `MAMA_AI_ISOLATED_PREVIEW`, `MAMA_AI_AWS_IDENTITY_SCOPE`, `AWS_REGION`, `MAMA_AI_DYNAMODB_TABLE_NAME`, `MAMA_AI_ANALYTICS_TABLE_NAME`, `MAMA_AI_DYNAMODB_GSI1_NAME`, and `AWS_ROLE_ARN`.
4. Confirm `MAMA_AI_ISOLATED_SMOKE_TEST_ENABLED` is explicitly `true` only for this controlled test window.
5. Confirm `MAMA_AI_ISOLATED_SMOKE_TEST_SECRET` already exists. Do not paste its value into chat, tickets, source files or browser developer tools.

## Invoke once from an RBIL-controlled terminal

Use a trusted RBIL operator workstation. The following PowerShell procedure prompts for the Vercel automation-bypass secret and the separate application smoke secret without placing either in command history or a file:

```powershell
$secureBypass = Read-Host 'Paste the Vercel automation-bypass secret' -AsSecureString
$secureSmoke = Read-Host 'Paste the isolated application smoke secret' -AsSecureString
$bypassPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureBypass)
$smokePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSmoke)
try {
  $bypass = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bypassPointer)
  $smoke = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($smokePointer)
  $response = Invoke-RestMethod -Method POST `
    -Uri 'https://mamaai-preview-isolated.vercel.app/api/internal/isolated-smoke' `
    -Headers @{ 'x-vercel-protection-bypass' = $bypass; 'x-mamaai-isolated-smoke-secret' = $smoke }
  $response | Select-Object ok, oidcDynamoDb, write, read, gsi1, cleanup | Format-List
} finally {
  if ($bypassPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bypassPointer) }
  if ($smokePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($smokePointer) }
  Remove-Variable bypass,smoke -ErrorAction SilentlyContinue
}
```

Only report the six boolean response fields to the engineering record. Do not save request headers, the secret or Vercel tokens.

## Expected safe result

`ok`, `oidcDynamoDb`, `write`, `read`, `gsi1`, and `cleanup` are all `True`. The route uses a generated `ISOLATED_SMOKE#` key, validates the expected preview role/region/table/GSI in server-side configuration, performs put/get/GSI query, then awaits deletion before returning success. Its 15-minute TTL is only a cleanup backstop after a failed run.

## Failure handling

- `403`: check the isolated flags and header name/value in Vercel; do not weaken authentication.
- `503` with `isolated_dynamodb_operation_failed`: stop database-dependent QA. RBIL should inspect Vercel function logs and the existing OIDC role/table permissions without sharing secrets.
- Any configuration rejection: stop. Confirm the project is still the isolated project and uses only `mamaai-preview-test` in `ap-south-1` with the approved preview role.

After one successful run, set `MAMA_AI_ISOLATED_SMOKE_TEST_ENABLED` back to `false` or remove it through RBIL's approved Vercel configuration process. That environment-variable change requires RBIL operator action; this procedure does not authorize an application deployment or infrastructure change.
