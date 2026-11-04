const { DeleteTableCommand, DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const name = process.env.MAMA_AI_DYNAMODB_TABLE_NAME;
if (!process.env.MAMA_AI_DYNAMODB_LOCAL || !/^mamaai-local-qa-[a-z0-9-]+$/i.test(name || "")) throw new Error("Refusing non-local table cleanup.");
const client = new DynamoDBClient({ region: "ap-south-1", endpoint: "http://127.0.0.1:8010", credentials: { accessKeyId: "LOCAL_TEST_ONLY", secretAccessKey: "LOCAL_TEST_ONLY" } });
client.send(new DeleteTableCommand({ TableName: name })).then(() => console.log(`LOCAL_TABLE_DELETED=${name}`)).catch((error) => { if (error.name !== "ResourceNotFoundException") throw error; }).catch((error) => { console.error(error); process.exitCode = 1; });
