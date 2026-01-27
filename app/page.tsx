"use client";

import { useState, useMemo, useCallback } from "react";
import { FilterState } from "@/lib/types/flight";
import { durationToMinutes } from "@/lib/utils/flight-utils";

// Components
import { FlightSearchForm } from "@/components/search/search-form";
import {
  FilterSidebar,
  CompactFilterButton,
  FilterResultsInfo,
} from "@/components/filters/filter-sidebar";
import { FlightList } from "@/components/results/flight-list";
import { FlightCardSkeleton } from "@/components/results/flight-card";
import { PriceGraph } from "@/components/graph/price-graph";
import { CompareBar, useCompareBar } from "@/components/results/compare-bar";

// Hooks
import { useFlightSearch } from "@/lib/hooks/use-flight-search";

/**
 * Error Boundary Component
 */
function ErrorBoundary({
  children,
  error,
  onRetry,
}: {
  children: React.ReactNode;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (!error) return <>{children}</>;

  const errorMessage = typeof error === "string" ? error : "An error occurred";

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-4">
        <div className="text-3xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-700 mb-4">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton Grid
 */
function LoadingSkeletons() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <FlightCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({
  title = "No flights found",
  description = "Try adjusting your search criteria or filters.",
  icon = "✈️",
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function Home() {
  // Calculate default date on client side
  const [defaultDate] = useState(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    return futureDate.toISOString().split("T")[0];
  });

  // Search state
  const [searchParams, setSearchParams] = useState<{
    departure: string;
    arrival: string;
    departDate: string;
    adults: number;
    children: number;
    cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    isRoundTrip: boolean;
    returnDate?: string;
  }>({
    departure: "LAX",
    arrival: "JFK",
    departDate: defaultDate,
    adults: 1,
    children: 0,
    cabin: "ECONOMY",
    isRoundTrip: false,
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    maxStops: 2,
    minPrice: 0,
    maxPrice: 10000,
    selectedAirlines: [],
    departureTimeRange: { start: 0, end: 24 },
    arrivalTimeRange: { start: 0, end: 24 },
    maxDuration: 1440,
    sortBy: "price",
    sortOrder: "asc",
    cabins: [],
  });

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [showPriceGraph, setShowPriceGraph] = useState(true);

  // Comparison state
  const compare = useCompareBar(3);

  // Fetch flights
  const { flights, isLoading, error } = useFlightSearch(searchParams);

  // Apply filters
  const filteredFlights = useMemo(() => {
    if (!flights) return [];

    let result = [...flights];

    // Apply filters
    result = result.filter((f) => {
      // Stops filter
      if (f.stops > filters.maxStops) return false;

      // Price filter
      if (f.price < filters.minPrice || f.price > filters.maxPrice)
        return false;

      // Airline filter
      if (
        filters.selectedAirlines.length > 0 &&
        !filters.selectedAirlines.some((a) => f.airlines.includes(a))
      )
        return false;

      // Departure time filter
      const depHour = new Date(f.departure.time).getHours();
      if (
        depHour < filters.departureTimeRange.start ||
        depHour > filters.departureTimeRange.end
      )
        return false;

      // Duration filter
      const dur = durationToMinutes(f.duration);
      if (dur > filters.maxDuration) return false;

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case "price":
          comparison = a.price - b.price;
          break;
        case "duration":
          comparison =
            durationToMinutes(a.duration) - durationToMinutes(b.duration);
          break;
        case "departure":
          comparison =
            new Date(a.departure.time).getTime() -
            new Date(b.departure.time).getTime();
          break;
        case "arrival":
          comparison =
            new Date(a.arrival.time).getTime() -
            new Date(b.arrival.time).getTime();
          break;
        case "stops":
          comparison = a.stops - b.stops;
          break;
        default:
          comparison = 0;
      }
      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [flights, filters]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.maxStops < 2) count++;
    if (filters.minPrice > 0) count++;
    if (filters.maxPrice < 10000) count++;
    if (filters.selectedAirlines.length > 0) count++;
    if (
      filters.departureTimeRange.start > 0 ||
      filters.departureTimeRange.end < 24
    )
      count++;
    if (filters.maxDuration < 1440) count++;
    return count;
  }, [filters]);

  // Handlers
  const handleSearch = useCallback(
    (data: {
      departure: string;
      arrival: string;
      departDate: string;
      adults: number;
      children: number;
      cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
      isRoundTrip: boolean;
      returnDate?: string;
    }) => {
      setSearchParams(data);
      setSelectedFlightId(null);
      compare.clearAll();
      setSidebarOpen(false);
    },
    [compare],
  );

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setSidebarOpen(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      maxStops: 2,
      minPrice: 0,
      maxPrice: 10000,
      selectedAirlines: [],
      departureTimeRange: { start: 0, end: 24 },
      arrivalTimeRange: { start: 0, end: 24 },
      maxDuration: 1440,
      sortBy: "price",
      sortOrder: "asc",
      cabins: [],
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Search Form */}
      <header className="z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Flight Search</h1>
          </div>
          <FlightSearchForm
            onSearch={handleSearch}
            isLoading={isLoading}
            initialValues={searchParams}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        {/* Error Boundary */}
        <ErrorBoundary
          error={error ? "Failed to fetch flights. Please try again." : null}
        >
          {/* Filter Results Info */}
          {flights && flights.length > 0 && (
            <div className="mb-6">
              <FilterResultsInfo
                totalFlights={flights.length}
                filteredFlights={filteredFlights.length}
                activeFilterCount={activeFilterCount}
              />

              {/* Mobile Filter Button */}
              <div className="lg:hidden mt-4">
                <CompactFilterButton
                  activeFilterCount={activeFilterCount}
                  onOpen={() => setSidebarOpen(true)}
                />
              </div>
            </div>
          )}

          {/* Results Container */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Desktop Sidebar - Always Visible */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-4">
                <FilterSidebar
                  flights={flights || []}
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                />

                {/* Reset Filters Button */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </aside>

            {/* Mobile Sidebar - Bottom Sheet */}
            {sidebarOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
                <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Filters</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="text-gray-600 hover:text-gray-900 text-2xl"
                      aria-label="Close filters"
                    >
                      ×
                    </button>
                  </div>

                  <div className="p-4">
                    <FilterSidebar
                      flights={flights || []}
                      filters={filters}
                      onFiltersChange={(newFilters) => {
                        handleFilterChange(newFilters);
                        setSidebarOpen(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results Section */}
            <section className="lg:col-span-3 space-y-6">
              {/* Price Graph */}
              {showPriceGraph && filteredFlights.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Price Trends
                    </h2>
                    <button
                      onClick={() => setShowPriceGraph(false)}
                      className="text-sm text-gray-600 hover:text-gray-900 transition"
                    >
                      Hide
                    </button>
                  </div>
                  <PriceGraph
                    flights={filteredFlights}
                    selectedFlightId={selectedFlightId}
                    height={300}
                    groupBy="time"
                    showAverageLine
                  />
                </div>
              )}

              {/* Flight List */}
              {isLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <LoadingSkeletons />
                </div>
              ) : filteredFlights.length === 0 ? (
                <EmptyState
                  title={
                    flights?.length === 0
                      ? "No flights found"
                      : "No flights match your filters"
                  }
                  description={
                    flights?.length === 0
                      ? "Try adjusting your search criteria"
                      : "Try adjusting your filters to see more results"
                  }
                />
              ) : (
                <div>
                  <div className="divide-y divide-gray-200">
                    <FlightList
                      flights={filteredFlights}
                      isLoading={false}
                      error={null}
                      selectedFlightId={selectedFlightId}
                      onFlightSelect={(flight) => {
                        setSelectedFlightId(flight.id);
                      }}
                      itemsPerPage={10}
                      hasMore={filteredFlights.length > 10}
                      className="w-full"
                    />
                    {/* Pin buttons rendered in flight cards via onFlightSelect context */}
                  </div>
                </div>
              )}
            </section>
          </div>
        </ErrorBoundary>
      </main>

      {/* Sticky Comparison Bar */}
      {compare.pinnedCount > 0 && (
        <CompareBar
          pinnedFlights={compare.pinnedFlights}
          onUnpin={compare.removeFlight}
          onCompare={compare.clearAll}
        />
      )}
    </div>
  );
}
