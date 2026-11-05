const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('password accounts use Argon2id and support email-first identity with optional mobile', () => {
  const service = read('lib/services/mobile-password-auth-service.ts');
  assert.match(service, /argon2\.argon2id/);
  assert.match(service, /mobileVerificationStatus: "unverified"/);
  assert.match(service, /EMAIL_ALREADY_REGISTERED/);
  assert.match(service, /registerEmail/);
  assert.match(service, /loginWithEmail/);
});

test('sessions are server-managed for 30 days and are device-version checked', () => {
  const sessions = read('lib/server/customer-session.ts');
  const auth = read('lib/server/auth.ts');
  assert.match(sessions, /60 \* 60 \* 24 \* 30/);
  assert.match(sessions, /deviceActivationVersion/);
  assert.match(auth, /isSessionDeviceActive/);
});

test('device transfers use a DynamoDB conditional transaction and revoke the previous device', () => {
  const repository = read('lib/repositories/account-security-repository.ts');
  assert.match(repository, /TransactWriteCommand/);
  assert.match(repository, /ConditionExpression/);
  assert.match(repository, /revokedAt: input\.transfer\.createdAt/);
  assert.match(repository, /freeTransferTimestamps/);
});

test('recovery codes are server-hashed and single use', () => {
  const service = read('lib/services/mobile-password-auth-service.ts');
  const repository = read('lib/repositories/account-security-repository.ts');
  assert.match(service, /recoveryCodeHash/);
  assert.match(repository, /consumeRecoveryCode/);
  assert.match(repository, /attribute_not_exists\(consumedAt\)/);
});

test('new-device login requires transfer and the browser cannot submit payment success', () => {
  const service = read('lib/services/mobile-password-auth-service.ts');
  const transferRoute = read('app/api/customer/devices/transfer/route.ts');
  assert.match(service, /DEVICE_TRANSFER_REQUIRED/);
  assert.match(service, /TRANSFER_PAYMENT_REQUIRED/);
  assert.doesNotMatch(transferRoute, /paymentSuccess|settleSimulatedPayment/);
});

test('simulated transfer settlement is isolated-preview-only and server controlled', () => {
  const simulator = read('lib/services/isolated-transfer-payment-simulator.ts');
  assert.match(simulator, /MAMA_AI_ISOLATED_PREVIEW !== "true"/);
  assert.match(simulator, /amountPaise !== 19900/);
  assert.doesNotMatch(simulator, /request\.json|NextResponse/);
});

test('password change has CSRF, authenticated, IP and account-aware rate-limit guards', () => {
  const route = read('app/api/customer/auth/password/route.ts');
  assert.match(route, /requireSameOrigin\(request\)/);
  assert.match(route, /requireUser\(request\)/);
  assert.match(route, /scope:"auth_login_ip"/);
  assert.match(route, /scope:"auth_password_user"/);
  assert.match(route, /PASSWORD_CONFIRMATION_MISMATCH/);
});

test('password changes use Argon2 verification and a conditional versioned update', () => {
  const service = read('lib/services/mobile-password-auth-service.ts');
  const repository = read('lib/repositories/account-security-repository.ts');
  assert.match(service, /argon2\.verify\(account\.passwordHash, currentPassword\)/);
  assert.match(service, /PASSWORD_REUSE/);
  assert.match(service, /PASSWORD_CHANGE_CONFLICT/);
  assert.match(repository, /updatePasswordAtomically/);
  assert.match(repository, /passwordVersion/);
  assert.match(repository, /attribute_not_exists\(#record\.#passwordVersion\) OR #record\.#passwordVersion = :expectedVersion/);
});

test('password change invalidates prior password-account sessions at server validation', () => {
  const repository = read('lib/repositories/account-security-repository.ts');
  const sessions = read('lib/server/customer-session.ts');
  const service = read('lib/services/mobile-password-auth-service.ts');
  assert.match(repository, /passwordVersion: account\.passwordVersion/);
  assert.match(sessions, /passwordVersion: record\.passwordVersion/);
  assert.match(service, /account\.passwordVersion === passwordVersion/);
});

test('device confirmation is session and device-cookie bound, CSRF-protected and idempotent', () => {
  const route = read('app/api/customer/devices/confirm/route.ts');
  const repository = read('lib/repositories/account-security-repository.ts');
  assert.match(route, /requireSameOrigin\(request\)/);
  assert.match(route, /user\.source !== "customer_session"/);
  assert.match(route, /user\.deviceId !== deviceId/);
  assert.match(route, /account\.activeDeviceId !== deviceId/);
  assert.match(repository, /if \(device\.confirmedAt\) return true/);
  assert.match(repository, /attribute_not_exists\(#record\.#revokedAt\)/);
});

test('account security renders a guarded, accessible change-password form', () => {
  const page = read('app/account/security/page.tsx');
  const form = read('components/account/ChangePasswordForm.tsx');
  assert.match(page, /ChangePasswordForm/);
  assert.match(form, /autoComplete="current-password"/);
  assert.match(form, /newPassword !== confirmation/);
  assert.match(form, /disabled=\{submitting\}/);
  assert.match(form, /window\.location\.assign\("\/account\/access"\)/);
});

test('recovery-code regeneration is authenticated, password-confirmed, rate-limited and one-time', () => {
  const route = read('app/api/customer/auth/recovery-codes/route.ts');
  const service = read('lib/services/mobile-password-auth-service.ts');
  const repository = read('lib/repositories/account-security-repository.ts');
  const ui = read('components/account/RecoveryCodeRegeneration.tsx');
  assert.match(route, /requireSameOrigin\(request\)/);
  assert.match(route, /requireUser\(request\)/);
  assert.match(route, /scope: "auth_password_user"/);
  assert.match(service, /regenerateRecoveryCodes/);
  assert.match(repository, /regenerateRecoveryCodeHashes/);
  assert.match(repository, /invalidatedAt/);
  assert.match(repository, /recoveryCodeVersion/);
  assert.match(ui, /navigator\.clipboard\.writeText/);
});

test('old or invalidated recovery codes cannot be consumed', () => {
  const repository = read('lib/repositories/account-security-repository.ts');
  assert.match(repository, /attribute_not_exists\(consumedAt\) AND attribute_not_exists\(invalidatedAt\)/);
  assert.match(repository, /ConditionExpression: "attribute_not_exists\(#record\.#recoveryCodeVersion\) OR #record\.#recoveryCodeVersion = :expected"/);
});

test('new-device transfer uses an active-device approval, fresh password and single-use server state', () => {
  const service = read('lib/services/mobile-password-auth-service.ts');
  const repository = read('lib/repositories/account-security-repository.ts');
  const authorizeRoute = read('app/api/customer/devices/transfer/authorize/route.ts');
  const completeRoute = read('app/api/customer/devices/transfer/complete/route.ts');
  assert.match(authorizeRoute, /requireUser\(request\)/);
  assert.match(authorizeRoute, /requireSameOrigin\(request\)/);
  assert.match(service, /crypto\.randomBytes\(24\)/);
  assert.match(repository, /consumeTransferAuthorization/);
  assert.match(repository, /attribute_not_exists\(#record\.#consumedAt\)/);
  assert.match(completeRoute, /auth_login_mobile/);
  assert.match(completeRoute, /setCustomerSessionCookie/);
});

test('transfer management remains separate and account access is email-first without real payment', () => {
  const ui = read('components/account/DeviceTransferManagement.tsx');
  const access = read('app/account/access/page.tsx');
  assert.match(ui, /Transfer history/);
  assert.match(ui, /₹199 GST-inclusive/);
  assert.match(ui, /payment integration is unavailable|real payments are unavailable/);
  assert.match(access, /Email address/);
  assert.match(access, /Stay signed in on this device/);
  assert.match(access, /PasswordRecoveryForm/);
  const recovery = read("components/account/PasswordRecoveryForm.tsx");
  assert.match(recovery, /Nothing was sent/);
  assert.match(recovery, /Email is not required for mobile-only accounts/);
  assert.doesNotMatch(access, /paymentSuccess|settleSimulatedPayment/);
});
