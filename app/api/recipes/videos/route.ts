import { NextResponse } from "next/server";
import { RecipeVideoService } from "@/lib/services/recipe-video-service";
import { recipeVideoSearchRequestSchema } from "@/lib/shared/schemas";
import type { RecipeVideoSearchRequest } from "@/lib/shared/contracts";

const service = new RecipeVideoService();

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = recipeVideoSearchRequestSchema.safeParse(payload);
    
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid recipe video search request.",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const result = await service.search(parsed.data as RecipeVideoSearchRequest);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Recipe video search failed.";

    console.error("[RECIPE_VIDEOS_ERROR]:", error);

    // Return real error details to make testing and debugging clear
    return NextResponse.json(
      {
        videos: [],
        warning: {
          code: "RECIPE_VIDEO_SEARCH_FALLBACK",
          message: errorMessage,
        },
      },
      { status: 200 } // Return 200 with empty/fallback videos list so client components don't crash
    );
  }
}
