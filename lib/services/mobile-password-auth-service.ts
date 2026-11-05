import * as crypto from "crypto";
import argon2 from "argon2";
import { AccountSecurityRepository, type PasswordAccountRecord, type DeviceRecord, type TransferRecord } from "@/lib/repositories/account-security-repository";
import { createOpaqueSessionToken, hashSessionToken, CUSTOMER_SESSION_MAX_AGE_SECONDS, TRUSTED_DEVICE_SESSION_MAX_AGE_SECONDS } from "@/lib/server/customer-session";
import { isPasswordLengthValid, PASSWORD_HELP_TEXT } from "@/lib/shared/password-policy";

const DAY_MS = 24 * 60 * 60 * 1000;
const FREE_TRANSFER_LIMIT = 2;
const TRANSFER_COST_PAISE = 19900;

export class MobilePasswordAuthError extends Error { constructor(public code: string, message: string, public status = 400) { super(message); } }

export function normaliseMobile(input: string) {
  const value = input.trim().replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(value)) throw new MobilePasswordAuthError("MOBILE_INVALID", "Use an E.164 mobile number, for example +919876543210.");
  return value;
}
export function normaliseEmail(input: string) {
  const value = input.trim().toLowerCase();
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new MobilePasswordAuthError("EMAIL_INVALID", "Enter a valid email address.");
  return value;
}
export function mobileLookupHash(mobile: string) { return crypto.createHmac("sha256", process.env.MAMA_AI_MOBILE_LOOKUP_PEPPER ?? "development-only-mobile-pepper").update(mobile).digest("hex"); }
export function emailLookupHash(email: string) { return crypto.createHmac("sha256", process.env.MAMA_AI_EMAIL_LOOKUP_PEPPER ?? "development-only-email-pepper").update(email).digest("hex"); }
export function assertPasswordPolicy(password: string) {
  if (!isPasswordLengthValid(password)) throw new MobilePasswordAuthError("PASSWORD_POLICY", PASSWORD_HELP_TEXT);
}
export function generateRecoveryCodes() { return Array.from({ length: 8 }, () => crypto.randomBytes(5).toString("hex").toUpperCase()); }
export function recoveryCodeHash(code: string) { return crypto.createHmac("sha256", process.env.MAMA_AI_RECOVERY_CODE_PEPPER ?? "development-only-recovery-pepper").update(code.replace(/\s/g, "").toUpperCase()).digest("hex"); }
function transferAuthorizationHash(code: string) { return crypto.createHmac("sha256", process.env.MAMA_AI_TRANSFER_AUTHORIZATION_PEPPER ?? "development-only-transfer-pepper").update(code).digest("hex"); }
export async function hashPassword(password: string) { return argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }); }

export class MobilePasswordAuthService {
  constructor(private readonly repository = new AccountSecurityRepository(), private readonly clock = () => new Date()) {}
  private newSession(rememberDevice = true) { const createdAt = this.clock(); const expiresAt = new Date(createdAt.getTime() + (rememberDevice ? TRUSTED_DEVICE_SESSION_MAX_AGE_SECONDS : CUSTOMER_SESSION_MAX_AGE_SECONDS) * 1000); const token = createOpaqueSessionToken(); return { token, rememberDevice, tokenHash: hashSessionToken(token), createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString(), expiresAtEpoch: Math.floor(expiresAt.getTime() / 1000) }; }

  async register(input: { mobile: string; password: string; deviceId: string; deviceLabel: string; staySignedIn?: boolean }) {
    const mobile = normaliseMobile(input.mobile); assertPasswordPolicy(input.password);
    const mobileHash = mobileLookupHash(mobile); if (await this.repository.getAccountByMobileHash(mobileHash)) throw new MobilePasswordAuthError("MOBILE_ALREADY_REGISTERED", "This mobile number already has an account.", 409);
    const now = this.clock().toISOString(); const userId = crypto.randomUUID(); const account: PasswordAccountRecord = { userId, mobileHash, passwordHash: await hashPassword(input.password), mobileVerificationStatus: "unverified", deviceActivationVersion: 0, passwordVersion: 0, createdAt: now, updatedAt: now };
    await this.repository.createAccount(account);
    const recoveryCodes = generateRecoveryCodes(); await this.repository.saveRecoveryCodeHashes(userId, recoveryCodes.map(recoveryCodeHash));
    return { ...(await this.activate(account, input.deviceId, input.deviceLabel, "lost_device", false, input.staySignedIn !== false)), recoveryCodes };
  }

  async registerEmail(input: { fullName: string; email: string; password: string; mobile?: string; deviceId: string; deviceLabel: string; staySignedIn?: boolean }) {
    const fullName = input.fullName.trim().replace(/\s+/g, " ");
    if (fullName.length < 2 || fullName.length > 120) throw new MobilePasswordAuthError("NAME_INVALID", "Enter your full name.");
    const email = normaliseEmail(input.email); assertPasswordPolicy(input.password);
    const emailHash = emailLookupHash(email);
    if (await this.repository.getAccountByEmailHash(emailHash)) throw new MobilePasswordAuthError("EMAIL_ALREADY_REGISTERED", "An account already exists for this email address.", 409);
    const mobile = input.mobile?.trim() ? normaliseMobile(input.mobile) : undefined;
    const mobileHash = mobile ? mobileLookupHash(mobile) : undefined;
    if (mobileHash && await this.repository.getAccountByMobileHash(mobileHash)) throw new MobilePasswordAuthError("MOBILE_ALREADY_REGISTERED", "This mobile number already has an account.", 409);
    const now = this.clock().toISOString(); const userId = crypto.randomUUID();
    const account: PasswordAccountRecord = { userId, fullName, emailHash, mobileHash, passwordHash: await hashPassword(input.password), mobileVerificationStatus: "unverified", deviceActivationVersion: 0, passwordVersion: 0, createdAt: now, updatedAt: now };
    await this.repository.createAccount(account);
    const recoveryCodes = generateRecoveryCodes(); await this.repository.saveRecoveryCodeHashes(userId, recoveryCodes.map(recoveryCodeHash));
    return { ...(await this.activate(account, input.deviceId, input.deviceLabel, "lost_device", false, input.staySignedIn !== false)), recoveryCodes };
  }

  async login(input: { mobile: string; password: string; deviceId: string; deviceLabel: string; staySignedIn?: boolean }) {
    const account = await this.repository.getAccountByMobileHash(mobileLookupHash(normaliseMobile(input.mobile)));
    if (!account || !(await argon2.verify(account.passwordHash, input.password))) throw new MobilePasswordAuthError("LOGIN_FAILED", "Mobile number or password is incorrect.", 401);
    if (account.activeDeviceId && account.activeDeviceId !== input.deviceId) throw new MobilePasswordAuthError("DEVICE_TRANSFER_REQUIRED", "Another device is active. Confirm a device transfer to continue on this device.", 409);
    return this.activate(account, input.deviceId, input.deviceLabel, "lost_device", false, input.staySignedIn !== false);
  }

  async loginWithEmail(input: { email: string; password: string; deviceId: string; deviceLabel: string; staySignedIn?: boolean }) {
    const account = await this.repository.getAccountByEmailHash(emailLookupHash(normaliseEmail(input.email)));
    if (!account || !(await argon2.verify(account.passwordHash, input.password))) throw new MobilePasswordAuthError("LOGIN_FAILED", "Email or password is incorrect.", 401);
    if (account.activeDeviceId && account.activeDeviceId !== input.deviceId) throw new MobilePasswordAuthError("DEVICE_TRANSFER_REQUIRED", "Another device is active. Confirm a device transfer to continue on this device.", 409);
    return this.activate(account, input.deviceId, input.deviceLabel, "lost_device", false, input.staySignedIn !== false);
  }

  async requestTransfer(input: { userId: string; password: string; deviceId: string; deviceLabel: string; reason: "discretionary" | "lost_device" }) {
    const account = await this.repository.getAccount(input.userId); if (!account) throw new MobilePasswordAuthError("ACCOUNT_NOT_FOUND", "Account not found.", 404);
    if (!(await argon2.verify(account.passwordHash, input.password))) throw new MobilePasswordAuthError("RECENT_PASSWORD_REQUIRED", "Confirm your password to transfer this account.", 401);
    if (account.activeDeviceId === input.deviceId) return this.activate(account, input.deviceId, input.deviceLabel, input.reason, false);
    const policy = await this.repository.getTransferPolicy(input.userId); if (!policy) throw new MobilePasswordAuthError("TRANSFER_POLICY_MISSING", "Device transfer policy is unavailable.", 503);
    const cutoff = this.clock().getTime() - 365 * DAY_MS;
    const freeUsed = policy.freeTransferTimestamps.filter((timestamp) => new Date(timestamp).getTime() >= cutoff).length;
    const paymentRequired = input.reason === "discretionary" && freeUsed >= FREE_TRANSFER_LIMIT;
    if (paymentRequired) {
      const paymentIntentId = crypto.randomUUID(); await this.repository.savePayment({ paymentIntentId, userId: input.userId, transferId: crypto.randomUUID(), amountPaise: TRANSFER_COST_PAISE, currency: "INR", status: "pending", createdAt: this.clock().toISOString() });
      throw new MobilePasswordAuthError("TRANSFER_PAYMENT_REQUIRED", paymentIntentId, 402);
    }
    return this.activate(account, input.deviceId, input.deviceLabel, input.reason, input.reason === "discretionary");
  }

  private async activate(account: PasswordAccountRecord, deviceId: string, label: string, reason: "discretionary" | "lost_device", confirmationPending: boolean, rememberDevice = true) {
    const policy = await this.repository.getTransferPolicy(account.userId); if (!policy) throw new MobilePasswordAuthError("TRANSFER_POLICY_MISSING", "Device transfer policy is unavailable.", 503);
    const now = this.clock(); const previousDevice = account.activeDeviceId ? await this.repository.getDevice(account.userId, account.activeDeviceId) : undefined;
    const device: DeviceRecord = { deviceId, label: label.trim().slice(0, 80) || "This device", activatedAt: now.toISOString(), confirmationDueAt: confirmationPending ? new Date(now.getTime() + 7 * DAY_MS).toISOString() : undefined, activationVersion: account.deviceActivationVersion + 1 };
    const transfer: TransferRecord = { transferId: crypto.randomUUID(), fromDeviceId: previousDevice?.deviceId, toDeviceId: deviceId, reason, status: confirmationPending ? "confirmation_pending" : reason === "lost_device" ? "lost_device_recovery" : "confirmed", paymentRequired: false, createdAt: now.toISOString() };
    const updatedPolicy = reason === "discretionary" ? { ...policy, freeTransferTimestamps: [...policy.freeTransferTimestamps.filter((item) => new Date(item).getTime() >= now.getTime() - 365 * DAY_MS), now.toISOString()] } : policy;
    const session = this.newSession(rememberDevice); await this.repository.activateDevice({ account, policy: updatedPolicy, device, previousDevice, transfer, session });
    return { userId: account.userId, token: session.token, expiresAt: new Date(session.expiresAt), mobileVerificationStatus: account.mobileVerificationStatus, confirmationPending };
  }

  async isSessionDeviceActive(userId: string, deviceId: string | undefined, activationVersion: number | undefined, passwordVersion?: number) {
    const account = await this.repository.getAccount(userId);
    // Preserve pre-reset legacy sessions, but revoke them after any password reset/change.
    if (!deviceId || activationVersion === undefined) return !account || (account.passwordVersion ?? 0) === 0;
    return Boolean(account && account.activeDeviceId === deviceId && account.deviceActivationVersion === activationVersion && (account.passwordVersion === undefined || account.passwordVersion === passwordVersion));
  }

  async resetWithRecoveryCode(input: { mobile: string; recoveryCode: string; newPassword: string; deviceId: string; deviceLabel: string; staySignedIn?: boolean }) {
    assertPasswordPolicy(input.newPassword); const account = await this.repository.getAccountByMobileHash(mobileLookupHash(normaliseMobile(input.mobile)));
    if (!account) throw new MobilePasswordAuthError("RECOVERY_FAILED", "Recovery details are invalid.", 401);
    try { await this.repository.consumeRecoveryCode(account.userId, recoveryCodeHash(input.recoveryCode)); } catch { throw new MobilePasswordAuthError("RECOVERY_FAILED", "Recovery details are invalid.", 401); }
    await this.repository.updatePasswordAtomically(account.userId, account.passwordVersion ?? 0, await hashPassword(input.newPassword));
    return this.activate(account, input.deviceId, input.deviceLabel, "lost_device", false, input.staySignedIn !== false);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    assertPasswordPolicy(newPassword); const account = await this.repository.getAccount(userId);
    if (!account || !(await argon2.verify(account.passwordHash, currentPassword))) throw new MobilePasswordAuthError("PASSWORD_CHANGE_REJECTED", "Current password is incorrect.", 401);
    if (await argon2.verify(account.passwordHash, newPassword)) throw new MobilePasswordAuthError("PASSWORD_REUSE", "Choose a different password.");
    try {
      await this.repository.updatePasswordAtomically(userId, account.passwordVersion ?? 0, await hashPassword(newPassword));
    } catch (error) {
      if ((error as { name?: string }).name === "ConditionalCheckFailedException") throw new MobilePasswordAuthError("PASSWORD_CHANGE_CONFLICT", "Password change could not be completed. Please sign in again and retry.", 409);
      throw error;
    }
  }
  async verifyCurrentPassword(userId: string, password: string) { const account = await this.repository.getAccount(userId); return Boolean(account && await argon2.verify(account.passwordHash, password)); }

  async regenerateRecoveryCodes(userId: string, password: string) {
    const account = await this.repository.getAccount(userId);
    if (!account || !(await argon2.verify(account.passwordHash, password))) throw new MobilePasswordAuthError("RECENT_PASSWORD_REQUIRED", "Confirm your password to regenerate recovery codes.", 401);
    const recoveryCodes = generateRecoveryCodes();
    try {
      await this.repository.regenerateRecoveryCodeHashes(userId, recoveryCodes.map(recoveryCodeHash), account.recoveryCodeVersion ?? 0);
    } catch (error) {
      if ((error as { name?: string }).name === "TransactionCanceledException") throw new MobilePasswordAuthError("RECOVERY_REGENERATION_CONFLICT", "Recovery codes changed in another request. Please try again.", 409);
      throw error;
    }
    return recoveryCodes;
  }

  async createTransferAuthorization(userId: string, password: string, reason: "discretionary" | "lost_device") {
    const account = await this.repository.getAccount(userId);
    if (!account || !(await argon2.verify(account.passwordHash, password))) throw new MobilePasswordAuthError("RECENT_PASSWORD_REQUIRED", "Confirm your password to authorize a device transfer.", 401);
    const code = crypto.randomBytes(24).toString("base64url"); const now = this.clock(); const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    await this.repository.createTransferAuthorization(userId, { authorizationHash: transferAuthorizationHash(code), reason, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(), expiresAtEpoch: Math.floor(expiresAt.getTime() / 1000) });
    return { code, expiresAt: expiresAt.toISOString() };
  }

  async completeAuthorizedTransfer(input: { mobile: string; password: string; authorizationCode: string; deviceId: string; deviceLabel: string; staySignedIn?: boolean }) {
    const account = await this.repository.getAccountByMobileHash(mobileLookupHash(normaliseMobile(input.mobile)));
    if (!account || !(await argon2.verify(account.passwordHash, input.password))) throw new MobilePasswordAuthError("LOGIN_FAILED", "Mobile number or password is incorrect.", 401);
    try { await this.repository.consumeTransferAuthorization(account.userId, transferAuthorizationHash(input.authorizationCode), this.clock().toISOString()); }
    catch { throw new MobilePasswordAuthError("TRANSFER_AUTHORIZATION_INVALID", "Transfer approval is invalid, expired, or already used.", 401); }
    return this.requestTransfer({ userId: account.userId, password: input.password, deviceId: input.deviceId, deviceLabel: input.deviceLabel, reason: "discretionary" });
  }
}
