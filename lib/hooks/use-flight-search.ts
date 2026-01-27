/**
 * useFlightSearch Hook
 * Fetches flights from the API using SWR with loading and error states
 */

"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { SearchParams, ProcessedFlight } from "@/lib/types/flight";

interface FetchError extends Error {
  status?: number;
}

interface UseFlightSearchOptions {
  enabled?: boolean;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
}

interface UseFlightSearchResult {
  flights: ProcessedFlight[];
  isLoading: boolean;
  isValidating: boolean;
  error: FetchError | null;
  mutate: () => Promise<any>;
  isEmpty: boolean;
}

/**
 * Fetcher function for SWR
 */
async function flightFetcher(url: string): Promise<ProcessedFlight[]> {
  const response = await fetch(url);

  if (!response.ok) {
    const error: FetchError = new Error("Failed to fetch flights");
    error.status = response.status;

    try {
      const data = await response.json();
      error.message = data.message || data.error || error.message;
    } catch {
      // Use default error message
    }

    throw error;
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Hook for searching flights
 */
export function useFlightSearch(
  searchParams: Partial<SearchParams> | null,
  options: UseFlightSearchOptions = {},
): UseFlightSearchResult {
  const {
    enabled = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = true,
    dedupingInterval = 60000, // 1 minute
  } = options;

  // Only fetch if we have valid search parameters
  const shouldFetch =
    enabled &&
    searchParams &&
    searchParams.departure &&
    searchParams.arrival &&
    searchParams.departDate;

  // Build query string
  const queryString = useMemo(() => {
    if (!shouldFetch) return null;

    const params = new URLSearchParams();
    if (searchParams?.departure)
      params.append("departure", searchParams.departure);
    if (searchParams?.arrival) params.append("arrival", searchParams.arrival);
    if (searchParams?.departDate)
      params.append("departDate", searchParams.departDate);
    if (searchParams?.returnDate)
      params.append("returnDate", searchParams.returnDate);
    if (searchParams?.adults)
      params.append("adults", String(searchParams.adults));
    if (searchParams?.children)
      params.append("children", String(searchParams.children));
    if (searchParams?.cabin) params.append("cabin", searchParams.cabin);

    return params.toString();
  }, [shouldFetch, searchParams]);

  const url = queryString ? `/api/flights?${queryString}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<
    ProcessedFlight[],
    FetchError
  >(url, flightFetcher, {
    revalidateOnFocus,
    revalidateOnReconnect,
    dedupingInterval,
    errorRetryCount: 2,
    errorRetryInterval: 5000,
  });

  return {
    flights: data || [],
    isLoading: !!(isLoading && shouldFetch),
    isValidating,
    error: error || null,
    mutate,
    isEmpty: !isLoading && (!data || data.length === 0),
  };
}
