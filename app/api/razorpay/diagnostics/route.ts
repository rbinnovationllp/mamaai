import crypto from "crypto";
import { NextResponse } from "next/server";

function hashPrefix(value?: string) {
  if (!value) return null;
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function normalizePlanId(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/plan_[A-Za-z0-9]+/);
  return match?.[0] ?? trimmed;
}

function summarizeValue(value?: string, isSecret = false) {
  const raw = value ?? "";
  const trimmed = raw.trim();
  return {
    configured: Boolean(trimmed),
    length: trimmed.length,
    rawLength: raw.length,
    hasOuterQuotes:
      trimmed.startsWith("\"") ||
      trimmed.endsWith("\"") ||
      trimmed.startsWith("'") ||
      trimmed.endsWith("'"),
    hasLeadingOrTrailingWhitespace: raw.length !== trimmed.length,
    prefix: isSecret ? undefined : trimmed.slice(0, 9),
    suffix: isSecret ? undefined : trimmed.slice(-4),
    hash: hashPrefix(trimmed),
  };
}

async function checkRazorpayAuth(keyId?: string, keySecret?: string) {
  if (!keyId || !keySecret) {
    return {
      attempted: false,
      status: null,
      ok: false,
      errorCode: "MISSING_RAZORPAY_CREDENTIALS",
      errorDescription: "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.",
    };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/plans?count=1", {
    headers: {
      Authorization: `Basic ${auth}`,
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; description?: string };
  };

  return {
    attempted: true,
    status: response.status,
    ok: response.ok,
    errorCode: data.error?.code ?? null,
    errorDescription: data.error?.description ?? null,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const suppliedKey =
      request.headers.get("x-mamaai-diagnostic-key") ??
      body?.diagnosticKey ??
      "";

    const allowedDiagnosticKeys = [
      process.env.JUDGE_TEST_KEY,
      process.env.MAMAAI_JUDGE_TEST_KEY,
      process.env.RAZORPAY_DIAGNOSTIC_KEY,
    ]
      .map((value) => value?.trim())
      .filter(Boolean);

    if (!allowedDiagnosticKeys.includes(String(suppliedKey).trim())) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Diagnostic key is invalid." } },
        { status: 401 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
    const authCheck = await checkRazorpayAuth(keyId, keySecret);

    const planEnvNames = [
      "RAZORPAY_PLAN_STARTER_MONTHLY",
      "RAZORPAY_PLAN_PREMIUM_MONTHLY",
      "RAZORPAY_PLAN_PLUS_MONTHLY",
      "RAZORPAY_PLAN_STARTER_USD",
      "RAZORPAY_PLAN_PREMIUM_USD",
      "RAZORPAY_PLAN_PLUS_USD",
    ] as const;

    return NextResponse.json({
      safe: true,
      note: "No secrets are returned. Hashes are for comparison only.",
      razorpayApiAuthentication: authCheck.ok ? "PASS" : "FAIL",
      authCheck,
      env: {
        RAZORPAY_KEY_ID: summarizeValue(process.env.RAZORPAY_KEY_ID),
        NEXT_PUBLIC_RAZORPAY_KEY_ID: summarizeValue(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
        RAZORPAY_KEY_SECRET: summarizeValue(process.env.RAZORPAY_KEY_SECRET, true),
        publicKeyMatchesServerKey: Boolean(keyId && publicKeyId && keyId === publicKeyId),
      },
      plans: Object.fromEntries(
        planEnvNames.map((name) => {
          const raw = process.env[name];
          const normalized = normalizePlanId(raw);
          return [
            name,
            {
              configured: Boolean(normalized),
              rawLength: raw?.length ?? 0,
              normalizedLength: normalized?.length ?? 0,
              prefix: normalized?.slice(0, 5) ?? null,
              hash: hashPrefix(normalized),
            },
          ];
        })
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "RAZORPAY_DIAGNOSTIC_FAILED",
          message: error instanceof Error ? error.message : "Unable to run Razorpay diagnostic.",
        },
      },
      { status: 500 }
    );
  }
}



