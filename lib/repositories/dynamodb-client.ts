import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { type DynamoDbConfiguration, getDynamoDbConfiguration } from "@/lib/server/dynamodb-configuration";

let cachedClient: { key: string; client: DynamoDBDocumentClient } | undefined;

type OidcCredentialsProvider = typeof awsCredentialsProvider;

/**
 * The isolated Vercel project must use its request-scoped OIDC token to obtain
 * temporary AWS credentials. Returning undefined is intentional for the live
 * production runtime, which preserves its established credential mechanism.
 */
export function getDynamoCredentials(
  configuration: DynamoDbConfiguration,
  provider: OidcCredentialsProvider = awsCredentialsProvider
) {
  if (configuration.runtime !== "isolated" && configuration.runtime !== "preview") return undefined;
  if (!configuration.roleArn) throw new Error("Validated isolated DynamoDB configuration is missing AWS_ROLE_ARN.");
  return provider({ roleArn: configuration.roleArn });
}

export function getMamaAiTableName() {
  return getDynamoDbConfiguration().tableName;
}

export function getMamaAiAnalyticsTableName() {
  return getDynamoDbConfiguration().analyticsTableName;
}

export function getMamaAiGsi1Name() {
  return getDynamoDbConfiguration().gsi1Name;
}

export function getMamaAiDynamoDb() {
  const configuration = getDynamoDbConfiguration();
  const key = `${configuration.runtime}:${configuration.region}:${configuration.roleArn ?? "default"}`;
  if (!cachedClient || cachedClient.key !== key) {
    cachedClient = {
      key,
      client: DynamoDBDocumentClient.from(
        new DynamoDBClient({
          region: configuration.region,
          credentials: getDynamoCredentials(configuration),
        }),
        { marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true } }
      ),
    };
  }
  return cachedClient.client;
}

// Commands are delegated only after configuration validation. This compatibility export
// keeps existing repositories from constructing an SDK client with default credentials/region.
const validatedSend = ((...args: unknown[]) => getMamaAiDynamoDb().send(...(args as Parameters<DynamoDBDocumentClient["send"]>))) as DynamoDBDocumentClient["send"];

export const mamaAiDynamoDb: Pick<DynamoDBDocumentClient, "send"> = {
  send: validatedSend,
};

