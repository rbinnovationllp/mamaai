import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' })
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      userId,
      planTier,
    } = body;

    // 1. Verify HMAC Signature
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: { code: 'INVALID_SIGNATURE', message: 'Payment verification failed.' } },
        { status: 400 }
      );
    }

    // 2. Grant Server-Side Subscription Entitlement in DynamoDB
    if (userId) {
      await dbClient.send(
        new UpdateCommand({
          TableName: process.env.MAMA_AI_TABLE_NAME || 'MAMA_AI_APP',
          Key: { PK: `USER#${userId}`, SK: 'PROFILE' },
          UpdateExpression:
            'SET planTier = :tier, subscriptionStatus = :status, updatedAt = :now',
          ExpressionAttributeValues: {
            ':tier': planTier || 'starter',
            ':status': 'active',
            ':now': new Date().toISOString(),
          },
        })
      );
    }

    return NextResponse.json({ success: true, message: 'Subscription entitlement granted.' });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'VERIFICATION_ERROR', message: 'Failed to process payment verification.' } },
      { status: 500 }
    );
  }
}