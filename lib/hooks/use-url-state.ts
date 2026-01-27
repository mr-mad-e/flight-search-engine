/**
 * useUrlState Hook
 * Bidirectional synchronization between component state and URL query parameters
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchParams } from "@/lib/types/flight";

interface UseUrlStateOptions {
  debounceMs?: number;
  replaceHistory?: boolean;
}

interface UseUrlStateResult {
  state: Partial<SearchParams>;
  setState: (state: Partial<SearchParams>) => void;
  updateState: (updates: Partial<SearchParams>) => void;
  resetState: () => void;
  isReady: boolean;
}

/**
 * Hook for syncing state with URL query parameters
 * Reads from URL on mount, syncs updates to URL
 */
export function useUrlState(
  options: UseUrlStateOptions = {},
): UseUrlStateResult {
  const { debounceMs = 500, replaceHistory = false } = options;

  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setStateInternal] = useState<Partial<SearchParams>>({});
  const [isReady, setIsReady] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  /**
   * Initialize state from URL on mount
   */
  useEffect(() => {
    const urlState: Partial<SearchParams> = {
      departure: searchParams.get("departure") || undefined,
      arrival: searchParams.get("arrival") || undefined,
      departDate: searchParams.get("departDate") || undefined,
      returnDate: searchParams.get("returnDate") || undefined,
      adults: searchParams.get("adults")
        ? parseInt(searchParams.get("adults")!)
        : undefined,
      children: searchParams.get("children")
        ? parseInt(searchParams.get("children")!)
        : undefined,
      cabin: (searchParams.get("cabin") as SearchParams["cabin"]) || undefined,
    };

    // Remove undefined values
    Object.keys(urlState).forEach(
      (key) =>
        urlState[key as keyof SearchParams] === undefined &&
        delete urlState[key as keyof SearchParams],
    );

    setStateInternal(urlState);
    setIsReady(true);
  }, [searchParams]);

  /**
   * Sync state to URL
   */
  const syncToUrl = useCallback(
    (newState: Partial<SearchParams>) => {
      const params = new URLSearchParams();

      // Build query string from state
      Object.entries(newState).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });

      const queryString = params.toString();
      const url = queryString ? `?${queryString}` : "/";

      if (replaceHistory) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router, replaceHistory],
  );

  /**
   * Set state (with debounced URL sync)
   */
  const setState = useCallback(
    (newState: Partial<SearchParams>) => {
      setStateInternal(newState);

      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        syncToUrl(newState);
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [debounceMs, debounceTimer, syncToUrl],
  );

  /**
   * Update specific state properties
   */
  const updateState = useCallback(
    (updates: Partial<SearchParams>) => {
      setStateInternal((prev) => ({
        ...prev,
        ...updates,
      }));

      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Set new debounce timer
      const timer = setTimeout(() => {
        setStateInternal((prev) => {
          const newState = { ...prev, ...updates };
          syncToUrl(newState);
          return newState;
        });
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [debounceMs, debounceTimer, syncToUrl],
  );

  /**
   * Reset state to empty
   */
  const resetState = useCallback(() => {
    setStateInternal({});
    syncToUrl({});
  }, [syncToUrl]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    state,
    setState,
    updateState,
    resetState,
    isReady,
  };
}

/**
 * Hook for reading URL state without syncing
 * (read-only)
 */
export function useUrlStateRead(): Partial<SearchParams> {
  const searchParams = useSearchParams();

  return {
    departure: searchParams.get("departure") || undefined,
    arrival: searchParams.get("arrival") || undefined,
    departDate: searchParams.get("departDate") || undefined,
    returnDate: searchParams.get("returnDate") || undefined,
    adults: searchParams.get("adults")
      ? parseInt(searchParams.get("adults")!)
      : undefined,
    children: searchParams.get("children")
      ? parseInt(searchParams.get("children")!)
      : undefined,
    cabin: (searchParams.get("cabin") as SearchParams["cabin"]) || undefined,
  };
}

/**
 * Hook for writing to URL state
 * (write-only, no component state)
 */
export function useUrlStateWrite(
  options: UseUrlStateOptions = {},
): (state: Partial<SearchParams>) => void {
  const { replaceHistory = false } = options;
  const router = useRouter();

  return useCallback(
    (state: Partial<SearchParams>) => {
      const params = new URLSearchParams();

      Object.entries(state).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });

      const queryString = params.toString();
      const url = queryString ? `?${queryString}` : "/";

      if (replaceHistory) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router, replaceHistory],
  );
}
