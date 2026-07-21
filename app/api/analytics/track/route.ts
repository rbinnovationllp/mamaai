import { NextResponse } from "next/server";
import { z } from "zod";
import { AnalyticsService } from "@/lib/services/analytics-service";

const trackSchema = z.object({
  eventName: z.enum([
    "homepage_visit",
    "try_demo_click",
    "get_started_click",
    "create_family_success",
    "meal_plan_generated",
    "registration_success",
    "ask_mama_open",
    "ask_mama_question",
    "ask_mama_unresolved"
  ]),
  visitorId: z.string().min(8),
  sessionId: z.string().min(8),
  pagePath: z.string().min(1),
  referrer: z.string().optional(),
  source: z.string().optional(),
  category: z.string().max(80).optional(),
  label: z.string().max(120).optional(),
  deviceCategory: z.enum(["mobile", "desktop", "tablet", "unknown"])
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Analytics event is invalid." } }, { status: 400 });
    }

    const result = new AnalyticsService().track({
      ...parsed.data,
      country: request.headers.get("x-vercel-ip-country") ?? undefined,
      region: request.headers.get("x-vercel-ip-country-region") ?? undefined
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: { code: "ANALYTICS_TRACK_FAILED", message: "Unable to record analytics event." } }, { status: 500 });
  }
}
