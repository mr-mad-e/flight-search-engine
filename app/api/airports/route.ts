/**
 * API Route: GET /api/airports
 * Airport autocomplete and search
 *
 * Query Parameters:
 * - q: string (required) - Search query (city name or IATA code)
 * - limit: number (optional, default: 10) - Max results to return
 *
 * Example:
 * GET /api/airports?q=New%20York&limit=5
 * GET /api/airports?q=JFK&limit=5
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAmadeusClient } from "@/lib/api/amadeus";
import { Airport } from "@/lib/types/flight";

/**
 * Validation schema for airport search
 */
const airportSearchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(100, "Search query is too long")
    .trim(),

  limit: z
    .string()
    .default("10")
    .transform((val) => parseInt(val))
    .refine((val) => val >= 1 && val <= 50, "Limit must be between 1 and 50"),
});

type AirportSearchInput = z.infer<typeof airportSearchSchema>;

/**
 * In-memory cache for airport searches
 * Consider using Redis in production
 */
const airportCache = new Map<
  string,
  { results: Airport[]; timestamp: number }
>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Simple fuzzy matching algorithm
 * Calculates similarity score between two strings (0-1)
 */
function fuzzyScore(needle: string, haystack: string): number {
  needle = needle.toLowerCase();
  haystack = haystack.toLowerCase();

  // Exact match
  if (needle === haystack) return 1;

  // Starts with match (highest priority for autocomplete)
  if (haystack.startsWith(needle)) return 0.9;

  // Contains match
  if (haystack.includes(needle)) return 0.7;

  // Levenshtein distance based scoring (for typos)
  const maxLen = Math.max(needle.length, haystack.length);
  const distance = levenshteinDistance(needle, haystack);
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity * 0.5); // Max 0.5 for fuzzy matches
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(s1: string, s2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substitution
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j] + 1, // Deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Normalize airport data and add metadata
 */
function normalizeAndScoreAirports(
  airports: Airport[],
  query: string,
  limit: number,
): Array<Airport & { score: number }> {
  // Score each airport based on how well it matches the query
  const scoredAirports = airports.map((airport) => {
    // Calculate scores for different fields
    const codeScore = fuzzyScore(query, airport.iataCode);
    const nameScore = fuzzyScore(query, airport.name);
    const cityScore = fuzzyScore(query, airport.city);

    // Weighted score: prefer code matches, then city, then name
    const score = Math.max(codeScore * 1.5, cityScore * 1.2, nameScore);

    return {
      ...airport,
      score,
    };
  });

  // Sort by score and filter out low scores
  return scoredAirports
    .filter((airport) => airport.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Parse and validate search parameters
 */
function parseSearchParams(queryParams: URLSearchParams): {
  valid: boolean;
  data?: AirportSearchInput;
  errors?: Record<string, string>;
} {
  try {
    const rawData = {
      q: queryParams.get("q") || "",
      limit: queryParams.get("limit") || "10",
    };

    const validated = airportSearchSchema.parse(rawData);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      //   error.errors.forEach((err) => {
      //     const path = err.path.join(".");
      //     errors[path] = err.message;
      //   });
      return { valid: false, errors };
    }

    return {
      valid: false,
      errors: { general: "Invalid request parameters" },
    };
  }
}

/**
 * Detect if query is an IATA code (3 uppercase letters)
 */
function isIATACode(query: string): boolean {
  return /^[A-Z]{3}$/.test(query.trim());
}

/**
 * GET handler
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const parseResult = parseSearchParams(searchParams);

    if (!parseResult.valid) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.errors,
        },
        { status: 400 },
      );
    }

    const { q: query, limit } = parseResult.data!;
    const cacheKey = `${query.toLowerCase()}:${limit}`;

    // Check cache
    const cached = airportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        {
          success: true,
          data: cached.results,
          meta: {
            count: cached.results.length,
            cached: true,
            query,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        },
      );
    }

    // Initialize Amadeus client
    let client;
    try {
      client = getAmadeusClient();
    } catch (error) {
      return NextResponse.json(
        {
          error: "API configuration error",
          message: "Failed to initialize airport search service",
        },
        { status: 500 },
      );
    }

    // Search airports
    let airports: Airport[] = [];
    try {
      // If query looks like IATA code, try exact lookup first
      if (isIATACode(query)) {
        const airport = await client.getAirport(query.toUpperCase());
        if (airport) {
          airports = [airport];
        } else {
          // Fall back to keyword search
          airports = await client.searchAirports(query);
        }
      } else {
        // Search by city name or airport name
        airports = await client.searchAirports(query);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Airport search error:", errorMessage);

      // Return empty results instead of error for poor UX
      // This allows the app to continue functioning
      if (errorMessage.includes("Rate limit")) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: "Too many requests. Please try again later.",
          },
          { status: 429 },
        );
      }

      if (errorMessage.includes("timeout")) {
        return NextResponse.json(
          {
            error: "Request timeout",
            message: "Airport search service took too long to respond",
          },
          { status: 504 },
        );
      }

      // For other errors, return empty results
      console.warn(`Airport search failed for query "${query}":`, errorMessage);
      airports = [];
    }

    // Apply fuzzy matching and scoring
    const results = normalizeAndScoreAirports(airports, query, limit);

    // Cache results
    if (results.length > 0) {
      airportCache.set(cacheKey, {
        results: results.map(({ score, ...airport }) => airport),
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: results.map(({ score, ...airport }) => airport),
        meta: {
          count: results.length,
          cached: false,
          query,
          limit,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("API route error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}

/**
 * Clear cache endpoint (for manual refresh)
 * In production, consider adding authentication
 */
export async function DELETE(request: NextRequest) {
  // Optional: Add authentication check here
  // if (!isAuthorized(request)) return new NextResponse(null, { status: 401 });

  try {
    const cacheSize = airportCache.size;
    airportCache.clear();

    return NextResponse.json(
      {
        success: true,
        message: `Cleared ${cacheSize} cached airport searches`,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to clear cache",
      },
      { status: 500 },
    );
  }
}

/**
 * HEAD handler (for health checks)
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

/**
 * OPTIONS handler (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
