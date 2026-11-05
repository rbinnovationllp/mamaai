# MAMA AI Security

## Security Principles

- Never expose secrets in frontend code.
- Validate all API inputs and AI outputs.
- Treat allergies and doctor restrictions as hard constraints.
- Treat food allergies, ingredient allergies, excluded ingredients, dietary restrictions, and doctor restrictions as hard constraints.
- Treat food dislikes and disliked meals as preference signals that should drive member-level modifications before changing the full family meal.
- Use RBAC for admin routes.
- Minimize and protect sensitive health data.
- Audit important admin actions.

## Authentication

MVP supports demo/guest mode for hackathon flow. Production must use secure HTTP-only cookies or verified JWTs with server-side session resolution.

Supported architecture:

- Email login
- Google login
- Mobile OTP adapter-ready
- Apple login adapter-ready
- Guest mode with limited persistence

## Judge/Demo Access

Judge/Demo Access is allowed for the Codex Hackathon review flow only.

Rules:

- Use fictional demo family data only.
- Require no registration or payment.
- Bypass RevenueCat/Google Play Billing only inside demo mode.
- Do not persist real health information through judge mode.
- Do not reuse judge bypass logic for normal production entitlement checks.

## Authorization

Consumer users may only access their own families, members, meal plans, grocery lists, and feedback.

Admin roles:

- Super Admin
- Admin
- Nutrition Reviewer
- CRM Manager
- Sales Executive
- Support Executive
- Finance

Sensitive health data visibility must be limited to roles with a clear operational need.

## Isolated beta access

Non-paying beta access is a server-side, operator-granted, expiring trial record. It is permitted only when the isolated beta runtime, `MAMA_AI_BETA_ACCESS_ENABLED`, a `mamaai-preview-beta-*` table, and a future beta end date are all configured. The grant endpoint requires the dedicated beta operator secret, verifies the tester account exists, fixes the plan to Starter or Premium, and rejects Family Plus. Browser flags, client payload plan choices, judge/demo mode, and production tables cannot create beta access. Revocation writes a cancelled beta record for the same account; no payment entitlement is created.

## AI Safety

MAMA AI must never diagnose disease, prescribe medication, change medication, recommend stopping medication, override doctor instructions, guarantee recovery, or claim medical treatment.

Technical enforcement:

- Validate structured AI output with Zod.
- Reject known allergens.
- Reject doctor-prohibited ingredients.
- Require warnings for chronic conditions, pregnancy, lactation, hospitalization, surgery, and recovery.
- Always show the mandatory disclaimer with generated plans.

## Required Disclaimer

MAMA AI provides AI-generated food and nutrition planning suggestions based on information supplied by users. Recommendations are for informational and educational purposes and are not a substitute for professional medical advice, diagnosis, or treatment.

Users with chronic medical conditions, allergies, pregnancy, recent hospitalization, surgery, medication requirements, or other special health needs should consult their doctor, registered dietitian, or qualified healthcare professional before following or materially changing a meal plan.

Rashi Bhartiya Innovation LLP and MAMA AI do not guarantee that AI-generated recommendations are suitable for every individual. Users remain responsible for reviewing recommendations and seeking professional advice where appropriate.

## Secret Management

Use environment variables for:

- OpenAI API key
- AWS credentials
- Auth secret
- RevenueCat keys
- RevenueCat webhook secret
- Razorpay key ID
- Razorpay key secret
- Razorpay webhook secret
- Razorpay MAMAAI plan IDs
- YouTube API key
- Webhook secrets

Never commit real secrets. Keep `.env.example` current.

## Razorpay Security

- Create Razorpay subscriptions only from server-side route handlers.
- Never expose `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` to the browser or GitHub.
- Verify Razorpay Checkout signatures before activating entitlement.
- Verify `x-razorpay-signature` before accepting webhook events.
- Store subscription status and transaction history server-side; never trust a frontend-only premium flag.
- Use MAMAAI-specific Razorpay plan IDs, webhook URL, webhook secret, and metadata (`project=mamaai`), even if the same Razorpay account is also used for Syllabus Synk.
- Production GST/invoice settings must be configured inside Razorpay according to the billing entity before collecting real customer payments.

## AWS Security Architecture

Production AWS access must happen only from trusted server code: Next.js route handlers, server actions, or AWS Lambda. Browser/frontend code must never receive DynamoDB credentials, S3 write credentials, Cognito admin credentials, or long-lived AWS access keys.

Recommended isolation for MAMAAI, even inside the same AWS account as education projects:

- MAMAAI DynamoDB table: `MAMA_AI_APP` or an environment-specific equivalent.
- MAMAAI S3 bucket/prefix: `mamaai-prod-assets/mamaai/`.
- MAMAAI IAM role with permissions only for MAMAAI DynamoDB table/index ARNs and MAMAAI S3 bucket/prefix ARNs.
- Separate deployment environment variables for MAMAAI.
- Resource tags: `Project=mamaai`, `Environment=production`.

S3 objects should be private by default. User exports, PDFs, reports, and uploads should be accessed through short-lived signed URLs generated server-side after authorization checks.

DynamoDB TTL should expire detailed meal-plan history after 15 days, but TTL must not apply to safety-critical or personalization records such as allergies, medical dietary restrictions, fasting preferences, permanent dislikes, favourites, feedback signals, and account/subscription records.

## Rate Limiting

Production APIs should rate limit:

- AI meal generation
- Meal replacement
- Authentication attempts
- Feedback submission
- Admin mutations

## Data Privacy

- Ask for health data consent.
- Ask for AI memory consent separately.
- Support user data deletion workflow.
- Store only data needed for the product experience.
- Avoid logging sensitive health details.

## Website Analytics Privacy

- Use Vercel Web Analytics for lightweight hosted page analytics where available.
- Track MVP product events with anonymous visitor/session ids only.
- Do not store raw IP addresses for visitor counting.
- Do not use non-essential tracking cookies before privacy/consent requirements are reviewed.
- Keep analytics failures isolated from the core meal-planning flow.
- Separate page views, visits/sessions, and estimated unique visitors in admin reporting.


## Ask MAMA Security

- Use the controlled product knowledge base as the source of truth for hackathon answers.
- Do not expose system prompts, API keys, webhook secrets, AWS configuration, admin data, private user data, or internal implementation details.
- Treat medical and health-sensitive questions as safety-sensitive; do not diagnose, treat, prescribe, or replace professional advice.
- Track only anonymous assistant events, categories, and short labels in the MVP. Do not store full sensitive chat transcripts without production consent and retention controls.
- Keep Ask MAMA separate from the meal-planning engine until authenticated user context and safety controls are production-ready.
## Security Review Checklist

- No secrets in client bundle.
- API routes validate inputs.
- AI output validation cannot be bypassed.
- Allergy and doctor restrictions are hard constraints.
- Admin routes enforce RBAC.
- Sensitive data is not visible to unauthorized roles.
- Demo data is fictional.
- Ask MAMA refuses prompt-injection, secret-disclosure, private-data, and medical-treatment requests.



## Recovery controls — 4 November 2026

Recovery ownership proof is either an already issued one-time recovery code or a short-lived OTP delivered to an independently verified stored contact. No number/email matching alone can authorize a reset. Production delivery remains disabled pending vetted SMS/email adapters and contact-verification enrollment.

Six-digit randomInt OTPs are HMAC-bound to random challenge IDs with MAMA_AI_RECOVERY_CHALLENGE_SECRET (at least 32 characters), expire in 10 minutes and allow at most five failed checks. Atomic proof consumption plus password update prevents replay/partial consumption. Durable API limits: 10 requests per IP per 15 minutes, 3 delivery requests per normalized contact and 5 proof attempts per contact/challenge per 15 minutes. Limiter outages fail closed.

Requests do not reveal account existence or available contacts. Adapter implementations must preserve generic responses, avoid logging codes/contacts, bound delivery latency and preferably enqueue delivery to avoid account-dependent response timing. No real SMS/email adapter or queue is currently installed. Existing lookup/recovery peppers must be preserved; rotations require a separate compatibility plan.

Reset invalidates versioned password-account sessions and pre-reset device-less opaque sessions for that account, and clears this browser's legacy cookie. Unrelated signed legacy-token revocation/transition remains a broader migration issue; this change does not claim to revoke every historical token format.

## Recognized-device session policy — 4 November 2026

Added optional DurableSessionRecord.rememberDevice. Only explicitly remembered new sessions receive the 365-day lifetime/rolling renewal; old records retain prior expiry semantics. Renewal UpdateCommand is conditional on unrevoked, remembered, unexpired state and expected previous expiry; both record expiry and top-level TTL are updated atomically. requireUser also compares the browser device cookie with the stored session device before account version checks.

No password/token is stored in localStorage. Session and device cookies stay HttpOnly, SameSite=Lax and Secure in production. Renewal cannot bypass password reset, device activation/version changes or revocation. Browser data removal, expired cookies and different browser/origin cannot be recognized without renewed proof. CacheStorage must never be used as session authority; old app-cache versions are purged and private routes/API responses bypass the new worker cache.
