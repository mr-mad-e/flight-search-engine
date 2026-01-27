/**
 * Flight utility functions
 * Filtering, formatting, and processing utilities for flight data
 */

import {
  ProcessedFlight,
  FlightOffer,
  FilterState,
  PriceStats,
  AirlineStats,
} from "@/lib/types/flight";

/**
 * Parse ISO 8601 duration string to minutes
 * Example: "PT10H30M" -> 630
 */
export function durationToMinutes(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  const hours = parseInt(match?.[1] || "0") || 0;
  const minutes = parseInt(match?.[2] || "0") || 0;
  return hours * 60 + minutes;
}

/**
 * Convert minutes to formatted duration string
 * Example: 630 -> "10h 30m"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format price with currency
 * Example: { amount: 1234.56, currency: "USD" } -> "$1,234.56"
 */
export function formatPrice(
  amount: number | string,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(numAmount);
}

/**
 * Format date to readable string
 * Example: "2024-02-15" -> "Feb 15, 2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Format time from ISO datetime
 * Example: "2024-02-15T14:30:00" -> "2:30 PM"
 */
export function formatTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Extract time from ISO datetime (0-23)
 */
export function extractHour(isoDateTime: string): number {
  return new Date(isoDateTime).getHours();
}

/**
 * Filter flights by maximum price
 */
export function filterByPrice(
  flights: ProcessedFlight[],
  minPrice: number,
  maxPrice: number,
): ProcessedFlight[] {
  return flights.filter(
    (flight) => flight.price >= minPrice && flight.price <= maxPrice,
  );
}

/**
 * Filter flights by number of stops
 */
export function filterByStops(
  flights: ProcessedFlight[],
  maxStops: number,
): ProcessedFlight[] {
  return flights.filter((flight) => flight.stops <= maxStops);
}

/**
 * Filter flights by selected airlines
 */
export function filterByAirlines(
  flights: ProcessedFlight[],
  airlines: string[],
): ProcessedFlight[] {
  if (airlines.length === 0) return flights;

  return flights.filter((flight) =>
    flight.airlines.some((airline) => airlines.includes(airline)),
  );
}

/**
 * Filter flights by departure time range (in hours, 0-23)
 */
export function filterByDepartureTime(
  flights: ProcessedFlight[],
  startHour: number,
  endHour: number,
): ProcessedFlight[] {
  return flights.filter((flight) => {
    const hour = extractHour(flight.departure.time);
    if (startHour <= endHour) {
      return hour >= startHour && hour < endHour;
    } else {
      // Handle ranges that cross midnight (e.g., 22:00 - 06:00)
      return hour >= startHour || hour < endHour;
    }
  });
}

/**
 * Filter flights by arrival time range (in hours, 0-23)
 */
export function filterByArrivalTime(
  flights: ProcessedFlight[],
  startHour: number,
  endHour: number,
): ProcessedFlight[] {
  return flights.filter((flight) => {
    const hour = extractHour(flight.arrival.time);
    if (startHour <= endHour) {
      return hour >= startHour && hour < endHour;
    } else {
      return hour >= startHour || hour < endHour;
    }
  });
}

/**
 * Filter flights by cabin class
 */
export function filterByCabin(
  flights: ProcessedFlight[],
  cabins: string[],
): ProcessedFlight[] {
  if (cabins.length === 0) return flights;
  return flights.filter((flight) => cabins.includes(flight.cabin));
}

/**
 * Filter flights by maximum duration
 */
export function filterByDuration(
  flights: ProcessedFlight[],
  maxDuration: number,
): ProcessedFlight[] {
  return flights.filter((flight) => {
    const minutes = durationToMinutes(flight.segments[0]?.duration || "PT0M");
    return minutes <= maxDuration;
  });
}

/**
 * Apply all filters from FilterState
 */
export function applyFilters(
  flights: ProcessedFlight[],
  filters: Partial<FilterState>,
): ProcessedFlight[] {
  let filtered = [...flights];

  if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
    filtered = filterByPrice(filtered, filters.minPrice, filters.maxPrice);
  }

  if (filters.maxStops !== undefined) {
    filtered = filterByStops(filtered, filters.maxStops);
  }

  if (filters.selectedAirlines && filters.selectedAirlines.length > 0) {
    filtered = filterByAirlines(filtered, filters.selectedAirlines);
  }

  if (filters.departureTimeRange) {
    const { start, end } = filters.departureTimeRange;
    filtered = filterByDepartureTime(filtered, start, end);
  }

  if (filters.arrivalTimeRange) {
    const { start, end } = filters.arrivalTimeRange;
    filtered = filterByArrivalTime(filtered, start, end);
  }

  if (filters.maxDuration !== undefined) {
    filtered = filterByDuration(filtered, filters.maxDuration);
  }

  if (filters.cabins && filters.cabins.length > 0) {
    filtered = filterByCabin(filtered, filters.cabins);
  }

  return filtered;
}

/**
 * Sort flights by different criteria
 */
export function sortFlights(
  flights: ProcessedFlight[],
  sortBy: "price" | "duration" | "departure" | "arrival" | "stops" = "price",
  order: "asc" | "desc" = "asc",
): ProcessedFlight[] {
  const sorted = [...flights];
  const factor = order === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortBy) {
      case "price":
        return (a.price - b.price) * factor;

      case "duration":
        const aDuration = durationToMinutes(a.segments[0]?.duration || "PT0M");
        const bDuration = durationToMinutes(b.segments[0]?.duration || "PT0M");
        return (aDuration - bDuration) * factor;

      case "departure":
        const aTime = new Date(a.departure.time).getTime();
        const bTime = new Date(b.departure.time).getTime();
        return (aTime - bTime) * factor;

      case "arrival":
        const aArrival = new Date(a.arrival.time).getTime();
        const bArrival = new Date(b.arrival.time).getTime();
        return (aArrival - bArrival) * factor;

      case "stops":
        return (a.stops - b.stops) * factor;

      default:
        return 0;
    }
  });

  return sorted;
}

/**
 * Calculate price statistics from flights
 */
export function calculatePriceStats(flights: ProcessedFlight[]): PriceStats {
  if (flights.length === 0) {
    return { min: 0, max: 0, average: 0, median: 0 };
  }

  const prices = flights.map((f) => f.price).sort((a, b) => a - b);
  const min = prices[0];
  const max = prices[prices.length - 1];
  const average = prices.reduce((a, b) => a + b, 0) / prices.length;

  const median =
    prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

  return { min, max, average, median };
}

/**
 * Get unique airlines from flights
 */
export function getUniqueAirlines(flights: ProcessedFlight[]): string[] {
  const airlines = new Set<string>();
  flights.forEach((flight) => {
    flight.airlines.forEach((airline) => airlines.add(airline));
  });
  return Array.from(airlines).sort();
}

/**
 * Calculate airline statistics
 */
export function calculateAirlineStats(
  flights: ProcessedFlight[],
): AirlineStats[] {
  const stats = new Map<string, { count: number; prices: number[] }>();

  flights.forEach((flight) => {
    flight.airlines.forEach((airline) => {
      if (!stats.has(airline)) {
        stats.set(airline, { count: 0, prices: [] });
      }
      const airlineStats = stats.get(airline)!;
      airlineStats.count++;
      airlineStats.prices.push(flight.price);
    });
  });

  return Array.from(stats.entries())
    .map(([code, { count, prices }]) => {
      const sortedPrices = prices.sort((a, b) => a - b);
      return {
        code,
        name: code, // You might want to map codes to actual names
        count,
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        minPrice: sortedPrices[0],
        maxPrice: sortedPrices[sortedPrices.length - 1],
      };
    })
    .sort((a, b) => a.averagePrice - b.averagePrice);
}

/**
 * Get time of day for a flight (morning, afternoon, evening, night)
 */
export function getTimeOfDay(
  isoDateTime: string,
): "morning" | "afternoon" | "evening" | "night" {
  const hour = extractHour(isoDateTime);

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 24) return "evening";
  return "night";
}

/**
 * Calculate layover duration between segments
 */
export function calculateLayover(
  departureTime: string,
  arrivalTime: string,
): number {
  const dep = new Date(departureTime).getTime();
  const arr = new Date(arrivalTime).getTime();
  return Math.max(0, (dep - arr) / (1000 * 60)); // Minutes
}

/**
 * Check if flight has overnight arrival
 */
export function hasOvernightArrival(
  departureTime: string,
  arrivalTime: string,
): boolean {
  const depDate = new Date(departureTime).getDate();
  const arrDate = new Date(arrivalTime).getDate();
  return arrDate > depDate || arrDate < depDate; // Simple check
}

/**
 * Format relative time (e.g., "2 hours from now")
 */
export function formatRelativeTime(isoDateTime: string): string {
  const now = new Date();
  const then = new Date(isoDateTime);
  const diffMs = then.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} away`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} away`;
  }
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} away`;
}

/**
 * Check if flight is direct (no stops)
 */
export function isDirect(flight: ProcessedFlight): boolean {
  return flight.stops === 0;
}

/**
 * Check if flight is budget-friendly (below median price)
 */
export function isBudgetFriendly(
  flight: ProcessedFlight,
  flights: ProcessedFlight[],
): boolean {
  const stats = calculatePriceStats(flights);
  return flight.price <= stats.median;
}

/**
 * Get stops summary text
 */
export function getStopsSummary(stops: number): string {
  if (stops === 0) return "Direct";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

/**
 * Build airport display string
 * Example: { iataCode: "JFK", city: "New York" } -> "JFK - New York"
 */
export function formatAirportCode(iataCode: string, city?: string): string {
  if (city) return `${iataCode} - ${city}`;
  return iataCode;
}

/**
 * Format connection details
 * Example: ["AA", "UA"] -> "American Airlines, United Airlines"
 */
export function formatAirlines(codes: string[]): string {
  const airlineNames: Record<string, string> = {
    AA: "American Airlines",
    UA: "United Airlines",
    DL: "Delta Airlines",
    SW: "Southwest Airlines",
    BA: "British Airways",
    LH: "Lufthansa",
    AF: "Air France",
    KL: "KLM",
    EK: "Emirates",
    QA: "Qatar Airways",
  };

  return codes.map((code) => airlineNames[code] || code).join(", ");
}
