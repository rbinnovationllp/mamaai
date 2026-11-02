# MAMAAI Account Deletion and Retention Design

Date: 23 October 2026

## Current state

Deletion is intentionally disabled. The authenticated endpoint runs a preflight and returns 409. It identifies account, family profile, pantry, feedback, meal plans and weekly plans as candidate groups, while subscriptions/payments, sessions and safety reports require approved handling. This is an honest safeguard, not a completed deletion feature.

## Retention evidence

The data model describes a 15-day detailed meal-plan retention policy using DynamoDB TTL (`expiresAt`/`expiresAtEpoch`). TTL is asynchronous and must never be treated as authorization. Safety, allergy, dietary preference, account and subscription records have separate retention needs. Live TTL configuration has not been inspected.

## Approved-design prerequisites

1. Reauthenticate the account owner and require a clear confirmation.
2. Create an idempotent deletion-request record with status/audit transitions, without retaining unnecessary health information.
3. Immediately revoke all sessions using a user-addressable session index or a dedicated revocation strategy.
4. Delete/anonymize eligible profile, pantry, meal-plan, feedback and export data in controlled batches.
5. Preserve only records required by approved financial, legal, fraud and safety-review retention rules.
6. Identify backup expiration behavior; do not promise immediate backup erasure.
7. Report completion/pending/failed state without leaking data.
8. Test failure recovery and a synthetic-account-only dry run in isolated Preview.

## RBIL decisions required

- Legal retention periods for payment/subscription, safety-report and audit data.
- Whether account deletion means deletion or irreversible anonymization for each entity.
- Reauthentication method and notice period.
- Backup retention and support escalation process.
- Approval for required table indexes, worker/queue architecture and scoped delete permissions.

No account or record was deleted.
