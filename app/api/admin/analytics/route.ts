import { NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics-service";

export async function GET() {
  return NextResponse.json(new AnalyticsService().summary());
}
