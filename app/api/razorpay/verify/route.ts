import { NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/services/razorpay-service';
import { authErrorResponse, requireUser } from '@/lib/server/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      userId,
      planTier: _clientPlanTier,
    } = body;

    const user = requireUser(req);
    if (userId && userId !== user.userId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'The payment customer does not match the signed-in customer.' } }, { status: 403 });
    }
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

    const providerPlan = await service.resolveProviderPlan(razorpay_subscription_id);

    const subscriptionRecord = await service.upsertSubscriptionFromProvider({
      userId: user.userId,
      plan: providerPlan.plan,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpayPlanId: providerPlan.planId,
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
