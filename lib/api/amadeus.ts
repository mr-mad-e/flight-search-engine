/**
 * Amadeus API Client
 * Handles authentication, requests, rate limiting, and response normalization
 */

import {
  SearchParams,
  FlightOffer,
  Airport,
  AmadeusError,
  ProcessedFlight,
  APIResponse,
} from "@/lib/types/flight";
import {
  durationToMinutes,
  formatDuration,
  extractHour,
} from "@/lib/utils/flight-utils";

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface RateLimitInfo {
  requestCount: number;
  resetTime: number;
}

interface RequestOptions extends RequestInit {
  retries?: number;
  timeout?: number;
}

export class AmadeusClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private cachedToken: CachedToken | null = null;
  private rateLimitMap: Map<string, RateLimitInfo> = new Map();
  private requestCache: Map<string, { data: unknown; timestamp: number }> =
    new Map();

  // Configuration
  private readonly TOKEN_BUFFER = 60000; // Refresh token 1 minute before expiry
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT = 30; // requests
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // per minute
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = "https://test.api.amadeus.com";

    if (!clientId || !clientSecret) {
      throw new Error("Amadeus API credentials are required");
    }
  }

  /**
   * Get or refresh authentication token
   */
  private async getToken(): Promise<string> {
    // Return cached token if still valid
    if (
      this.cachedToken &&
      Date.now() < this.cachedToken.expiresAt - this.TOKEN_BUFFER
    ) {
      return this.cachedToken.token;
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `Authentication failed: ${response.status} ${JSON.stringify(error)}`,
        );
      }

      const data = await response.json();
      this.cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      return data.access_token;
    } catch (error) {
      throw new Error(
        `Amadeus auth error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check and enforce rate limiting
   */
  private checkRateLimit(key: string = "global"): boolean {
    const now = Date.now();
    const info = this.rateLimitMap.get(key) || {
      requestCount: 0,
      resetTime: now + this.RATE_LIMIT_WINDOW,
    };

    // Reset if window has passed
    if (now >= info.resetTime) {
      info.requestCount = 0;
      info.resetTime = now + this.RATE_LIMIT_WINDOW;
    }

    // Check limit
    if (info.requestCount >= this.RATE_LIMIT) {
      return false;
    }

    info.requestCount++;
    this.rateLimitMap.set(key, info);
    return true;
  }

  /**
   * Make HTTP request with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const timeout = options.timeout || this.REQUEST_TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Make authenticated API request with retries
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    // Check cache
    const cacheKey = `${endpoint}${JSON.stringify(options.body || "")}`;
    const cached = this.requestCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }

    // Rate limiting
    if (!this.checkRateLimit()) {
      throw new Error(
        "Rate limit exceeded. Please wait before making another request.",
      );
    }

    const token = await this.getToken();
    const retries = options.retries || this.MAX_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          `${this.baseUrl}${endpoint}`,
          {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          const errorMessage = this.formatError(error);

          // Don't retry on 4xx errors (except 429)
          if (response.status !== 429 && response.status < 500) {
            throw new Error(errorMessage);
          }

          lastError = new Error(errorMessage);

          // Exponential backoff for retries
          if (attempt < retries - 1) {
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        const data = await response.json();

        // Cache successful response
        this.requestCache.set(cacheKey, { data, timestamp: Date.now() });

        return data as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === retries - 1) {
          throw lastError;
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  /**
   * Format API error message
   */
  private formatError(error: unknown): string {
    if (typeof error === "object" && error !== null) {
      const err = error as Record<string, unknown>;

      // Amadeus API error format
      if (Array.isArray(err.errors)) {
        const firstError = (err.errors as Array<Record<string, unknown>>)[0];
        if (firstError?.detail) {
          return String(firstError.detail);
        }
      }

      if (err.title) {
        return String(err.title);
      }
      if (err.message) {
        return String(err.message);
      }
    }

    return "An error occurred with the Amadeus API";
  }

  /**
   * Search for flights
   */
  async searchFlights(params: SearchParams): Promise<ProcessedFlight[]> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        originLocationCode: params.departure,
        destinationLocationCode: params.arrival,
        departureDate: params.departDate,
        adults: String(params.adults),
        currencyCode: "USD",
        max: String(params.max || 50),
      });

      if (params.returnDate) {
        queryParams.append("returnDate", params.returnDate);
      }

      if (params.children > 0) {
        queryParams.append("children", String(params.children));
      }

      //   if (params.cabin) {
      //     queryParams.append("cabinClass", params.cabin);
      //   }

      const response = await this.request<{ data: FlightOffer[] }>(
        `/v2/shopping/flight-offers?${queryParams.toString()}`,
      );

      // Normalize and process flights
      return (response.data || []).map((offer) =>
        this.normalizeFlightOffer(offer),
      );
    } catch (error) {
      throw new Error(
        `Flight search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Normalize Amadeus flight offer to ProcessedFlight
   */
  private normalizeFlightOffer(offer: FlightOffer): ProcessedFlight {
    const outbound = offer.itineraries[0];
    const firstSegment = outbound.segments[0];
    const lastSegment = outbound.segments[outbound.segments.length - 1];

    // Extract airlines from all segments
    const airlines = Array.from(
      new Set(outbound.segments.map((seg) => seg.carrierCode)),
    );

    // Calculate total stops
    const stops = Math.max(0, outbound.segments.length - 1);

    return {
      id: offer.id,
      departure: {
        airport: firstSegment.departure.iataCode,
        time: firstSegment.departure.at,
        terminal: firstSegment.departure.terminal,
      },
      arrival: {
        airport: lastSegment.arrival.iataCode,
        time: lastSegment.arrival.at,
        terminal: lastSegment.arrival.terminal,
      },
      duration: outbound.duration,
      stops,
      airlines,
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      cabin:
        offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || "ECONOMY",
      bestAtTime: formatDuration(durationToMinutes(outbound.duration)),
      departureDate: firstSegment.departure.at.split("T")[0],
      segments: outbound.segments,
      rawOffer: offer,
    };
  }

  /**
   * Look up airport information
   */
  async searchAirports(keyword: string): Promise<Airport[]> {
    try {
      const response = await this.request<{
        data: Array<{
          iataCode: string;
          name: string;
          type: string;
          subtype?: string;
          address?: {
            cityName: string;
            countryCode: string;
          };
        }>;
      }>(
        `/v1/reference-data/locations?subType=AIRPORT&keyword=${encodeURIComponent(keyword)}`,
      );

      return (response.data || [])
        .filter((airport) => airport.iataCode)
        .map((airport) => ({
          iataCode: airport.iataCode,
          name: airport.name,
          city: airport.address?.cityName || "",
          countryCode: airport.address?.countryCode || "",
        }));
    } catch (error) {
      throw new Error(
        `Airport search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get airport by code
   */
  async getAirport(iataCode: string): Promise<Airport | null> {
    try {
      const response = await this.request<{
        data: Array<{
          iataCode: string;
          name: string;
          address?: {
            cityName: string;
            countryCode: string;
          };
        }>;
      }>(
        `/v1/reference-data/locations?subType=AIRPORT&code=${encodeURIComponent(iataCode)}`,
      );

      const airport = response.data?.[0];
      if (!airport) return null;

      return {
        iataCode: airport.iataCode,
        name: airport.name,
        city: airport.address?.cityName || "",
        countryCode: airport.address?.countryCode || "",
      };
    } catch (error) {
      console.error(`Failed to get airport ${iataCode}:`, error);
      return null;
    }
  }

  /**
   * Validate airport code
   */
  async isValidAirport(iataCode: string): Promise<boolean> {
    const airport = await this.getAirport(iataCode);
    return airport !== null;
  }

  /**
   * Get flight amenities
   */
  async getFlightAmenities(
    departure: string,
    arrival: string,
    departDate: string,
  ): Promise<Record<string, unknown>> {
    try {
      return await this.request<Record<string, unknown>>(
        `/shopping/flight-offers?originLocationCode=${departure}&destinationLocationCode=${arrival}&departureDate=${departDate}&adults=1&max=5`,
      );
    } catch (error) {
      throw new Error(
        `Failed to fetch amenities: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Clear token cache (useful for logout or re-authentication)
   */
  clearTokenCache(): void {
    this.cachedToken = null;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(key: string = "global"): {
    used: number;
    limit: number;
    resetIn: number;
  } {
    const info = this.rateLimitMap.get(key);
    const resetIn = info ? Math.max(0, info.resetTime - Date.now()) : 0;

    return {
      used: info?.requestCount || 0,
      limit: this.RATE_LIMIT,
      resetIn,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create singleton instance (for server-side use)
 */
let clientInstance: AmadeusClient | null = null;

export function getAmadeusClient(): AmadeusClient {
  if (!clientInstance) {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing Amadeus API credentials in environment variables",
      );
    }

    clientInstance = new AmadeusClient(clientId, clientSecret);
  }

  return clientInstance;
}

/**
 * Create new instance (for testing or multiple clients)
 */
export function createAmadeusClient(
  clientId: string,
  clientSecret: string,
): AmadeusClient {
  return new AmadeusClient(clientId, clientSecret);
}
