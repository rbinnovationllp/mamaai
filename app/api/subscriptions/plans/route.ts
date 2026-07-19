import { NextResponse } from "next/server";
import { SubscriptionService } from "@/lib/services/subscription-service";

export async function GET() {
  return NextResponse.json({
    plans: new SubscriptionService().getPlans(),
    judgeDemoAccess: {
      bypassesPayment: true,
      usesFictionalDataOnly: true,
      purpose: "Codex Hackathon judge review without registration, payment, or subscription friction."
    }
  });
}
