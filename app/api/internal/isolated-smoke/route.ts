import * as crypto from "crypto";
import { NextResponse } from "next/server";
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoDbConfiguration } from "@/lib/server/dynamodb-configuration";
import { getMamaAiDynamoDb } from "@/lib/repositories/dynamodb-client";

export const dynamic = "force-dynamic";

const EXPECTED_REGION = "ap-south-1";
const EXPECTED_ROLE = "arn:aws:iam::624719611353:role/MAMAAI-Vercel-Preview-Role";
const EXPECTED_TABLE = "mamaai-preview-test";
const EXPECTED_GSI = "GSI1";
const SECRET_HEADER = "x-mamaai-isolated-smoke-secret";

function authorized(request: Request) {
  const expected = process.env.MAMA_AI_ISOLATED_SMOKE_TEST_SECRET;
  const supplied = request.headers.get(SECRET_HEADER);
  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function denied(category: string, status = 403) {
  return NextResponse.json({ ok: false, category }, { status });
}

export async function POST(request: Request) {
  if (process.env.MAMA_AI_ISOLATED_PREVIEW !== "true") return denied("isolated_runtime_required");
  if (process.env.MAMA_AI_AWS_IDENTITY_SCOPE !== "preview-isolated") return denied("isolated_scope_required");
  if (process.env.MAMA_AI_ISOLATED_SMOKE_TEST_ENABLED !== "true") return denied("smoke_test_disabled");
  if (!authorized(request)) return denied("unauthorized");

  let key: { PK: string; SK: string } | undefined;
  let client: ReturnType<typeof getMamaAiDynamoDb> | undefined;
  try {
    const configuration = getDynamoDbConfiguration();
    if (configuration.region !== EXPECTED_REGION || configuration.roleArn !== EXPECTED_ROLE || configuration.tableName !== EXPECTED_TABLE || configuration.analyticsTableName !== EXPECTED_TABLE || configuration.gsi1Name !== EXPECTED_GSI) {
      return denied("configuration_rejected");
    }

    const runId = crypto.randomUUID();
    const now = new Date().toISOString();
    key = { PK: `ISOLATED_SMOKE#${runId}`, SK: "CURRENT" };
    const item = { ...key, GSI1PK: `ISOLATED_SMOKE#${runId}`, GSI1SK: now, entityType: "isolated_smoke", expiresAt: Math.floor(Date.now() / 1000) + 900 };
    client = getMamaAiDynamoDb();
    await client.send(new PutCommand({ TableName: EXPECTED_TABLE, Item: item, ConditionExpression: "attribute_not_exists(PK)" }));
    const read = await client.send(new GetCommand({ TableName: EXPECTED_TABLE, Key: key, ConsistentRead: true }));
    const index = await client.send(new QueryCommand({ TableName: EXPECTED_TABLE, IndexName: EXPECTED_GSI, KeyConditionExpression: "GSI1PK = :pk", ExpressionAttributeValues: { ":pk": item.GSI1PK }, Limit: 1 }));
    const gsiMatched = (index.Items ?? []).some((candidate) => candidate.PK === key?.PK && candidate.SK === key?.SK);
    await client.send(new DeleteCommand({ TableName: EXPECTED_TABLE, Key: key }));
    return NextResponse.json({ ok: Boolean(read.Item) && gsiMatched, oidcDynamoDb: Boolean(read.Item), write: true, read: Boolean(read.Item), gsi1: gsiMatched, cleanup: true });
  } catch {
    if (key && client) {
      try { await client.send(new DeleteCommand({ TableName: EXPECTED_TABLE, Key: key })); } catch { /* TTL remains a cleanup backstop after a failed smoke run. */ }
    }
    return NextResponse.json({ ok: false, category: "isolated_dynamodb_operation_failed" }, { status: 503 });
  }
}

