# MAMA AI Security

## Security Principles

- Never expose secrets in frontend code.
- Validate all API inputs and AI outputs.
- Treat allergies and doctor restrictions as hard constraints.
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
- YouTube API key
- Webhook secrets

Never commit real secrets. Keep `.env.example` current.

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

## Security Review Checklist

- No secrets in client bundle.
- API routes validate inputs.
- AI output validation cannot be bypassed.
- Allergy and doctor restrictions are hard constraints.
- Admin routes enforce RBAC.
- Sensitive data is not visible to unauthorized roles.
- Demo data is fictional.
