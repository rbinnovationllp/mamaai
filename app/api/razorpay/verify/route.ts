import { NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/services/razorpay-service';
import { normalizePlanTier } from '@/lib/shared/schemas';
import type { SubscriptionPlan } from '@/lib/shared/contracts';
import { authErrorResponse, requireUser } from '@/lib/server/auth';

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

    const user = requireUser(req, userId);
    const service = new RazorpayService();

    if (
      !service.verifyCheckoutSignature({
        razorpayPaymentId: razorpay_payment_id,
        razorpaySubscriptionId: razorpay_subscription_id,
        razorpaySignature: razorpay_signature,
      })
    ) {
      return NextResponse.json(
        { error: { code: 'INVALID_SIGNATURE', message: 'Payment verification failed.' } },
        { status: 400 }
      );
    }

    const normalizedPlan = normalizePlanTier(planTier || 'starter') as SubscriptionPlan;
    const subscriptionRecord = await service.upsertSubscriptionFromProvider({
      userId: user.userId,
      plan: normalizedPlan,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayPaymentId: razorpay_payment_id,
      eventType: 'subscription.activated',
      providerStatus: 'active',
    });

    return NextResponse.json({ success: true, message: 'Subscription verification recorded.', subscriptionRecord });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: { code: 'VERIFICATION_ERROR', message: 'Failed to process payment verification.' } },
      { status: 500 }
    );
  }
}
