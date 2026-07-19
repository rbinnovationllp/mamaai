# AGENTS.md

# MAMA AI – CODEX MULTI-AGENT DEVELOPMENT RULES

All Codex agents working in this repository must read this file before editing code.

Project:

**MAMA AI – Meal & Aahaar Management Assistant**

Website:

**mamaai.in**

Brand:

**The Wisdom of Maa. The Intelligence of AI.**

Core proposition:

**One Family. Different Needs. One Intelligent Meal Plan.**

---

# 1. CORE MISSION

Build a production-quality hackathon MVP of MAMA AI.

MAMA AI is not a generic diet tracker.

Its core innovation is:

## ONE COMMON FAMILY MEAL

with

## PERSONALIZED PORTIONS AND MODIFICATIONS FOR EACH FAMILY MEMBER

The system must analyze family members individually and then optimize food planning at the family level.

All engineering decisions must preserve this core concept.

---

# 2. SOURCE OF TRUTH

Read files in this order:

1. `PRD.md`
2. `AGENTS.md`
3. `ARCHITECTURE.md`
4. `DATABASE_SCHEMA.md`
5. `API_SPEC.md`
6. `SECURITY.md`
7. `TEST_PLAN.md`
8. `PROJECT_STATUS.md`

If files conflict:

* Do not silently guess
* Preserve the core product intent from `PRD.md`
* Record the conflict in `PROJECT_STATUS.md`
* Resolve architecture consistently before continuing

---

# 3. REQUIRED PROJECT FILES

Ensure these exist and stay current:

* `README.md`
* `PRD.md`
* `AGENTS.md`
* `ARCHITECTURE.md`
* `DATABASE_SCHEMA.md`
* `API_SPEC.md`
* `SECURITY.md`
* `TEST_PLAN.md`
* `PROJECT_STATUS.md`
* `.env.example`

Do not remove these files.

---

# 4. AGENT OWNERSHIP

## AGENT A – ARCHITECTURE LEAD

Owns:

* `ARCHITECTURE.md`
* `DATABASE_SCHEMA.md`
* `API_SPEC.md`
* Shared TypeScript contracts
* Folder architecture
* Cross-module integration rules

Responsibilities:

* Define system architecture
* Define database entities
* Define API contracts
* Define service interfaces
* Prevent duplicate services
* Review architecture-breaking changes

Must not unnecessarily rewrite working feature code.

---

## AGENT B – FRONTEND AND UX

Owns:

* Landing page
* Authentication UI
* User dashboard
* Family management UI
* Meal-planning UI
* Meal-plan detail UI
* Grocery UI
* MAMA Family Table
* Responsive design

Primary directories may include:

* `/app`
* `/components`
* `/components/ui`

Must not:

* Put database calls directly in UI components
* Hardcode secrets
* Duplicate backend logic in frontend

Use APIs or service contracts.

---

## AGENT C – BACKEND AND DATABASE

Owns:

* Repositories
* APIs
* Server actions
* Persistence
* Database integration
* CRUD
* Data validation

Must follow:

`DATABASE_SCHEMA.md`

Schema changes require:

1. Update `DATABASE_SCHEMA.md`
2. Update affected TypeScript types
3. Update `API_SPEC.md`
4. Record impact in `PROJECT_STATUS.md`
5. Update migration strategy if applicable

Never silently change schemas.

---

## AGENT D – AI AND FAMILY FOOD OPTIMIZER

Owns:

* OpenAI integration
* Prompt architecture
* Structured output
* Family profile analysis
* Nutrition context
* Meal optimization
* Regional food adaptation
* Seasonal food adaptation
* Budget-aware planning
* Portion logic
* Fruit recommendations
* Hydration recommendations
* Meal replacement
* Grocery-generation intelligence
* Safety validation

All prompts must be centralized.

Preferred location:

`/lib/ai/prompts/`

Do not place production prompts inside random UI files.

---

## AGENT E – ADMIN AND CRM

Owns:

* `/admin`
* Admin dashboard
* User management
* Family management
* Subscription visibility
* CRM
* Leads
* Pipeline
* Follow-ups
* Feedback
* Support administration
* Roles UI

Must follow RBAC rules.

Sensitive health information must not be exposed to unauthorized admin roles.

---

## AGENT F – QA, SECURITY AND RELEASE

Owns:

* Unit tests
* Integration tests
* Critical workflow tests
* Security review
* API key leakage review
* Error states
* Accessibility
* Responsive testing
* Performance checks
* Production build validation
* Deployment readiness
* Hackathon demo validation

Do not trust feature-completion claims without verification.

---

# 5. HACKATHON PRIORITY

Highest-priority end-to-end workflow:

Create Account

↓

Create Family

↓

Add Family Members

↓

Capture Age / Height / Weight / Preferences / Health Context

↓

Calculate Relevant Nutrition Context

↓

Generate One Common Family Meal

↓

Generate Member-Specific Modifications

↓

Generate Portion Guidance

↓

Add Fruits / Hydration

↓

Allow Meal Replacement

↓

Automatically Update Grocery List

↓

Show MAMA Family Table

↓

Collect Feedback

Do not prioritize advanced future features before this flow works fully.

---

# 6. SHARED CONTRACTS FIRST

Before major parallel development, establish:

* Authentication approach
* Database entities
* API contracts
* TypeScript interfaces
* AI structured-output schema
* Subscription entitlement model
* Safety rules

Agents must use shared contracts.

Do not independently invent incompatible data structures.

---

# 7. DO NOT DUPLICATE SERVICES

Search the repository before creating a new service.

Avoid overlapping files such as:

* `mealService.ts`
* `meal-plan-service.ts`
* `mealGenerator.ts`

when they perform the same responsibility.

Use clear service boundaries.

Recommended services:

* `AuthService`
* `FamilyService`
* `NutritionContextService`
* `MealPlanningService`
* `MealReplacementService`
* `GroceryService`
* `SubscriptionService`
* `CRMService`
* `AIService`
* `SafetyValidationService`

Recommended repositories:

* `UserRepository`
* `FamilyRepository`
* `MealPlanRepository`
* `SubscriptionRepository`
* `LeadRepository`

---

# 8. DATABASE ACCESS RULE

Frontend components must never directly call database SDKs.

Use:

Frontend

↓

API / Server Action

↓

Service

↓

Repository

↓

Database

Keep business logic independent of database implementation where practical.

---

# 9. AI STRUCTURED OUTPUT RULE

Do not rely only on free-form AI responses.

Use structured schemas.

Example:

```ts
interface FamilyMealPlan {
  commonMeal: CommonMeal;
  memberCustomizations: MemberCustomization[];
  fruits: FruitRecommendation[];
  hydration: HydrationRecommendation[];
  estimatedCost: CostEstimate;
  groceryItems: GroceryItem[];
  warnings: string[];
}
```

Validate AI output before:

* Display
* Persistence
* Grocery calculation
* Analytics
* Meal replacement

Use Zod or equivalent validation.

---

# 10. AI SAFETY RULES

MAMA AI must never:

* Diagnose disease
* Prescribe medication
* Change medication
* Recommend stopping medication
* Override doctor instructions
* Guarantee health outcomes
* Claim medical treatment

Known allergies are hard constraints.

If AI recommends a known allergen:

* Reject the output
* Regenerate
* Do not display as valid

Doctor-provided restrictions are also hard constraints.

For chronic disease or recovery cases:

Apply stronger safety checks.

Where information is insufficient:

Recommend professional consultation.

---

# 11. NUTRITION CALCULATION RULES

Do not blindly use adult formulas for:

* Children
* Adolescents
* Pregnancy
* Lactation
* Frail elderly
* Special medical populations

Calculations must distinguish:

* Computed metrics
* AI suggestions
* User-provided medical restrictions

Never present estimated calculations as guaranteed medical truth.

---

# 12. REGIONAL AND SEASONAL RULES

Meal recommendations should consider:

* Country
* State
* City or region
* Season
* Local cuisine
* Ingredient availability

Prefer familiar local foods where suitable.

Avoid unrealistic globally generic meal plans.

---

# 13. PREVIOUS-WEEK HISTORY RULE

Prior-week food history is optional.

Never block meal generation if the user skips it.

If supplied:

Use it to reduce repetition and improve variety.

---

# 14. FAMILY FOOD OPTIMIZER RULE

The default behavior should be:

One common family meal

*

Member-specific modifications

*

Member-specific portion guidance

Do not generate completely separate meals for everyone unless there is a valid reason.

---

# 15. FRUIT AND HYDRATION RULE

Full meal planning should consider:

* Fruits
* Hydration
* Suitable beverages

Do not automatically recommend fruit juice as superior to whole fruit.

Respect:

* Diabetes concerns
* Fluid restrictions
* Kidney-related restrictions
* Allergies
* Doctor restrictions

---

# 16. MEAL REPLACEMENT RULE

Every planned meal should support replacement.

Replacement reasons may include:

* Don't like it
* Ate recently
* Too expensive
* Ingredient unavailable
* Too difficult
* Takes too long
* Health concern

Replacement should preserve:

* Nutrition intent
* Family compatibility
* Budget
* Regional suitability

Do not regenerate the entire plan unless necessary.

---

# 17. GROCERY UPDATE RULE

If a meal changes:

* Recalculate affected ingredients
* Update grocery list
* Update estimated cost
* Avoid stale grocery data

---

# 18. SUBSCRIPTION RULES

Plans:

## Family Starter

₹199/month

Up to 4 members

## Family Premium

₹399/month

Up to 6 members

## Family Plus

₹599/month

Up to 10 members

Architecture:

* Google Play Billing
* RevenueCat

Member limits must be enforced by entitlement.

Never rely only on frontend checks.

Backend/server logic must also enforce limits.

---

# 19. ADMIN SECURITY RULES

Admin roles must follow RBAC.

Suggested roles:

* Super Admin
* Admin
* Nutrition Reviewer
* CRM Manager
* Sales Executive
* Support Executive
* Finance

Sensitive health data must not be visible to all admin roles.

All important admin actions should be audit logged.

---

# 20. CRM RULES

CRM stages:

* New
* Contacted
* Interested
* Trial
* Subscription Pending
* Converted
* Follow-up Later
* Lost

Support:

* Kanban view
* Table view
* Assigned owner
* Follow-up dates
* Notes
* Lead source
* Activity history

---

# 21. SECRET MANAGEMENT

Never hardcode:

* OpenAI keys
* Database credentials
* Auth secrets
* RevenueCat keys
* YouTube API keys
* Webhook secrets

Use environment variables.

Maintain:

`.env.example`

Never commit real secrets.

---

# 22. ERROR HANDLING

Every asynchronous feature must handle:

* Loading
* Success
* Empty state
* Validation error
* Network/API failure
* Timeout
* AI failure
* Permission error

Never leave users on blank or broken screens.

---

# 23. FEATURE DEFINITION OF DONE

A feature is not complete because its UI exists.

A feature is complete only when applicable requirements are done:

* UI
* API
* Database persistence
* Validation
* Error handling
* Authorization
* Tests
* Mobile responsiveness
* Documentation

---

# 24. PROJECT_STATUS UPDATE RULE

After significant work, update:

`PROJECT_STATUS.md`

Use these sections:

## Completed

## In Progress

## Not Started

## Known Bugs

## Architecture Decisions

## Required Environment Variables

## Deployment Status

Do not falsely mark incomplete work as complete.

---

# 25. PARALLEL WORK RULES

Prefer isolated branches or worktrees.

Suggested branches:

* `agent/architecture`
* `agent/frontend`
* `agent/backend`
* `agent/ai`
* `agent/admin-crm`
* `agent/qa`

Before merge:

* Run tests
* Review contracts
* Resolve conflicts
* Validate build

---

# 26. SHARED FILE RULES

Shared files include:

* `package.json`
* middleware
* auth configuration
* global types
* database schemas
* environment configuration
* API contracts
* shared service interfaces

Do not make unnecessary changes to shared files.

Before changing shared architecture:

Review downstream dependencies.

---

# 27. FRONTEND DESIGN RULES

Brand:

**MAMA AI**

Tagline:

**The Wisdom of Maa. The Intelligence of AI.**

Design should feel:

* Warm
* Caring
* Modern
* Trustworthy
* Family-friendly

Avoid:

* Hospital-style design
* Excessive technical jargon
* Overly dense consumer dashboards

Suggested home question:

## What Shall MAMA Plan for Your Family Today?

Primary actions:

* Plan Today's Meals
* Plan This Week
* Plan This Month
* Cook With What I Have
* View My Family

---

# 28. MOBILE-FIRST RULE

All primary flows must work on:

* Mobile
* Tablet
* Desktop

Primary consumer experience should be mobile-first.

Admin may be desktop-optimized but must remain usable responsively.

---

# 29. HACKATHON DEMO DATA

Use fictional demo family only.

## Grandmother

Age 72

Needs:

* Soft preparation
* Easy digestion

## Father

Age 50

Health:

* Type 2 diabetes

## Mother

Age 45

Goal:

* Balanced nutrition

## Son

Age 19

Activity:

* High

Goal:

* Protein support

## Daughter

Age 10

Goal:

* Growth-supportive nutrition

Never use real personal medical information in public demo data.

---

# 30. TESTING PRIORITIES

Critical tests include:

1. Authentication and authorization
2. Family creation
3. Family member persistence
4. Subscription member limits
5. Allergy exclusion
6. Doctor restriction handling
7. Structured AI output validation
8. Common meal generation
9. Member-specific customization
10. Portion display
11. Meal replacement
12. Grocery recalculation
13. AI failure fallback
14. Admin authorization
15. Mobile responsiveness
16. Production build

---

# 31. CODE QUALITY

Use:

* TypeScript strict mode where practical
* Clear types
* Small reusable components
* Schema validation
* Centralized constants
* Minimal duplication
* Meaningful naming

Avoid:

* Giant components
* Hardcoded production values
* Unnecessary `any`
* Duplicate services
* Dead code
* Unused dependencies

---

# 32. DOCUMENTATION RULE

When implementing a significant module, document:

* Purpose
* Inputs
* Outputs
* Dependencies
* Known limitations

Keep documentation current.

---

# 33. FINAL RELEASE GATE

Before declaring:

**Hackathon MVP Ready**

Agent F must verify:

* Production build succeeds
* No blocking TypeScript errors
* No major console errors
* No exposed secrets
* Authentication works
* Family creation works
* Family member management works
* AI meal generation works
* Common meal displays
* Individual modifications display
* Portions display
* Fruit/hydration display
* Meal replacement works
* Grocery list updates
* MAMA Family Table works
* Disclaimer appears
* Mobile UI works
* Error states work
* Demo data works
* README setup is accurate

Only after these checks may the project be marked:

**Hackathon MVP Ready**

# END OF AGENTS.md
