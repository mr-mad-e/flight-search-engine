/**
 * useFilters Hook
 * Applies filters and sorting to flights with memoization
 */

"use client";

import { useMemo, useState } from "react";
import * as React from "react";
import { ProcessedFlight, FilterState } from "@/lib/types/flight";
import { applyFilters, sortFlights } from "@/lib/utils/flight-utils";

interface UseFiltersOptions {
  sortBy?: "price" | "duration" | "departure" | "arrival" | "stops";
  sortOrder?: "asc" | "desc";
}

interface UseFiltersResult {
  filteredFlights: ProcessedFlight[];
  count: number;
  hasResults: boolean;
}

/**
 * Hook for filtering and sorting flights
 * Uses useMemo to prevent unnecessary recalculations
 */
export function useFilters(
  flights: ProcessedFlight[],
  filters: Partial<FilterState>,
  options: UseFiltersOptions = {},
): UseFiltersResult {
  const { sortBy = "price", sortOrder = "asc" } = options;

  const filteredFlights = useMemo(() => {
    if (!flights || flights.length === 0) {
      return [];
    }

    // Apply filters
    let result = applyFilters(flights, filters);

    // Apply sorting
    result = sortFlights(result, sortBy, sortOrder);

    return result;
  }, [flights, filters, sortBy, sortOrder]);

  return {
    filteredFlights,
    count: filteredFlights.length,
    hasResults: filteredFlights.length > 0,
  };
}

/**
 * Hook for managing filter state
 */
interface UseFilterStateOptions {
  initialFilters?: Partial<FilterState>;
}

interface UseFilterStateResult {
  filters: Partial<FilterState>;
  setFilters: (filters: Partial<FilterState>) => void;
  updateFilter: (key: keyof FilterState, value: unknown) => void;
  resetFilters: () => void;
}

export function useFilterState(
  options: UseFilterStateOptions = {},
): UseFilterStateResult {
  const { initialFilters = {} } = options;

  // In a real app, you might use useState here
  // For now, we'll demonstrate the hook structure
  const [filters, setFilters] =
    React.useState<Partial<FilterState>>(initialFilters);

  const updateFilter = (key: keyof FilterState, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
  };
}
