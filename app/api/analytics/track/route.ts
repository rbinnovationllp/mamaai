// app/api/analytics/track/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const docClient = DynamoDBDocumentClient.from(client);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { visitorId, eventType, path, referrer, device } = body;

    if (!visitorId || !eventType) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const ttlDays = 90 * 24 * 60 * 60;
    const expiresAt = Math.floor(Date.now() / 1000) + ttlDays;

    // Parse referrer source
    let source = 'Direct';
    if (referrer && referrer !== 'Direct') {
      if (referrer.includes('google')) source = 'Google/Search';
      else if (referrer.includes('youtube')) source = 'YouTube';
      else if (referrer.includes('whatsapp')) source = 'WhatsApp';
      else if (referrer.includes('facebook') || referrer.includes('instagram')) source = 'Meta';
      else source = 'Referral';
    }

    await docClient.send(
      new PutCommand({
        TableName: process.env.MAMA_AI_ANALYTICS_TABLE || 'MAMA_AI_ANALYTICS_EVENTS',
        Item: {
          PK: `EVENT#${today}`,
          SK: `${timestamp}#${visitorId}#${eventType}`,
          visitorId,
          eventType,
          path,
          source,
          device,
          expiresAt,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}