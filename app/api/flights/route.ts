/**
 * API Route: GET /api/flights
 * Search for flights via Amadeus API
 *
 * Query Parameters:
 * - departure: string (required) - Departure airport code (3 letters)
 * - arrival: string (required) - Arrival airport code (3 letters)
 * - departDate: string (required) - Departure date (YYYY-MM-DD)
 * - returnDate: string (optional) - Return date for round trips (YYYY-MM-DD)
 * - adults: number (required, default: 1) - Number of adults
 * - children: number (optional, default: 0) - Number of children
 * - cabin: string (optional, default: ECONOMY) - Cabin class
 * - max: number (optional, default: 50) - Max number of results
 *
 * Example:
 * GET /api/flights?departure=JFK&arrival=LHR&departDate=2024-02-15&adults=2&cabin=ECONOMY
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAmadeusClient } from "@/lib/api/amadeus";
import { SearchParams } from "@/lib/types/flight";

/**
 * Validation schema for flight search parameters
 */
const flightSearchSchema = z.object({
  departure: z
    .string()
    .min(3, "Departure code must be 3 characters")
    .max(3, "Departure code must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Departure code must be uppercase letters only")
    .transform((val) => val.toUpperCase()),

  arrival: z
    .string()
    .min(3, "Arrival code must be 3 characters")
    .max(3, "Arrival code must be 3 characters")
    .regex(/^[A-Z]{3}$/, "Arrival code must be uppercase letters only")
    .transform((val) => val.toUpperCase()),

  departDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Departure date must be in YYYY-MM-DD format")
    .refine((date) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, "Departure date must be today or in the future"),

  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Return date must be in YYYY-MM-DD format")
    .optional()
    .refine((date) => {
      if (!date) return true;
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, "Return date must be today or in the future"),

  adults: z
    .string()
    .default("1")
    .transform((val) => parseInt(val))
    .refine((val) => val >= 1 && val <= 9, "Adults must be between 1 and 9"),

  children: z
    .string()
    .default("0")
    .transform((val) => parseInt(val))
    .refine((val) => val >= 0 && val <= 8, "Children must be between 0 and 8"),

  //   cabin: z
  //     .enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"])
  //     .default("ECONOMY"),

  max: z
    .string()
    .default("50")
    .transform((val) => parseInt(val))
    .refine(
      (val) => val >= 1 && val <= 250,
      "Max results must be between 1 and 250",
    ),
});

type FlightSearchInput = z.infer<typeof flightSearchSchema>;

/**
 * Parse and validate query parameters
 */
function parseSearchParams(queryParams: URLSearchParams): {
  valid: boolean;
  data?: FlightSearchInput;
  errors?: Record<string, string>;
} {
  try {
    const rawData = {
      departure: queryParams.get("departure") || "",
      arrival: queryParams.get("arrival") || "",
      departDate: queryParams.get("departDate") || "",
      //   returnDate: queryParams.get("returnDate") || undefined,
      adults: queryParams.get("adults") || "1",
      children: queryParams.get("children") || "0",
      //   cabin: queryParams.get("cabin") || "ECONOMY",
      max: queryParams.get("max") || "50",
    };

    const validated = flightSearchSchema.parse(rawData);
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
 * Build search params for Amadeus client
 */
function buildSearchParams(validated: FlightSearchInput): SearchParams {
  return {
    departure: validated.departure,
    arrival: validated.arrival,
    departDate: validated.departDate,
    // returnDate: validated.returnDate,
    adults: validated.adults,
    children: validated.children,
    // cabin: validated.cabin,
    max: validated.max,
  };
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

    const validatedParams = parseResult.data!;

    // Build search parameters
    const searchParams_ = buildSearchParams(validatedParams);

    // Initialize Amadeus client
    let client;
    try {
      client = getAmadeusClient();
    } catch (error) {
      console.error("Amadeus client initialization failed:", error);
      return NextResponse.json(
        {
          error: "API configuration error",
          message: "Failed to initialize flight search service",
        },
        { status: 500 },
      );
    }

    // Search flights
    let flights;
    try {
      flights = await client.searchFlights(searchParams_);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      console.error("Flight search error:", errorMessage);

      // Return appropriate error based on message
      if (errorMessage.includes("Rate limit")) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: "Too many requests. Please try again in a few minutes.",
          },
          { status: 429 },
        );
      }

      if (errorMessage.includes("Authentication")) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            message: "Failed to authenticate with flight search service",
          },
          { status: 401 },
        );
      }

      if (errorMessage.includes("timeout")) {
        return NextResponse.json(
          {
            error: "Request timeout",
            message: "Flight search service took too long to respond",
          },
          { status: 504 },
        );
      }

      // Default error response
      return NextResponse.json(
        {
          error: "Search failed",
          message: errorMessage,
        },
        { status: 400 },
      );
    }

    // Return results
    return NextResponse.json(
      {
        success: true,
        data: flights,
        meta: {
          count: flights.length,
          searchParams: validatedParams,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
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
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
