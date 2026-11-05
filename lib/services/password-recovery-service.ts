import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { PasswordRecoveryRepository, type RecoveryChannel, type RecoveryStore } from "@/lib/repositories/password-recovery-repository";
import { assertPasswordPolicy, emailLookupHash, mobileLookupHash, normaliseEmail, normaliseMobile, recoveryCodeHash, hashPassword } from "./mobile-password-auth-service";

export class PasswordRecoveryError extends Error { constructor(public code = "RECOVERY_INVALID", public status = 400) { super("Recovery could not be completed."); } }
export interface RecoveryDelivery {
  available(channel: RecoveryChannel): boolean;
  send(input: { channel: RecoveryChannel; destination: string; code: string; expiresInSeconds: number }): Promise<void>;
}
/** Replace only after a vetted SMS/email adapter and verified-contact enrollment exist. */
export const unavailableRecoveryDelivery: RecoveryDelivery = { available: () => false, send: async () => { throw new PasswordRecoveryError("RECOVERY_DELIVERY_UNAVAILABLE", 503); } };
export class PasswordRecoveryService {
  constructor(private store: RecoveryStore = new PasswordRecoveryRepository(), private delivery: RecoveryDelivery = unavailableRecoveryDelivery, private clock = () => Date.now(), private secret = process.env.MAMA_AI_RECOVERY_CHALLENGE_SECRET ?? "") {}
  private contact(channel: RecoveryChannel, identifier: string) {
    try { const value = channel === "mobile" ? normaliseMobile(identifier) : normaliseEmail(identifier); return { value, hash: channel === "mobile" ? mobileLookupHash(value) : emailLookupHash(value) }; }
    catch { throw new PasswordRecoveryError(); }
  }
  private codeHash(id: string, code: string) { if (this.secret.length < 32) throw new PasswordRecoveryError("RECOVERY_DELIVERY_UNAVAILABLE", 503); return createHmac("sha256", this.secret).update(`${id}:${code}`).digest("hex"); }
  async request(channel: RecoveryChannel, identifier: string) {
    const contact = this.contact(channel, identifier);
    if (!this.delivery.available(channel)) throw new PasswordRecoveryError("RECOVERY_DELIVERY_UNAVAILABLE", 503);
    const challengeId = randomUUID(), code = String(randomInt(0, 1_000_000)).padStart(6, "0"), codeHash = this.codeHash(challengeId, code);
    const account = await this.store.find(channel, contact.hash);
    const verified = channel === "mobile" ? account?.mobileVerificationStatus === "verified" : account?.emailVerificationStatus === "verified";
    if (account && verified) {
      await this.store.save({ challengeId, userId: account.userId, channel, contactHash: contact.hash, codeHash, passwordVersion: account.passwordVersion ?? 0, attempts: 0, expiresAt: Math.floor(this.clock() / 1000) + 600 });
      // Delivery failure must not reveal whether this contact has an account.
      try { await this.delivery.send({ channel, destination: contact.value, code, expiresInSeconds: 600 }); } catch { /* The same generic request response is returned. No codes or contacts are logged. */ }
    }
    return { challengeId };
  }
  async verify(challengeId: string, code: string, newPassword: string) {
    assertPasswordPolicy(newPassword);
    const challenge = await this.store.get(challengeId), now = Math.floor(this.clock() / 1000);
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= now || challenge.attempts >= 5) throw new PasswordRecoveryError();
    const supplied = Buffer.from(this.codeHash(challengeId, code)), expected = Buffer.from(challenge.codeHash);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) { await this.store.failedAttempt(challengeId).catch(() => undefined); throw new PasswordRecoveryError(); }
    const account = await this.store.getAccount(challenge.userId);
    const verified = challenge.channel === "mobile" ? account?.mobileVerificationStatus === "verified" && account.mobileHash === challenge.contactHash : account?.emailVerificationStatus === "verified" && account.emailHash === challenge.contactHash;
    if (!account || !verified || (account.passwordVersion ?? 0) !== challenge.passwordVersion) throw new PasswordRecoveryError();
    try { await this.store.reset(account, await hashPassword(newPassword), { challenge, now }); } catch { throw new PasswordRecoveryError(); }
    return { reset: true };
  }
  async savedCode(channel: RecoveryChannel, identifier: string, code: string, newPassword: string) {
    assertPasswordPolicy(newPassword);
    const contact = this.contact(channel, identifier), account = await this.store.find(channel, contact.hash);
    // Possession of an established saved code proves ownership; a contact alone never does.
    const passwordHash = await hashPassword(newPassword);
    if (!account) throw new PasswordRecoveryError();
    try { await this.store.reset(account, passwordHash, { recoveryCodeHash: recoveryCodeHash(code) }); } catch { throw new PasswordRecoveryError(); }
    return { reset: true };
  }
}
