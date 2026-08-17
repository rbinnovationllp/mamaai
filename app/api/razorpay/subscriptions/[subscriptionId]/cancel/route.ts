import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay-service";
import { cancelRazorpaySubscriptionSchema } from "@/lib/shared/schemas";
import { authErrorResponse, requireUser } from "@/lib/server/auth";

interface RouteContext {
  params: Promise<{
    subscriptionId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { subscriptionId } = await context.params;
    const body = await request.json();
    const parsed = cancelRazorpaySubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Razorpay cancellation request is invalid." } },
        { status: 400 }
      );
    }

    const user = requireUser(request, parsed.data.userId);
    const result = await new RazorpayService().cancelSubscription({
      userId: user.userId,
      razorpaySubscriptionId: subscriptionId,
      cancelAtCycleEnd: parsed.data.cancelAtCycleEnd
    });

    if (!result.configured) {
      return NextResponse.json(
        {
          configured: false,
          status: "testing_stage_not_configured",
          message: result.message,
          judgeDemoUnaffected: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      cancelled: true,
      subscriptionRecord: result.subscriptionRecord
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      {
        error: {
          code: "RAZORPAY_CANCEL_FAILED",
          message: error instanceof Error ? error.message : "Unable to cancel Razorpay subscription."
        }
      },
      { status: 500 }
    );
  }
}
