import { NextResponse } from "next/server";
import { RecipeVideoService } from "@/lib/services/recipe-video-service";
import { recipeVideoSearchRequestSchema } from "@/lib/shared/schemas";

const service = new RecipeVideoService();

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = recipeVideoSearchRequestSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid recipe video search request.", details: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const result = await service.search(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "RECIPE_VIDEO_SEARCH_FAILED",
          message: error instanceof Error ? error.message : "Recipe video search failed."
        }
      },
      { status: 500 }
    );
  }
}
