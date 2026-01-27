/**
 * Flight List Component
 * Displays filtered flights with sorting, infinite scroll, and loading states
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ProcessedFlight } from "@/lib/types/flight";
import { durationToMinutes } from "@/lib/utils/flight-utils";
import {
  FlightCard,
  FlightCardSkeleton,
  CompactFlightCard,
} from "./flight-card";
import { ChevronDown, TrendingUp, Clock, Plane } from "lucide-react";

interface FlightListProps {
  flights: ProcessedFlight[];
  isLoading?: boolean;
  error?: string | null;
  onFlightSelect?: (flight: ProcessedFlight) => void;
  selectedFlightId?: string | null;
  itemsPerPage?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

type SortOption = "price" | "duration" | "departure" | "arrival" | "stops";

/**
 * Empty state component
 */
interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center bg-white rounded-lg border border-gray-200">
      <div className="mb-4 flex justify-center text-4xl opacity-50">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Error state component
 */
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="py-12 px-4 text-center bg-red-50 rounded-lg border border-red-200">
      <div className="mb-4 text-3xl">⚠️</div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Error Loading Flights
      </h3>
      <p className="text-red-700 mb-6 max-w-md mx-auto">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          type="button"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Sort controls component
 */
interface SortControlsProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
}

function SortControls({
  sortBy,
  onSortChange,
  resultCount,
}: SortControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions: Array<{
    label: string;
    value: SortOption;
    icon: React.ReactNode;
  }> = [
    {
      label: "Price (Low to High)",
      value: "price",
      icon: <TrendingUp size={16} />,
    },
    {
      label: "Duration (Short to Long)",
      value: "duration",
      icon: <Clock size={16} />,
    },
    { label: "Departure Time", value: "departure", icon: <Plane size={16} /> },
    { label: "Arrival Time", value: "arrival", icon: <Plane size={16} /> },
    {
      label: "Stops (Fewest First)",
      value: "stops",
      icon: <Plane size={16} />,
    },
  ];

  const currentLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Sort by";

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      {/* Result Count */}
      <div className="text-sm text-gray-600 font-medium">
        Showing {resultCount} flight{resultCount !== 1 ? "s" : ""}
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium text-sm transition-colors"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span>Sort by: {currentLabel}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-3 text-left flex items-center gap-3
                  hover:bg-gray-50 transition-colors
                  border-b border-gray-200 last:border-b-0
                  ${sortBy === option.value ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"}
                `}
                type="button"
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Flight List Component
 */
export function FlightList({
  flights,
  isLoading = false,
  error = null,
  onFlightSelect,
  selectedFlightId = null,
  itemsPerPage = 10,
  onLoadMore,
  hasMore = false,
  className = "",
}: FlightListProps) {
  const [displayedCount, setDisplayedCount] = useState(itemsPerPage);
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [selectedId, setSelectedId] = useState<string | null>(selectedFlightId);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Update selected ID when prop changes
  useEffect(() => {
    setSelectedId(selectedFlightId);
  }, [selectedFlightId]);

  // Sort flights
  const sortedFlights = useMemo(() => {
    const sorted = [...flights];

    switch (sortBy) {
      case "price":
        return sorted.sort((a, b) => a.price - b.price);

      case "duration":
        return sorted.sort(
          (a, b) =>
            durationToMinutes(a.duration) - durationToMinutes(b.duration),
        );

      case "departure":
        return sorted.sort((a, b) =>
          a.departure.time.localeCompare(b.departure.time),
        );

      case "arrival":
        return sorted.sort((a, b) =>
          a.arrival.time.localeCompare(b.arrival.time),
        );

      case "stops":
        return sorted.sort((a, b) => a.stops - b.stops);

      default:
        return sorted;
    }
  }, [flights, sortBy]);

  // Get displayed flights
  const displayedFlights = useMemo(
    () => sortedFlights.slice(0, displayedCount),
    [sortedFlights, displayedCount],
  );

  // Handle flight selection
  const handleFlightSelect = useCallback(
    (flight: ProcessedFlight) => {
      setSelectedId(flight.id);
      onFlightSelect?.(flight);
    },
    [onFlightSelect],
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (sort: SortOption) => {
      setSortBy(sort);
      setDisplayedCount(itemsPerPage); // Reset to initial count on sort
    },
    [itemsPerPage],
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          if (displayedCount < sortedFlights.length) {
            setDisplayedCount((prev) =>
              Math.min(prev + itemsPerPage, sortedFlights.length),
            );
          } else {
            onLoadMore?.();
          }
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [
    displayedCount,
    sortedFlights.length,
    itemsPerPage,
    hasMore,
    isLoading,
    onLoadMore,
  ]);

  // Handle error
  if (error) {
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );
  }

  // Handle loading (no flights yet)
  if (isLoading && flights.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <SortControls
          sortBy={sortBy}
          onSortChange={handleSortChange}
          resultCount={0}
        />
        <div className="hidden md:block space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <FlightCardSkeleton key={idx} />
          ))}
        </div>
        <div className="md:hidden space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <FlightCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  // Handle no results
  if (!isLoading && sortedFlights.length === 0) {
    return (
      <EmptyState
        title="No flights found"
        description="Try adjusting your search criteria or filters to find more options."
        icon="✈️"
        action={{
          label: "Reset Filters",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sort Controls */}
      <div className="sticky top-4 bg-white z-20 p-4 border-b rounded-lg border-gray-200">
        <SortControls
          sortBy={sortBy}
          onSortChange={handleSortChange}
          resultCount={displayedFlights.length}
        />
      </div>

      {/* Flight List - Desktop */}
      <div className="hidden md:block space-y-4">
        {displayedFlights.map((flight) => {
          // Calculate badges
          const cheapestPrice = Math.min(...sortedFlights.map((f) => f.price));
          const fastestDuration = Math.min(
            ...sortedFlights.map((f) => durationToMinutes(f.duration)),
          );

          const isCheapest = flight.price === cheapestPrice;
          const isFastest =
            durationToMinutes(flight.duration) === fastestDuration;
          const isBestValue =
            flight.price / cheapestPrice < 1.2 &&
            durationToMinutes(flight.duration) / fastestDuration < 1.2;

          return (
            <FlightCard
              key={flight.id}
              flight={flight}
              isSelected={selectedId === flight.id}
              onSelect={handleFlightSelect}
              isCheapest={isCheapest}
              isFastest={isFastest}
              isBestValue={isBestValue}
            />
          );
        })}
      </div>

      {/* Flight List - Mobile */}
      <div className="md:hidden space-y-2">
        {displayedFlights.map((flight) => {
          const cheapestPrice = Math.min(...sortedFlights.map((f) => f.price));
          const fastestDuration = Math.min(
            ...sortedFlights.map((f) => durationToMinutes(f.duration)),
          );

          const isCheapest = flight.price === cheapestPrice;
          const isFastest =
            durationToMinutes(flight.duration) === fastestDuration;

          return (
            <CompactFlightCard
              key={flight.id}
              flight={flight}
              isSelected={selectedId === flight.id}
              onSelect={handleFlightSelect}
              isCheapest={isCheapest}
              isFastest={isFastest}
            />
          );
        })}
      </div>

      {/* Loading More Indicator */}
      {isLoading && displayedFlights.length > 0 && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <FlightCardSkeleton key={`skeleton-${idx}`} />
          ))}
        </div>
      )}

      {/* Infinite Scroll Observer Target */}
      <div ref={observerTarget} className="h-4" aria-hidden="true" />

      {/* "No more results" message */}
      {!hasMore && displayedFlights.length > 0 && !isLoading && (
        <div className="py-8 text-center text-gray-600">
          <p className="text-sm font-medium">
            You&apos;ve reached the end of the results
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Flight List with Filters Integration
 * Ready-to-use component that integrates with filters
 */
interface FlightListWithFiltersProps {
  flights: ProcessedFlight[];
  isLoading?: boolean;
  error?: string | null;
  onFlightSelect?: (flight: ProcessedFlight) => void;
  selectedFlightId?: string | null;
}

export function FlightListWithFilters({
  flights,
  isLoading = false,
  error = null,
  onFlightSelect,
  selectedFlightId = null,
}: FlightListWithFiltersProps) {
  const hasMore = flights.length > 10;

  return (
    <FlightList
      flights={flights}
      isLoading={isLoading}
      error={error}
      onFlightSelect={onFlightSelect}
      selectedFlightId={selectedFlightId}
      itemsPerPage={10}
      hasMore={hasMore}
      onLoadMore={() => {
        // Load more would fetch from API in real scenario
        console.log("Loading more flights...");
      }}
    />
  );
}

/**
 * Virtual List Flight Component (For 1000+ flights)
 * Uses dynamic rendering for performance
 */
interface VirtualFlightListProps {
  flights: ProcessedFlight[];
  onFlightSelect?: (flight: ProcessedFlight) => void;
  selectedFlightId?: string | null;
  className?: string;
}

export function VirtualFlightList({
  flights,
  onFlightSelect,
  selectedFlightId = null,
  className = "",
}: VirtualFlightListProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort flights
  const sortedFlights = useMemo(() => {
    const sorted = [...flights];

    switch (sortBy) {
      case "price":
        return sorted.sort((a, b) => a.price - b.price);
      case "duration":
        return sorted.sort(
          (a, b) =>
            durationToMinutes(a.duration) - durationToMinutes(b.duration),
        );
      case "departure":
        return sorted.sort((a, b) =>
          a.departure.time.localeCompare(b.departure.time),
        );
      case "arrival":
        return sorted.sort((a, b) =>
          a.arrival.time.localeCompare(b.arrival.time),
        );
      case "stops":
        return sorted.sort((a, b) => a.stops - b.stops);
      default:
        return sorted;
    }
  }, [flights, sortBy]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const clientHeight = containerRef.current.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / 120) - 5); // Assuming 120px per item
    const end = Math.min(
      flights.length,
      Math.ceil((scrollTop + clientHeight) / 120) + 5,
    );

    setVisibleRange({ start, end });
  }, [flights.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const visibleFlights = sortedFlights.slice(
    visibleRange.start,
    visibleRange.end,
  );
  const totalHeight = sortedFlights.length * 120; // Approximate item height
  const offsetY = visibleRange.start * 120;

  return (
    <div className={className}>
      <div className="sticky top-0 bg-white z-20 py-4 border-b border-gray-200">
        <SortControls
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={sortedFlights.length}
        />
      </div>

      <div
        ref={containerRef}
        className="h-[calc(100vh-200px)] overflow-y-auto"
        role="listbox"
        aria-label="Flight results"
      >
        {/* Spacer before visible items */}
        <div style={{ height: offsetY }} />

        {/* Visible items */}
        <div className="space-y-4">
          {visibleFlights.map((flight) => (
            <CompactFlightCard
              key={flight.id}
              flight={flight}
              isSelected={selectedFlightId === flight.id}
              onSelect={onFlightSelect}
            />
          ))}
        </div>

        {/* Spacer after visible items */}
        <div
          style={{
            height: Math.max(
              0,
              totalHeight - offsetY - visibleFlights.length * 120,
            ),
          }}
        />
      </div>
    </div>
  );
}
