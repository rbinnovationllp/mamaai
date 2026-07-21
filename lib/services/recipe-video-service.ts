import type { RecipeVideoResult, RecipeVideoSearchRequest, RecipeVideoSearchResponse } from "@/lib/shared/contracts";

const thirdPartyDisclaimer =
  "External recipe videos are third-party content. MAMA AI has not medically or nutritionally verified the video unless explicitly marked as reviewed.";

function countryToRegionCode(country?: string) {
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
    "united arab emirates": "AE"
  };
  return known[normalized] ?? (country && country.length === 2 ? country.toUpperCase() : "US");
}

function buildQuery(request: RecipeVideoSearchRequest) {
  return [
    request.dishName,
    request.region,
    request.country,
    request.preferredLanguage,
    request.cuisine?.join(" "),
    request.dietaryPreference?.replace("_", " "),
    request.healthyPreparation ? "healthy home cooking" : "home cooking",
    request.familyRequirements?.join(" "),
    "recipe"
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackResult(query: string): RecipeVideoResult {
  return {
    title: `Search YouTube for: ${query}`,
    channelTitle: "YouTube search",
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    source: "fallback_search",
    thirdPartyDisclaimer
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
        results: [fallbackResult(query)],
        note: "YOUTUBE_API_KEY is not configured, so MAMA AI is returning a safe YouTube search link instead of API-ranked videos."
      };
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "3");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("regionCode", countryToRegionCode(request.country));
    url.searchParams.set("key", apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      return {
        query,
        usedOfficialApi: true,
        results: [fallbackResult(query)],
        note: "The official YouTube API request failed, so MAMA AI returned a safe search fallback."
      };
    }

    const payload = (await response.json()) as { items?: YouTubeSearchItem[] };
    const results = (payload.items ?? [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        title: item.snippet?.title ?? request.dishName,
        channelTitle: item.snippet?.channelTitle ?? "YouTube",
        url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url,
        source: "youtube" as const,
        thirdPartyDisclaimer
      }));

    return {
      query,
      usedOfficialApi: true,
      results: results.length ? results : [fallbackResult(query)],
      note: "Results come from the official YouTube Data API search endpoint and are third-party content."
    };
  }
}
