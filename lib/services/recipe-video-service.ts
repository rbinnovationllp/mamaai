import type {
  RecipeVideoResult,
  RecipeVideoSearchRequest,
  RecipeVideoSearchResponse,
} from "@/lib/shared/contracts";

const thirdPartyDisclaimer =
  "External recipe videos are third-party content. MAMA AI has not medically or nutritionally verified the video unless explicitly marked as reviewed.";
const approvedDisclaimer =
  "MAMAAI approved recipe-video mapping. Still verify ingredients against your saved family restrictions before cooking.";
const sponsoredDisclaimer =
  "Sponsored Recipe Video / Paid Promotion. MAMAAI labels paid placements clearly; verify ingredients against your saved family restrictions.";

type RecipeVideoMapping = {
  recipeName: string;
  cuisine: string[];
  language: "en" | "hi" | "kn";
  videoUrl: string;
  channelName: string;
  sponsorName?: string;
  sponsored: boolean;
  campaignStart?: string;
  campaignEnd?: string;
  targetRegion?: string;
  dietaryTags: string[];
  approved: boolean;
  priority: number;
  enabled: boolean;
};

const approvedVideoMappings: RecipeVideoMapping[] = [
  {
    recipeName: "Vegetable Moong Dal Khichdi with Curd",
    cuisine: ["Indian"],
    language: "hi",
    videoUrl: "https://www.youtube.com/results?search_query=vegetable+moong+dal+khichdi+recipe+hindi",
    channelName: "Curated YouTube Search",
    sponsored: false,
    dietaryTags: ["vegetarian"],
    approved: true,
    priority: 10,
    enabled: true,
  },
  {
    recipeName: "Vegetable Moong Dal Khichdi with Curd",
    cuisine: ["Indian"],
    language: "en",
    videoUrl: "https://www.youtube.com/results?search_query=vegetable+moong+dal+khichdi+recipe",
    channelName: "Curated YouTube Search",
    sponsored: false,
    dietaryTags: ["vegetarian"],
    approved: true,
    priority: 9,
    enabled: true,
  },
  {
    recipeName: "Vegan Dal, Millet-Rice and Seasonal Sabzi Plate",
    cuisine: ["Indian"],
    language: "en",
    videoUrl: "https://www.youtube.com/results?search_query=vegan+dal+millet+rice+seasonal+sabzi+recipe",
    channelName: "Curated YouTube Search",
    sponsored: false,
    dietaryTags: ["vegan"],
    approved: true,
    priority: 8,
    enabled: true,
  },
];

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
    matchQuality: "fallback",
    thirdPartyDisclaimer,
  };
}

function normalizeDish(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function selectedLanguage(value?: string): "en" | "hi" | "kn" {
  if (value === "hi" || value === "kn") return value;
  return "en";
}

function conflictsWithDiet(mapping: RecipeVideoMapping, request: RecipeVideoSearchRequest) {
  if (!request.dietaryPreference) return false;
  const tags = new Set(mapping.dietaryTags);
  if (request.dietaryPreference === "vegan") return !tags.has("vegan");
  if (request.dietaryPreference === "vegetarian") return tags.has("non_vegetarian");
  return false;
}

function mappedVideos(request: RecipeVideoSearchRequest): RecipeVideoResult[] {
  const dish = normalizeDish(request.dishName);
  const language = selectedLanguage(request.preferredLanguage);
  return approvedVideoMappings
    .filter((mapping) => mapping.enabled && mapping.approved)
    .filter((mapping) => normalizeDish(mapping.recipeName) === dish || dish.includes(normalizeDish(mapping.recipeName)) || normalizeDish(mapping.recipeName).includes(dish))
    .filter((mapping) => mapping.language === language || language === "en")
    .filter((mapping) => !conflictsWithDiet(mapping, request))
    .sort((a, b) => Number(b.sponsored) - Number(a.sponsored) || b.priority - a.priority)
    .slice(0, 3)
    .map((mapping) => ({
      title: mapping.sponsored ? `Sponsored Recipe Video: ${mapping.recipeName}` : `Approved Recipe Video: ${mapping.recipeName}`,
      channelTitle: mapping.channelName,
      url: mapping.videoUrl,
      source: mapping.sponsored ? "sponsored" : "approved",
      language: mapping.language,
      sponsorName: mapping.sponsorName,
      sponsored: mapping.sponsored,
      approved: mapping.approved,
      matchQuality: normalizeDish(mapping.recipeName) === dish ? "exact" : "close",
      thirdPartyDisclaimer: mapping.sponsored ? sponsoredDisclaimer : approvedDisclaimer,
    }));
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
    const mapped = mappedVideos(request);

    if (mapped.length) {
      return {
        query,
        usedOfficialApi: false,
        status: "fully_functional",
        statusLabel: mapped.some((item) => item.sponsored) ? "Approved / Sponsored Recipe Video" : "Approved Recipe Video",
        results: mapped,
        note: "Stored approved recipe-video mapping used first. Sponsored placements are labelled when present.",
      };
    }

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
