# MAMAAI Phase 3B.3 synthetic test plan

After Gates B–D approval only, create two disposable identities.

A: two adults, one child, vegetarian, synthetic milk-allergy restriction, limited budget. B: two adults, mixed diet, different regional cuisine and pantry.

Test registration/login/logout/session expiry; profile create/update/reload; pantry and meal persistence; unauthorized/missing/expired session rejection; A cannot read/update/export B; B cannot read/update/export A. Export must include only authenticated account family/pantry/meal records, exclude token hashes and provider credentials. Capture traces and delete synthetic data under approved cleanup. Gemini, Razorpay, S3, email/OTP and deletion are out of scope.
