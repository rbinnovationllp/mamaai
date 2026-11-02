# MAMAAI Phase 3B.3 cost and cleanup plan

Region: ap-south-1. DynamoDB on-demand and GSI1 are usage/storage billed; two synthetic households should be low usage but no zero-cost claim is made. IAM normally has no direct charge; Vercel Protection plan availability/price is unverified and needs account review. Logs may incur retention/ingestion costs. Gemini, Razorpay, S3, email/OTP are disabled and have no intended usage.

Proposed ceiling: RBIL must set an explicit INR ceiling before Gate B; no existing limit is verified. Cleanup after test: revoke test credentials, delete synthetic records, delete table/GSI only with approval, remove Preview variables/project, and confirm log retention settings. Services continuing billing: DynamoDB storage/GSI, Vercel plan/logs, any later provider integration.
