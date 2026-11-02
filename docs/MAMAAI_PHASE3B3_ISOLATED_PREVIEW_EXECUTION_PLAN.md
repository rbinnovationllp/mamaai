# MAMAAI Phase 3B.3 isolated Preview execution plan

## Gate A result

Gate A is locally ready; Gate B is **not approved**. No AWS, IAM, Vercel, deployment, DNS, provider, customer-data, payment, or Gemini action occurred.

## Target

Use a separate protected Vercel project, `mamaai-preview-isolated`, and existing empty isolated table `mamaai-preview-test` in `ap-south-1`. Connect it to the same Git source only after creation, without changing the production `mamaai` project or its variables.

## Preview-only configuration

`VERCEL_ENV=preview`; `AWS_REGION=ap-south-1`; `MAMA_AI_AWS_IDENTITY_SCOPE=preview-isolated`; both DynamoDB table variables set to the proposed table; `MAMA_AI_DYNAMODB_GSI1_NAME=GSI1`; fresh Preview-only `AUTH_SECRET`; Preview Ask MAMA, demo/judge, Razorpay, S3, email/OTP and deletion all disabled/absent. Enable Deployment Protection and block indexing.

## Gate sequence

B: approve resources/identity/project; verify IAM denies production ARNs. C: separately approve protected deployment and health/fail-closed checks. D: separately approve two synthetic households and isolation/export tests. E: separately approve Gemini, Razorpay, S3, email/OTP, deletion.

