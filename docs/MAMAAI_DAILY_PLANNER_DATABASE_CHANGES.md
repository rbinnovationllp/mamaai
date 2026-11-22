# Daily Planner Database Changes

No SQL migration is required. DynamoDB uses existing application-table key patterns.

| Record | PK / SK | Purpose |
| --- | --- | --- |
| Free entitlement | `USER#{userId}` / `FREE_DAILY#CURRENT` | User’s atomic one-time reservation or completed plan |
| Device claim | `DEVICE#{deviceId}` / `FREE_DAILY#CURRENT` | Recognised-device duplicate control |
| Subscriber latest daily plan | `USER#{userId}` / `DAILY_MEAL#LATEST` | Reopen last subscriber-generated day |

Free records have no automatic expiry after completion. The short `lockExpiresAtEpoch` is only a five-minute in-progress guard and must not be used as a user-data retention policy. Existing detailed meal plan retention applies separately.

The customer profile has `mealHistoryOnboardingStatus`: `not_started`, `complete`, or `do_not_remember`. It supports explicit checkout validation; no backfill is required because existing records default safely to `not_started`.
