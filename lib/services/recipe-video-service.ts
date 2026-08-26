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

function fallbackResult(query: string, dishName: string, language: "en" | "hi" | "kn" = "en"): RecipeVideoResult {
  return {
    title: `${localText(language, "watchTitle", "Watch Recipe Video")}: ${localMealName(language, dishName)}`,
    channelTitle: localText(language, "youtubeSearch", "YouTube Search"),
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    source: "fallback_search",
    matchQuality: "fallback",
    thirdPartyDisclaimer: localText(language, "thirdPartyDisclaimer", thirdPartyDisclaimer),
  };
}

function normalizeDish(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function selectedLanguage(value?: string): "en" | "hi" | "kn" {
  if (value === "hi" || value === "kn") return value;
  return "en";
}

function localText(language: "en" | "hi" | "kn", key: string, fallback: string) {
  if (language === "en") return fallback;
  const hi: Record<string, string> = {
    thirdPartyDisclaimer:
      "बाहरी recipe videos third-party content हैं। जब तक reviewed mark न हो, MAMAAI ने video को medical या nutrition रूप से verify नहीं किया है।",
    approvedDisclaimer:
      "MAMAAI approved recipe-video mapping। खाना बनाने से पहले ingredients को अपनी saved family restrictions से जरूर मिलाकर जांचें।",
    sponsoredDisclaimer:
      "Sponsored Recipe Video / Paid Promotion। MAMAAI paid placements को साफ label करता है; ingredients को saved family restrictions से जरूर जांचें।",
    curatedSearch: "चुनी हुई YouTube खोज",
    youtubeSearch: "YouTube खोज",
    sponsoredTitle: "Sponsored Recipe Video",
    approvedTitle: "Approved Recipe Video",
    watchTitle: "रेसिपी वीडियो देखें",
    approvedStatus: "Approved Recipe Video",
    approvedSponsoredStatus: "Approved / Sponsored Recipe Video",
    storedMappingNote:
      "Saved approved recipe-video mapping पहले इस्तेमाल की गई है। Sponsored placement होने पर उसे साफ label किया जाता है।",
    searchStatus: "YouTube Video Search Link",
    searchNote: "Testing mode के लिए सीधा YouTube search link दिया गया है। Written recipe भी उपलब्ध है।",
    fallbackStatus: "Demo/Test Fallback",
    quotaNote: "YouTube API quota या error आया; safe YouTube link दिया गया है। Written recipe भी उपलब्ध है।",
  };
  const kn: Record<string, string> = {
    thirdPartyDisclaimer:
      "ಹೊರಗಿನ recipe videos third-party content ಆಗಿವೆ. Reviewed ಎಂದು ಸ್ಪಷ್ಟವಾಗಿ ಗುರುತಿಸದಿದ್ದರೆ MAMAAI ಆ video ಅನ್ನು medical ಅಥವಾ nutrition ದೃಷ್ಟಿಯಿಂದ verify ಮಾಡಿಲ್ಲ.",
    approvedDisclaimer:
      "MAMAAI approved recipe-video mapping. ಅಡುಗೆ ಮಾಡುವ ಮೊದಲು ingredients ಅನ್ನು ನಿಮ್ಮ saved family restrictions ಜೊತೆ ಪರಿಶೀಲಿಸಿ.",
    sponsoredDisclaimer:
      "Sponsored Recipe Video / Paid Promotion. MAMAAI paid placements ಅನ್ನು ಸ್ಪಷ್ಟವಾಗಿ label ಮಾಡುತ್ತದೆ; ingredients ಅನ್ನು saved family restrictions ಜೊತೆ ಪರಿಶೀಲಿಸಿ.",
    curatedSearch: "ಆಯ್ದ YouTube ಹುಡುಕಾಟ",
    youtubeSearch: "YouTube ಹುಡುಕಾಟ",
    sponsoredTitle: "Sponsored Recipe Video",
    approvedTitle: "Approved Recipe Video",
    watchTitle: "ರೆಸಿಪಿ ವಿಡಿಯೋ ನೋಡಿ",
    approvedStatus: "Approved Recipe Video",
    approvedSponsoredStatus: "Approved / Sponsored Recipe Video",
    storedMappingNote:
      "Saved approved recipe-video mapping ಮೊದಲು ಬಳಸಲಾಗಿದೆ. Sponsored placement ಇದ್ದರೆ ಅದನ್ನು ಸ್ಪಷ್ಟವಾಗಿ label ಮಾಡಲಾಗುತ್ತದೆ.",
    searchStatus: "YouTube Video Search Link",
    searchNote: "Testing modeಗಾಗಿ ನೇರ YouTube search link ನೀಡಲಾಗಿದೆ. Written recipe ಕೂಡ ಲಭ್ಯವಿದೆ.",
    fallbackStatus: "Demo/Test Fallback",
    quotaNote: "YouTube API quota ಅಥವಾ error ಬಂದಿದೆ; safe YouTube link ನೀಡಲಾಗಿದೆ. Written recipe ಕೂಡ ಲಭ್ಯವಿದೆ.",
  };
  return (language === "hi" ? hi[key] : kn[key]) ?? fallback;
}

function localMealName(language: "en" | "hi" | "kn", dishName: string) {
  if (language === "hi" && dishName === "Vegetable Moong Dal Khichdi with Curd") {
    return "दही के साथ सब्जियों वाली मूंग दाल खिचड़ी";
  }
  if (language === "kn" && dishName === "Vegetable Moong Dal Khichdi with Curd") {
    return "ಮೊಸರಿನೊಂದಿಗೆ ತರಕಾರಿ ಮೂಂಗ್ ದಾಲ್ ಖಿಚಡಿ";
  }
  return dishName;
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
      title: `${localText(language, mapping.sponsored ? "sponsoredTitle" : "approvedTitle", mapping.sponsored ? "Sponsored Recipe Video" : "Approved Recipe Video")}: ${localMealName(language, mapping.recipeName)}`,
      channelTitle:
        mapping.channelName === "Curated YouTube Search"
          ? localText(language, "curatedSearch", mapping.channelName)
          : mapping.channelName,
      url: mapping.videoUrl,
      source: mapping.sponsored ? "sponsored" : "approved",
      language: mapping.language,
      sponsorName: mapping.sponsorName,
      sponsored: mapping.sponsored,
      approved: mapping.approved,
      matchQuality: normalizeDish(mapping.recipeName) === dish ? "exact" : "close",
      thirdPartyDisclaimer: mapping.sponsored
        ? localText(language, "sponsoredDisclaimer", sponsoredDisclaimer)
        : localText(language, "approvedDisclaimer", approvedDisclaimer),
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
    const language = selectedLanguage(request.preferredLanguage);
    const mapped = mappedVideos(request);

    if (mapped.length) {
      return {
        query,
        usedOfficialApi: false,
        status: "fully_functional",
        statusLabel: mapped.some((item) => item.sponsored)
          ? localText(language, "approvedSponsoredStatus", "Approved / Sponsored Recipe Video")
          : localText(language, "approvedStatus", "Approved Recipe Video"),
        results: mapped,
        note: localText(
          language,
          "storedMappingNote",
          "Stored approved recipe-video mapping used first. Sponsored placements are labelled when present."
        ),
      };
    }

    if (!apiKey) {
      return {
        query,
        usedOfficialApi: false,
        status: "demo_test_only",
        statusLabel: localText(language, "searchStatus", "YouTube Video Search Link"),
        results: [fallbackResult(query, request.dishName, language)],
        note: localText(
          language,
          "searchNote",
          "Direct YouTube search link provided for testing mode. The written recipe remains available."
        ),
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
          statusLabel: localText(language, "fallbackStatus", "Demo/Test Fallback"),
          results: [fallbackResult(query, request.dishName, language)],
          note: localText(
            language,
            "quotaNote",
            "YouTube API quota or error encountered; safe YouTube link returned. The written recipe remains available."
          ),
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
          thirdPartyDisclaimer: localText(language, "thirdPartyDisclaimer", thirdPartyDisclaimer),
        }));

      return {
        query,
        usedOfficialApi: true,
        status: "fully_functional",
        statusLabel: language === "hi" ? "पूरी तरह कार्यशील" : language === "kn" ? "ಪೂರ್ಣವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ" : "Fully Functional",
        results: results.length ? results : [fallbackResult(query, request.dishName, language)],
        note:
          language === "hi"
            ? "Results official YouTube Data API से प्राप्त हुए हैं।"
            : language === "kn"
              ? "Results official YouTube Data API ಇಂದ ಪಡೆಯಲಾಗಿದೆ."
              : "Results retrieved from official YouTube Data API.",
      };
    } catch {
      return {
        query,
        usedOfficialApi: false,
        status: "demo_test_only",
        statusLabel: localText(language, "fallbackStatus", "Demo/Test Fallback"),
        results: [fallbackResult(query, request.dishName, language)],
        note:
          language === "hi"
            ? "Video search fallback active है। Written recipe उपलब्ध है।"
            : language === "kn"
              ? "Video search fallback active ಇದೆ. Written recipe ಲಭ್ಯವಿದೆ."
              : "Video search fallback active. Written recipe remains available.",
      };
    }
  }
}
