const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const resolve = Module._resolveFilename;
Module._extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith("@/")) request = path.join(root, request.slice(2)) + ".ts";
  return resolve.call(this, request, parent, ...rest);
};

const { assertPasswordPolicy, MobilePasswordAuthError, MobilePasswordAuthService } = require("../lib/services/mobile-password-auth-service.ts");

function repository() {
  return {
    getAccountByMobileHash: async () => undefined,
    getAccountByEmailHash: async () => undefined,
    createAccount: async () => undefined,
    saveRecoveryCodeHashes: async () => undefined,
    getTransferPolicy: async () => ({ freeTransferTimestamps: [], transfers: [] }),
    getDevice: async () => undefined,
    activateDevice: async () => undefined,
  };
}

test("password policy accepts only 8 through 12 characters", () => {
  for (const length of [8, 10, 12]) assert.doesNotThrow(() => assertPasswordPolicy("a".repeat(length)));
  for (const length of [7, 13]) assert.throws(() => assertPasswordPolicy("a".repeat(length)), (error) => error instanceof MobilePasswordAuthError && error.code === "PASSWORD_POLICY");
});

test("mobile and email registration enforce the same password policy", async () => {
  for (const length of [7, 13]) {
    const password = "a".repeat(length);
    await assert.rejects(new MobilePasswordAuthService(repository()).register({ mobile: "+919999000001", password, deviceId: "fictional-mobile-device", deviceLabel: "Fictional" }), { code: "PASSWORD_POLICY" });
    await assert.rejects(new MobilePasswordAuthService(repository()).registerEmail({ fullName: "Fictional Tester", email: "fictional@example.test", password, deviceId: "fictional-email-device", deviceLabel: "Fictional" }), { code: "PASSWORD_POLICY" });
  }
});
