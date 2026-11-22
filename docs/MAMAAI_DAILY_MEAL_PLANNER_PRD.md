# MAMAAI Daily Meal Planner

## Purpose

**What to Cook Today? / आज क्या बनाएं? / ಇಂದು ಏನು ಅಡುಗೆ ಮಾಡೋಣ?** gives a family one practical day of meal planning from ingredients actually available at home. It serves one free first experience for a new authenticated household and an ongoing daily-planning tool for active subscribers.

## Implemented scope

- Searchable/category ingredient selection with a free-text “other” field.
- Breakfast, lunch, optional high tea, dinner, school tiffin, and office tiffin selection.
- Optional free-experience member age; likes, dislikes, allergies and customer-stated restrictions are passed as safety constraints.
- Recipes, quantities, instructions, groceries, and member adaptations are rendered from the existing validated meal-plan model.
- New-account free plan is saved once; paid customers can generate new daily plans using their saved profile.

## Safety and limits

No medical diagnosis or treatment is provided. Allergies and doctor/dietitian restrictions are hard planning constraints. The system must name extra ingredients rather than assume they are available.

The daily plan does not replace a weekly plan. Replacing a weekly day remains a separate, explicit future action.

## Known completion gates

The UI/API and focused local tests are implemented. Live AI quality, authenticated browser flows, isolated DynamoDB persistence, and Razorpay Test Mode remain separate verification gates.
