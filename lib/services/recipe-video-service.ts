import type {
  RecipeVideoResult,
  RecipeVideoSearchRequest,
  RecipeVideoSearchResponse,
} from "@/lib/shared/contracts";

const thirdPartyDisclaimer =
  "External recipe videos are third-party content. MAMA AI has not medically or nutritionally verified the video unless explicitly marked as reviewed.";

function countryToRegionCode(country?: string): string {
  const normalized = country?.trim().toLowerCase();
  if (!normalized) return "US";
  const known: Record<string, string> = {
    india: "IN",
    usa: "US",
    "united states": "US",
    uk: "GB",
    "united kingdom": "GB",
    canada: "CA",
    australia: "AU",
    singapore: "SG",
    uae: "AE",
    "united arab emirates": "AE",
  };
  return known[normalized] ?? (country && country.length === 2 ? country.toUpperCase() : "US");
}

function buildQuery(request: RecipeVideoSearchRequest): string {
  return [
    request.dishName,
    request.region,
    request.country,
    request.preferredLanguage,
    request.cuisine?.join(" "),
    request.dietaryPreference?.replace("_", " "),
    request.healthyPreparation ? "healthy home cooking" : "home cooking",
    request.familyRequirements?.join(" "),
    "recipe",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackResult(query: string, dishName: string): RecipeVideoResult {
  return {
    title: `Watch ${dishName} Recipe Video`,
    channelTitle: "YouTube Search",
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    source: "fallback_search",
    thirdPartyDisclaimer,
  };
}

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
};

export class RecipeVideoService {
  async search(request: RecipeVideoSearchRequest): Promise<RecipeVideoSearchResponse> {
    const query = buildQuery(request);
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return {
        query,
        usedOfficialApi: false,
        status: "demo_test_only",
        statusLabel: "YouTube Video Search Link",
        results: [fallbackResult(query, request.dishName)],
        note: "Direct YouTube search link provided for testing mode. The written recipe remains available.",
      };
    }

    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("q", query);
      url.searchParams.set("type", "video");
      url.searchParams.set("maxResults", "3");
      url.searchParams.set("safeSearch", "strict");
      url.searchParams.set("videoEmbeddable", "true");
      url.searchParams.set("regionCode", countryToRegionCode(request.country));
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());
      if (!response.ok) {
        return {
          query,
          usedOfficialApi: true,
          status: "demo_test_only",
          statusLabel: "Demo/Test Fallback",
          results: [fallbackResult(query, request.dishName)],
          note: "YouTube API quota or error encountered; safe YouTube link returned. The written recipe remains available.",
        };
      }

      const payload = (await response.json()) as { items?: YouTubeSearchItem[] };
      const results: RecipeVideoResult[] = (payload.items ?? [])
        .filter((item) => item.id?.videoId)
        .map((item) => ({
          title: item.snippet?.title ?? request.dishName,
          channelTitle: item.snippet?.channelTitle ?? "YouTube",
          url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
          thumbnailUrl:
            item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url,
          source: "youtube" as const,
          thirdPartyDisclaimer,
        }));

      return {
        query,
        usedOfficialApi: true,
        status: "fully_functional",
        statusLabel: "Fully Functional",
        results: results.length ? results : [fallbackResult(query, request.dishName)],
        note: "Results retrieved from official YouTube Data API.",
      };
    } catch {
      return {
        query,
        usedOfficialApi: false,
        status: "demo_test_only",
        statusLabel: "Demo/Test Fallback",
        results: [fallbackResult(query, request.dishName)],
        note: "Video search fallback active. Written recipe remains available.",
      };
    }
  }
}