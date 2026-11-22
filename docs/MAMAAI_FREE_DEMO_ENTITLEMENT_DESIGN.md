# Free Daily Experience Entitlement Design

`/api/daily-meal-plan` resolves the authenticated user and recognised `mamaai_device` cookie server-side. The DynamoDB records are keyed both by `USER#{userId}` and `DEVICE#{deviceId}`.

- A `generating` record is atomically written to both keys for five minutes.
- The record changes to `generated` only after every selected meal plan has been created and persisted.
- Any generation error abandons the lock, allowing a retry without consuming the free plan.
- A second account on a device with a completed free experience is rejected; a completed user request reopens the saved plan idempotently.
- All mutation requests require same-origin and authenticated session checks.

### Limitation

A browser application cannot prove physical-device identity after cookie/browser-data reset or use of another browser. The combined registered account and recognised-device control is intentionally privacy-preserving: it does not collect IMEI, MAC address, or hardware serial numbers. Rate limiting and support review are additional abuse controls, not identity proof.
