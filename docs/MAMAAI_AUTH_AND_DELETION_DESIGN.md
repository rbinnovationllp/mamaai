# Authentication and deletion safety design

## Current safety gate

Persistent customer data requires a verified user identity supplied by the existing signed-header integration or a durable verified session. Contact values alone must never create a user ID or session.

## RBIL approval required

Before public sign-up, select an approved identity provider or verified OTP service, define account recovery and re-verification, and map its immutable subject to `userId`. The provider callback must rotate the existing session and set the secure, HTTP-only cookie.

## Account deletion

Deletion remains disabled. A future execution flow must require a recent identity re-verification, explicit typed confirmation, a short cancellation window, and an immutable request/audit record. It must delete or anonymise profile, family profile, pantry, meal plans, weekly plans, shopping lists, favourites, pets and related application records. Subscription/payment, safety-review and legally retained records require approved retention rules. Sessions need a user lookup index so all sessions can be revoked before deletion.
