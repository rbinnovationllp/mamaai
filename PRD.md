# MAMA AI – PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Product Name

MAMA AI

## Full Form

Meal & Aahaar Management Assistant

## Product Category

AI-Powered Family Food Operating System

## Website

mamaai.in

## Product Owner

Rashi Bhartiya Innovation LLP

## Brand Positioning

**The Wisdom of Maa. The Intelligence of AI.**

**One Family. Different Needs. One Intelligent Meal Plan.**

---

# 1. PRODUCT VISION

MAMA AI is an AI-powered family food planning, nutrition planning, grocery planning, budget optimization, kitchen assistance, recovery nutrition, and household meal decision platform.

Most existing meal-planning and diet applications focus on one individual.

MAMA AI is designed for the entire family.

Its core objective is to answer:

**“What should our family cook and eat today?”**

while considering the different nutritional, health, age, taste, lifestyle, budget, and cultural requirements of every family member.

A single household may include:

* A growing child
* A teenager
* A working professional
* A fitness-focused person
* A pregnant or lactating mother
* A diabetic parent
* An elderly grandparent
* A person recovering after hospitalization
* A person with a chronic disease

MAMA AI must intelligently create a practical common family meal plan while also suggesting individual portions and modifications for each member.

The system must consider:

* Age
* Gender
* Height
* Weight
* BMI
* Activity level
* Nutritional requirements
* Health conditions
* Allergies
* Food preferences
* Cultural preferences
* Regional food habits
* Local ingredient availability
* Seasonal food availability
* Household budget
* Kitchen facilities
* Cooking time
* Recovery needs
* Previous meal history when optionally provided

The main objective is:

**Minimum separate cooking + maximum family nutrition + practical affordability + family satisfaction.**

---

# 2. CORE USP

The primary innovation of MAMA AI is:

## ONE COMMON FAMILY MEAL

with

## PERSONALIZED PORTIONS AND MODIFICATIONS FOR EACH MEMBER

Example:

### Common Family Meal

Vegetable Khichdi

### Grandmother

* Softer preparation
* Smaller portion
* Easier digestion

### Diabetic Father

* Controlled carbohydrate portion
* Higher suitable vegetables or fiber

### Athletic Son

* Additional protein component

### Growing Child

* Age-appropriate portion
* Suitable curd, fruit, or complementary food

MAMA AI should avoid creating completely separate meals for every family member unless necessary.

The system should optimize one family meal first and then personalize it.

---

# 3. TARGET USERS

## Families

* Couples
* Nuclear families
* Joint families
* Multigenerational households

## Individuals

* Students
* Working professionals
* Senior citizens
* Fitness enthusiasts
* Athletes

## Special Nutrition Groups

* Children
* Teenagers
* Pregnant women
* Lactating mothers
* Senior citizens
* People with allergies
* People with chronic diseases
* People recovering after hospitalization
* People recovering after surgery
* People recovering after prolonged illness

---

# 4. AUTHENTICATION

Support:

* Email login for MVP
* Google login
* Mobile OTP architecture-ready
* Apple login architecture-ready
* Guest mode

Guest users may use limited features.

Guest restrictions may include:

* No long-term saved meal history
* No advanced AI memory
* No detailed reports
* No persistent family planning

---

# 5. ONBOARDING

Use a progressive multi-step onboarding flow.

Do not use one very long form.

Suggested onboarding:

1. User profile
2. Family information
3. Family members
4. Food preferences
5. Health and allergy information
6. Budget
7. Kitchen setup
8. Region and cuisine
9. Review

---

# 6. PRIMARY USER PROFILE

Collect:

## Personal Information

* Name
* Mobile number
* Email
* Gender
* Date of birth
* Age automatically calculated
* Country
* State
* City
* Preferred language

## Physical Information

* Height
* Weight
* Waist circumference optional
* BMI automatically calculated where appropriate

## Lifestyle

* Sedentary
* Light activity
* Moderate activity
* Heavy activity
* Athlete

## Goals

* Healthy living
* Weight loss
* Weight gain
* Muscle gain
* Maintenance
* Disease-aware nutrition support
* Recovery support

---

# 7. FAMILY MANAGEMENT

Allow family members according to the user’s subscription plan.

Each family member should include:

## Basic Information

* Name
* Relationship
* Date of birth
* Age
* Gender

## Physical Information

* Height
* Weight
* BMI
* Waist circumference optional

## Lifestyle

* Activity level
* Occupation or activity pattern

## Food Preference

* Vegetarian
* Non-vegetarian
* Eggitarian
* Vegan
* Jain
* Satvik
* Other

## Likes and Dislikes

* Favourite foods
* Likes
* Dislikes
* Foods never eaten
* Foods rejected

## Allergies and Intolerances

* Milk
* Peanut
* Soy
* Seafood
* Gluten
* Egg
* Other

## Health Conditions

Allow multiple selections:

* Diabetes
* Hypertension
* Heart disease
* Kidney disease
* Thyroid disorder
* PCOS
* Liver disease
* Cancer or cancer recovery
* Arthritis
* Asthma
* Other

## Special Status

* Pregnancy
* Lactation
* Recently hospitalized
* Recovering from surgery
* Recovering from prolonged illness
* Senior requiring soft food
* Child growth stage

---

# 8. NUTRITION CALCULATION ENGINE

Before generating meal plans, calculate or derive relevant nutrition context.

Where scientifically appropriate, calculate:

* BMI
* BMR
* TDEE
* Estimated daily calorie requirement
* Protein requirement
* Carbohydrate guidance
* Fat guidance
* Fiber guidance
* Hydration guidance

Do not blindly use adult formulas for:

* Children
* Adolescents
* Pregnant users
* Lactating users
* Frail elderly users
* Special medical populations

Clearly distinguish:

* Calculated values
* AI-generated suggestions
* User-provided doctor restrictions

---

# 9. FAMILY FOOD OPTIMIZER

This is the core intelligence engine.

The system must analyze every family member before generating the family plan.

Consider:

* Age
* Gender
* Height
* Weight
* BMI
* Activity
* Health conditions
* Allergies
* Recovery status
* Food preferences
* Region
* Season
* Budget
* Kitchen equipment
* Cooking time
* Available ingredients
* Previous food history if provided

Output should contain:

* Common family meal
* Member-specific modification
* Member-specific portion guidance
* Fruit recommendation
* Hydration recommendation
* Estimated cost
* Grocery impact
* Warnings and safety notes

AI output should be structured and schema-validated.

---

# 10. MEAL PLANNING OPTIONS

Provide clear options:

## Plan Today

## Plan This Week

## Plan This Month

Support:

* Daily Family Food Planning
* Weekly Family Food Planning
* Monthly Family Food Planning

For MVP:

* Daily planning must work fully
* Weekly planning must work fully
* Monthly planning may be simplified initially

---

# 11. OPTIONAL PREVIOUS-WEEK FOOD HISTORY

Before weekly or monthly planning ask:

**“Would you like to tell MAMA what your family ate recently so we can suggest more variety?”**

This must be optional.

User can:

* Enter previous meals
* Skip

If provided, use it to:

* Avoid unnecessary repetition
* Improve meal variety
* Improve nutritional diversity
* Suggest new alternatives

If skipped:

Continue meal generation normally.

Previous food history must never be mandatory.

---

# 12. DAILY MEAL STRUCTURE

Depending on the user profile, the plan may include:

* Early Morning
* Breakfast
* Mid-Morning Fruit
* Lunch
* Evening Snack
* High Tea optional
* Fruit/Juice/Hydration
* Dinner
* Bedtime Nutrition where appropriate

Do not force unnecessary eating occasions.

---

# 13. PORTION INTELLIGENCE

MAMA AI must answer:

**What should the family cook?**

and

**How much should each family member eat?**

Each meal should support individual portion guidance.

Example:

Common Meal:

Dal + Rice + Vegetable + Salad

Each family member receives a different recommended portion where appropriate.

---

# 14. FRUIT RECOMMENDATION ENGINE

Full family planning must include suitable fruit recommendations.

For each relevant member recommend:

* Suitable fruit
* Suggested portion
* Appropriate timing where useful
* Seasonal alternative
* Regional alternative
* Locally available alternative

Consider:

* Age
* Health condition
* Allergies
* Region
* Season
* Availability
* Overall meal plan

Prefer whole fruit where appropriate.

---

# 15. JUICE AND HYDRATION ENGINE

Include:

* Water guidance
* Hydration reminders
* Suitable beverages
* Coconut water where appropriate
* Buttermilk or lassi where culturally suitable
* Fruit or vegetable beverages where suitable

Do not automatically treat juice as healthier than whole fruit.

Apply caution for:

* Diabetes
* Kidney disease
* Fluid restrictions
* Potassium restrictions
* Doctor restrictions

---

# 16. REGIONAL FOOD INTELLIGENCE

Adapt recommendations to:

* Country
* State
* Region
* City
* Food culture

For India support regional food patterns such as:

* North Indian
* South Indian
* Bengali
* Gujarati
* Maharashtrian
* Rajasthani
* Central Indian
* Coastal cuisines
* Millet-based diets

Internationally support:

* USA
* UK
* Canada
* Australia
* Middle East
* Africa
* Southeast Asia
* Other regions

Prefer familiar local foods where suitable.

---

# 17. SEASONAL FOOD ENGINE

Meal recommendations should consider:

* Summer
* Winter
* Monsoon
* Spring
* Autumn
* Local climate

Prioritize seasonal:

* Fruits
* Vegetables
* Local staples

Offer alternatives when ingredients are unavailable.

---

# 18. LOCAL AVAILABILITY ENGINE

Allow users to mark an ingredient as unavailable.

Provide:

## Replace Ingredient

Suggest:

* Nutritionally comparable substitute
* Locally available substitute
* Budget-friendly substitute

---

# 19. BUDGET OPTIMIZATION

Allow user to set:

* Daily budget
* Weekly budget
* Monthly budget
* No fixed budget

AI should optimize:

* Nutrition
* Taste
* Cost
* Availability
* Cooking effort

Show:

* Estimated meal cost
* Daily cost
* Weekly cost
* Monthly cost

---

# 20. KITCHEN PROFILE

Collect available kitchen equipment:

* Gas stove
* Induction
* Pressure cooker
* Microwave
* Oven
* Air fryer
* Mixer/grinder
* Other

Cooking-time preference:

* Under 30 minutes
* 30–60 minutes
* More than 60 minutes

Meals should reflect actual kitchen capability.

---

# 21. AI KITCHEN ASSISTANT

Allow the user to enter available ingredients.

Example:

“I have potato, onion, tomato, spinach and paneer.”

MAMA AI should suggest possible:

* Breakfast
* Lunch
* Dinner
* Snacks

while considering family needs.

---

# 22. PANTRY MANAGEMENT

Optional pantry tracking:

* Ingredient
* Quantity
* Purchase date
* Expiry or best-before date
* Remaining quantity

Prioritize pantry ingredients where appropriate.

---

# 23. LEFTOVER FOOD OPTIMIZER

Allow user to enter leftover foods.

Suggest:

* Safe reuse ideas
* New recipes
* Next-meal integration
* Food waste reduction options

Food safety must take priority.

Do not suggest reuse if storage safety is uncertain.

---

# 24. GROCERY PLANNER

Generate grocery lists automatically from approved plans.

Support:

* Daily grocery list
* Weekly grocery list
* Monthly grocery estimate

Include:

* Ingredient
* Quantity
* Estimated cost
* Pantry quantity
* Quantity to purchase

Group by:

* Vegetables
* Fruits
* Grains
* Pulses
* Dairy
* Protein sources
* Spices
* Other

If a meal changes, grocery requirements must update.

---

# 25. DISEASE-AWARE NUTRITION SUPPORT

Support nutrition-aware meal planning for disclosed conditions such as:

* Diabetes
* Hypertension
* Heart disease
* Thyroid conditions
* PCOS
* Kidney disease
* Liver disease
* Cancer recovery
* Other chronic conditions

Before high-sensitivity recommendations, collect where appropriate:

* Condition
* User-provided diagnosis information
* Doctor restrictions
* Food restrictions
* Allergies
* Medication-related food instructions supplied by doctor

MAMA AI must never:

* Diagnose disease
* Prescribe medication
* Change medication
* Recommend stopping medication
* Override doctor advice
* Guarantee recovery

---

# 26. POST-HOSPITAL AND RECOVERY MODE

Create:

## Recovery Meal Support

For users who:

* Were recently discharged
* Had surgery
* Experienced prolonged illness
* Lost significant weight
* Need gradual nutritional recovery

Ask:

* Reason for hospitalization or illness
* Discharge date
* Doctor dietary restrictions
* Prohibited foods
* Chewing difficulty
* Swallowing difficulty
* Appetite level
* Allergies
* Weight change
* Doctor or dietitian instructions

Generate where appropriate:

* Short-term recovery support
* 7-day recovery plan
* 30-day progressive plan
* Protein support
* Fruit recommendations
* Hydration guidance
* Grocery list

Always show stronger professional-consultation guidance.

---

# 27. EVIDENCE-GROUNDED NUTRITION KNOWLEDGE

Use recognized sources where appropriate:

* WHO
* FAO
* ICMR
* National Institute of Nutrition
* Indian Food Composition Tables
* USDA FoodData Central
* Recognized national dietary guidelines

Do not use random internet content as authoritative clinical guidance.

Where practical maintain metadata:

* Source organization
* Guideline/reference
* Publication/update date
* Applicable region
* Applicable population
* Last reviewed date

---

# 28. RECIPE ENGINE

Each meal recommendation should support:

* Recipe name
* Ingredients
* Quantity
* Cooking steps
* Preparation time
* Difficulty
* Estimated cost
* Nutrition summary
* Region
* Season suitability
* Dietary compatibility

---

# 29. YOUTUBE RECIPE INTEGRATION

Use YouTube Data API where appropriate.

Display:

* Video title
* Thumbnail
* Channel
* Duration where available
* Language
* Watch Recipe button

Rank by:

* Recipe relevance
* Language
* Region
* Healthy preparation compatibility
* Video quality signals
* Recency where meaningful

Cache results where possible.

Do not claim third-party videos are medically verified.

---

# 30. MEAL REPLACEMENT ENGINE

Every recommended meal should allow:

## Replace Meal

Reasons:

* Don't like it
* Ate recently
* Too expensive
* Ingredient unavailable
* Too difficult
* Takes too long
* Health concern

Replacement should preserve:

* Nutritional intent
* Family compatibility
* Budget
* Regional suitability

Avoid regenerating the entire plan unnecessarily.

---

# 31. FAMILY SATISFACTION SCORE

Calculate an explainable score.

Suggested factors:

* Taste compatibility: 30%
* Nutrition/health compatibility: 30%
* Budget compatibility: 15%
* Availability compatibility: 15%
* Ease of cooking: 10%

Display:

## Family Satisfaction Score

This is a product score, not a medically validated clinical score.

---

# 32. EDITABLE FOOD PLANS

All generated plans must be editable.

Allow:

* Replace meal
* Edit meal
* Change portion
* Change fruit
* Change snack
* Change recipe
* Add family dish

After editing, optionally recalculate:

* Nutrition
* Grocery list
* Budget
* Compatibility

---

# 33. DOWNLOAD, PRINT AND SHARE

Allow:

* PDF download
* Print
* Share
* CSV or spreadsheet export where appropriate

Downloaded plan should include:

* Date
* Meal
* Common family food
* Individual adjustments
* Portions
* Fruit/hydration
* Notes
* Disclaimer

---

# 34. AI MEMORY

With user consent, remember:

* Likes
* Dislikes
* Rejected meals
* Favourite recipes
* Frequently eaten foods
* Allergies
* Regional preferences
* Previous plans
* Feedback

Use memory to improve future recommendations.

Sensitive health-related memory requires privacy controls.

---

# 35. FEEDBACK LOOP

After meals optionally ask:

**“How did your family like this meal?”**

Options:

* Loved it
* Good
* Average
* Don't suggest again

Use feedback to improve personalization.

---

# 36. USER ANALYTICS

Show useful trends such as:

* Food variety
* Estimated nutrition trends
* Budget trends
* Weight trends
* BMI trends
* Family satisfaction trends
* Meal-plan usage

Do not present estimated nutrition as confirmed health outcomes.

---

# 37. SUBSCRIPTION AND PAYMENT

Use:

## Google Play Billing + RevenueCat

### Family Starter

₹199/month

Supports up to 4 family members.

### Family Premium

₹399/month

Supports up to 6 family members.

### Family Plus

₹599/month

Supports up to 10 family members.

Requirements:

* Secure recurring billing
* Monthly subscription
* Automatic renewal
* Upgrade
* Downgrade
* Cancellation
* Reactivation
* Payment success/failure status
* Transaction history
* Entitlement enforcement
* RevenueCat webhook integration
* Admin subscription visibility

Family-member limits must be enforced at backend/server level as well as UI level.

For the hackathon MVP, entitlement architecture may be implemented before full Google Play production integration.

---

# 38. ADMIN DASHBOARD

Create secure admin route:

`/admin`

Navigation:

* Dashboard
* Users
* Families
* Subscriptions
* CRM
* Support
* Feedback
* Meal Analytics
* Recipes
* Nutrition Knowledge
* AI Prompts
* Revenue
* Notifications
* Roles
* Audit Logs
* Settings

MVP priority:

* Dashboard
* Users
* Families
* CRM
* Feedback

---

# 39. CRM MODULE

Create built-in CRM.

Lead fields:

* Name
* Mobile
* Email
* City
* State
* Country
* Source
* Family size
* Interest
* Assigned employee
* Follow-up date
* Notes

Lead stages:

* New
* Contacted
* Interested
* Trial
* Subscription Pending
* Converted
* Follow-up Later
* Lost

Lead sources:

* Website
* Google Play
* Referral
* WhatsApp
* Facebook
* Instagram
* YouTube
* Google Ads
* Dietitian Referral
* Doctor Referral
* Offline Campaign
* Other

---

# 40. CRM NAVIGATION

Create routes:

* `/admin/crm/dashboard`
* `/admin/crm/leads`
* `/admin/crm/pipeline`
* `/admin/crm/follow-ups`
* `/admin/crm/customers`
* `/admin/crm/activities`
* `/admin/crm/reports`

Support:

* Kanban view
* Searchable table view
* Lead assignment
* Follow-up dates
* Notes
* Activity history

---

# 41. CUSTOMER SUPPORT

Create support ticket system.

Categories:

* Login
* Subscription
* Payment
* Meal Planning
* Recipe
* Nutrition Concern
* Technical Bug
* Download
* Family Member Limit
* Other

Status:

* Open
* In Progress
* Waiting for User
* Resolved
* Closed

---

# 42. ROLE-BASED ACCESS CONTROL

Roles:

## Super Admin

Full access.

## Admin

Operational access.

## Nutrition Reviewer

Nutrition-related review access.

## CRM Manager

CRM access.

## Sales Executive

Assigned leads only.

## Support Executive

Support ticket access.

## Finance

Revenue and subscription reporting.

Important admin actions must be audit logged.

Sensitive health data must not be visible to unauthorized roles.

---

# 43. AI ARCHITECTURE

Use OpenAI API as the primary AI layer.

Create logical services:

* FamilyProfileAnalyzer
* NutritionContextService
* MealOptimizer
* RegionalFoodService
* SeasonalFoodService
* BudgetOptimizer
* GroceryGenerator
* MealReplacementService
* SafetyValidator

All final recommendations must pass through:

## SafetyValidator

before being displayed.

Prompts should be centralized.

Suggested location:

`/lib/ai/prompts/`

Maintain prompt versions.

---

# 44. STRUCTURED AI OUTPUT

Do not rely only on plain-text AI output.

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

Validate AI responses before:

* Display
* Persistence
* Grocery calculation
* Analytics
* Meal replacement

Use Zod or equivalent.

---

# 45. TECHNICAL STACK

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* ShadCN UI

## Deployment

* Vercel

## Backend

Use modular serverless architecture.

Possible implementation:

* Next.js API routes
* Server actions
* AWS Lambda where needed

## Database

Preferred production architecture:

* AWS DynamoDB

Use repository abstraction so business logic does not directly depend on DynamoDB.

## AI

* OpenAI API

## Validation

* Zod

## Video

* YouTube Data API

## Subscription

* RevenueCat
* Google Play Billing

---

# 46. DATABASE ENTITIES

Create at minimum:

* User
* Family
* FamilyMember
* HealthProfile
* FoodPreference
* MealPlan
* MealPlanDay
* Meal
* MealCustomization
* FruitRecommendation
* HydrationRecommendation
* GroceryList
* GroceryItem
* PantryItem
* MealFeedback
* Subscription
* Lead
* CRMActivity
* SupportTicket
* AuditLog

---

# 47. SERVICE AND REPOSITORY ARCHITECTURE

Use service abstractions:

* AuthService
* FamilyService
* NutritionContextService
* MealPlanningService
* MealReplacementService
* GroceryService
* SubscriptionService
* CRMService
* AIService
* SafetyValidationService

Use repositories:

* UserRepository
* FamilyRepository
* MealPlanRepository
* SubscriptionRepository
* LeadRepository

Frontend components must not directly call DynamoDB.

Flow should normally be:

Frontend

↓

API or Server Action

↓

Service

↓

Repository

↓

Database

---

# 48. SECURITY AND PRIVACY

Implement:

* Secure authentication
* Authorization
* RBAC
* Encryption in transit
* Secure secret management
* Audit logs
* Rate limiting
* Input validation
* Data minimization
* User data deletion workflow
* Consent for health data
* Consent for AI memory

Never expose secrets in frontend code.

Maintain `.env.example`.

---

# 49. MEDICAL SAFETY RULES

MAMA AI must never:

* Diagnose disease
* Prescribe medicine
* Change medication
* Recommend stopping medication
* Override doctor instructions
* Guarantee recovery
* Claim medical treatment

Known allergies are hard constraints.

If AI recommends an allergen or prohibited food:

* Reject the output
* Regenerate
* Do not display it as valid

Doctor-provided restrictions should be treated as hard constraints.

---

# 50. MANDATORY DISCLAIMER

Every generated meal or food plan must show:

“MAMA AI provides AI-generated food and nutrition planning suggestions based on information supplied by users. Recommendations are for informational and educational purposes and are not a substitute for professional medical advice, diagnosis, or treatment.

Users with chronic medical conditions, allergies, pregnancy, recent hospitalization, surgery, medication requirements, or other special health needs should consult their doctor, registered dietitian, or qualified healthcare professional before following or materially changing a meal plan.

Rashi Bhartiya Innovation LLP and MAMA AI do not guarantee that AI-generated recommendations are suitable for every individual. Users remain responsible for reviewing recommendations and seeking professional advice where appropriate.”

Safety must also be enforced technically.

Do not rely only on disclaimers.

---

# 51. USER EXPERIENCE

MAMA AI should feel:

* Warm
* Caring
* Simple
* Modern
* Trustworthy
* Family-oriented

Avoid hospital-style UI.

Suggested home screen:

## What Shall MAMA Plan for Your Family Today?

Buttons:

* Plan Today's Meals
* Plan This Week
* Plan This Month
* Cook With What I Have
* View My Family
* Recovery Meal Support

---

# 52. MAMA FAMILY TABLE

Create a visually strong core feature.

At the center:

## Today's Common Family Meal

Around it display family members and their modifications.

Example:

### Grandmother

Soft preparation

### Father

Diabetic-aware adjustment

### Mother

Balanced standard portion

### Son

Extra protein

### Child

Growth-support adjustment

This should be a major hackathon demo screen.

---

# 53. HACKATHON MVP FLOW

Prioritize this complete end-to-end workflow:

Create Account

↓

Create Family

↓

Add Family Members

↓

Capture Age / Height / Weight / Preferences / Health Context

↓

Calculate Nutrition Context

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

This flow must work fully.

Do not build dozens of non-functional screens before this flow works.

---

# 54. DEMO FAMILY

Create fictional hackathon demo data.

## Grandmother

Age: 72

Needs:

* Soft preparation
* Easy digestion

## Father

Age: 50

Health:

* Type 2 diabetes

## Mother

Age: 45

Goal:

* Balanced nutrition

## Son

Age: 19

Activity:

* High

Goal:

* Protein support

## Daughter

Age: 10

Goal:

* Growth-supportive nutrition

Do not use real medical data in public demos.

---

# 55. MULTILINGUAL ROADMAP

Phase 1:

* English
* Hindi

Phase 2:

* Kannada
* Tamil
* Telugu
* Malayalam
* Marathi
* Bengali

Architecture must support internationalization from the beginning.

---

# 56. SUCCESS METRICS

Track:

* Families onboarded
* Meal plans generated
* Weekly active families
* Meal replacements
* Grocery lists generated
* Plans downloaded
* Feedback submitted
* Repeat planning rate
* Free-to-paid conversion
* Subscription retention

Primary product metric:

## Weekly Family Plans Successfully Generated and Reused

---

# 57. REQUIRED PROJECT DOCUMENTS

Codex should maintain:

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

---

# 58. PROJECT STATUS FORMAT

`PROJECT_STATUS.md` should contain:

## Completed

## In Progress

## Not Started

## Known Bugs

## Architecture Decisions

## Required Environment Variables

## Deployment Status

Update after significant implementation milestones.

---

# 59. DEVELOPMENT ORDER

## Sprint 1

* Architecture
* Database schema
* Authentication
* Core UI shell
* Family profiles

## Sprint 2

* Nutrition context
* AI Family Food Optimizer
* Structured AI output
* Daily planning

## Sprint 3

* Weekly planning
* Fruit and hydration
* Budget
* Meal replacement
* Grocery generator

## Sprint 4

* MAMA Family Table
* Admin dashboard
* CRM
* Feedback

## Sprint 5

* Security
* Testing
* Performance
* Deployment
* Hackathon demo polish

---

# 60. DEFINITION OF DONE

A feature is not complete just because its UI exists.

A feature is complete only when applicable elements are implemented:

* UI
* API
* Database persistence
* Validation
* Error handling
* Authorization
* Security
* Testing
* Mobile responsiveness
* Documentation

---

# 61. FIRST CODEX INSTRUCTION

Before writing production code:

1. Read this entire `PRD.md`.
2. Read `AGENTS.md` if present.
3. Audit the existing repository.
4. Do not delete working code without reason.
5. Create/update:

   * `ARCHITECTURE.md`
   * `DATABASE_SCHEMA.md`
   * `API_SPEC.md`
   * `SECURITY.md`
   * `TEST_PLAN.md`
   * `PROJECT_STATUS.md`
   * `.env.example`
6. Define shared TypeScript types.
7. Define service and repository boundaries.
8. Define the structured AI output schema.
9. Define authentication architecture.
10. Define DynamoDB architecture.
11. Then begin implementation.

Prioritize the primary working vertical slice:

**Family Creation → Family Members → Nutrition Context → Common Family Meal → Personalized Adjustments → Portions → Fruit/Hydration → Replace Meal → Grocery Update → MAMA Family Table.**

Do not attempt all future features at once.

---

# 62. FINAL PRODUCT PRINCIPLE

MAMA AI should not become another generic diet app.

Every major feature must reinforce the central product concept:

## One Family.

## Different Needs.

## One Intelligent Meal Plan.

The system should combine the emotional idea of traditional family food care with modern AI-powered personalization.

**The Wisdom of Maa. The Intelligence of AI.**

# END OF PRD.md
