/**
 * Sticky Comparison Bar Component
 * Allows users to pin 2-3 flights and compare side-by-side
 */

"use client";

import { useState, useCallback } from "react";
import { ProcessedFlight } from "@/lib/types/flight";
import {
  formatPrice,
  formatTime,
  durationToMinutes,
  formatDuration,
} from "@/lib/utils/flight-utils";
import {
  X,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Check,
  TrendingDown,
} from "lucide-react";

interface CompareBarProps {
  pinnedFlights: ProcessedFlight[];
  onUnpin: (flightId: string) => void;
  onCompare?: (flights: ProcessedFlight[]) => void;
  maxPinnedFlights?: number;
  className?: string;
}

interface ComparisonFieldProps {
  label: string;
  flights: ProcessedFlight[];
  getValue: (flight: ProcessedFlight) => string | number;
  formatValue?: (value: string | number) => string;
  highlight?: "lowest" | "highest" | "none";
  icon?: React.ReactNode;
}

/**
 * Comparison field showing metric across pinned flights
 */
function ComparisonField({
  label,
  flights,
  getValue,
  formatValue,
  highlight = "none",
  icon,
}: ComparisonFieldProps) {
  const values = flights.map(getValue);

  // Determine which indices should be highlighted
  let highlightedIndex: number | null = null;
  if (highlight === "lowest") {
    const minValue =
      typeof values[0] === "number" ? Math.min(...(values as number[])) : null;
    highlightedIndex = minValue !== null ? values.indexOf(minValue) : null;
  } else if (highlight === "highest") {
    const maxValue =
      typeof values[0] === "number" ? Math.max(...(values as number[])) : null;
    highlightedIndex = maxValue !== null ? values.indexOf(maxValue) : null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
        {icon && <span className="text-base">{icon}</span>}
        <span>{label}</span>
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${flights.length}, 1fr)` }}
      >
        {flights.map((flight, idx) => {
          const value = getValue(flight);
          const displayValue = formatValue ? formatValue(value) : String(value);
          const isHighlighted = highlightedIndex === idx;

          return (
            <div
              key={`${flight.id}-${label}`}
              className={`p-2 rounded text-sm font-medium transition-colors ${
                isHighlighted
                  ? "bg-blue-100 text-blue-900 ring-1 ring-blue-300"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span>{displayValue}</span>
                {isHighlighted && highlight !== "none" && (
                  <Check className="w-4 h-4" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact flight card in comparison bar
 */
interface CompactComparisonCardProps {
  flight: ProcessedFlight;
  onUnpin: () => void;
}

function CompactComparisonCard({
  flight,
  onUnpin,
}: CompactComparisonCardProps) {
  return (
    <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with unpin button */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-900">
            {flight.departure.airport} → {flight.arrival.airport}
          </div>
        </div>
        <button
          onClick={onUnpin}
          aria-label="Unpin flight"
          className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Flight details */}
      <div className="px-3 py-2 space-y-2">
        {/* Price */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-gray-600">Price</span>
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(flight.price, flight.currency)}
          </span>
        </div>

        {/* Times */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="text-gray-600">Depart</div>
            <div className="font-semibold text-gray-900">
              {formatTime(flight.departure.time)}
            </div>
          </div>
          <div className="text-gray-400">→</div>
          <div className="text-right">
            <div className="text-gray-600">Arrive</div>
            <div className="font-semibold text-gray-900">
              {formatTime(flight.arrival.time)}
            </div>
          </div>
        </div>

        {/* Duration and Stops */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-600">Duration</div>
            <div className="font-semibold text-gray-900">
              {formatDuration(durationToMinutes(flight.duration))}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Stops</div>
            <div className="font-semibold text-gray-900">
              {flight.stops === 0 ? "Direct" : `${flight.stops}`}
            </div>
          </div>
        </div>

        {/* Airline */}
        <div className="text-xs">
          <div className="text-gray-600">Airline</div>
          <div className="font-semibold text-gray-900 truncate">
            {flight.airlines[0] || "—"}
          </div>
        </div>

        {/* Cabin */}
        <div className="text-xs">
          <div className="text-gray-600">Cabin</div>
          <div className="font-semibold text-gray-900">
            {flight.cabin.replace(/_/g, " ")}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Expanded comparison view showing detailed metrics
 */
interface ExpandedComparisonProps {
  flights: ProcessedFlight[];
}

function ExpandedComparison({ flights }: ExpandedComparisonProps) {
  const prices = flights.map((f) => f.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  const durations = flights.map((f) => durationToMinutes(f.duration));
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);

  return (
    <div className="grid gap-4">
      {/* Price Comparison */}
      <ComparisonField
        label="Price"
        flights={flights}
        getValue={(f) => f.price}
        formatValue={(v) => formatPrice(v as number, flights[0].currency)}
        highlight="lowest"
        icon="💰"
      />

      {/* Price Difference */}
      {priceRange > 0 && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <TrendingDown className="w-4 h-4" />
            <span>
              Save up to{" "}
              <span className="font-bold">
                {formatPrice(priceRange, flights[0].currency)}
              </span>{" "}
              by choosing the cheapest flight
            </span>
          </div>
        </div>
      )}

      {/* Duration Comparison */}
      <ComparisonField
        label="Duration"
        flights={flights}
        getValue={(f) => durationToMinutes(f.duration)}
        formatValue={(v) => formatDuration(v as number)}
        highlight="lowest"
        icon="⏱️"
      />

      {/* Time Saving */}
      {maxDuration - minDuration > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-xs text-blue-900">
            <TrendingDown className="w-4 h-4" />
            <span>
              Save{" "}
              <span className="font-bold">
                {formatDuration(maxDuration - minDuration)}
              </span>{" "}
              by choosing the fastest option
            </span>
          </div>
        </div>
      )}

      {/* Stops Comparison */}
      <ComparisonField
        label="Stops"
        flights={flights}
        getValue={(f) => f.stops}
        formatValue={(v) => {
          const stops = v as number;
          return stops === 0
            ? "Direct"
            : `${stops} Stop${stops > 1 ? "s" : ""}`;
        }}
        highlight="lowest"
        icon="✈️"
      />

      {/* Departure Time Comparison */}
      <ComparisonField
        label="Departure"
        flights={flights}
        getValue={(f) => f.departure.time}
        formatValue={(v) => formatTime(v as string)}
        highlight="none"
        icon="🛫"
      />

      {/* Arrival Time Comparison */}
      <ComparisonField
        label="Arrival"
        flights={flights}
        getValue={(f) => f.arrival.time}
        formatValue={(v) => formatTime(v as string)}
        highlight="none"
        icon="🛬"
      />

      {/* Cabin Comparison */}
      <ComparisonField
        label="Cabin"
        flights={flights}
        getValue={(f) => f.cabin}
        formatValue={(v) => (v as string).replace(/_/g, " ")}
        highlight="none"
        icon="💺"
      />
    </div>
  );
}

/**
 * Main Comparison Bar Component
 * Sticky bar that shows pinned flights for comparison
 */
export function CompareBar({
  pinnedFlights,
  onUnpin,
  onCompare,
  maxPinnedFlights = 3,
  className = "",
}: CompareBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (pinnedFlights.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl transition-all duration-300 ${
        isExpanded ? "max-h-screen" : "max-h-32"
      } overflow-y-auto z-40 ${className}`}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Compare Flights</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {pinnedFlights.length} / {maxPinnedFlights}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Compact view - horizontally scrollable cards */}
        {!isExpanded && (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {pinnedFlights.map((flight) => (
              <div key={flight.id} className="flex-shrink-0 w-80">
                <CompactComparisonCard
                  flight={flight}
                  onUnpin={() => onUnpin(flight.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Expanded view - detailed comparison */}
        {isExpanded && (
          <div className="pb-4">
            {/* Compact cards at top */}
            <div className="flex gap-3 overflow-x-auto mb-6 pb-2 -mx-4 px-4">
              {pinnedFlights.map((flight) => (
                <div
                  key={`compact-${flight.id}`}
                  className="flex-shrink-0 w-64"
                >
                  <CompactComparisonCard
                    flight={flight}
                    onUnpin={() => onUnpin(flight.id)}
                  />
                </div>
              ))}
            </div>

            {/* Detailed comparison metrics */}
            <ExpandedComparison flights={pinnedFlights} />

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (onCompare) {
                    onCompare(pinnedFlights);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Comparing
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-optimized hint */}
      <div className="md:hidden px-4 pb-3 text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
        💡 Swipe left/right to view all flights
      </div>
    </div>
  );
}

/**
 * Comparison Bar Provider Hook
 * Manages pinned flights state
 */
export function useCompareBar(maxPinnedFlights: number = 3) {
  const [pinnedFlights, setPinnedFlights] = useState<ProcessedFlight[]>([]);

  const addFlight = useCallback(
    (flight: ProcessedFlight) => {
      setPinnedFlights((prev) => {
        // Don't add duplicates
        if (prev.some((f) => f.id === flight.id)) {
          return prev;
        }
        // Don't exceed max pinned flights
        if (prev.length >= maxPinnedFlights) {
          return [...prev.slice(1), flight];
        }
        return [...prev, flight];
      });
    },
    [maxPinnedFlights],
  );

  const removeFlight = useCallback((flightId: string) => {
    setPinnedFlights((prev) => prev.filter((flight) => flight.id !== flightId));
  }, []);

  const clearAll = useCallback(() => {
    setPinnedFlights([]);
  }, []);

  const isFlightPinned = useCallback(
    (flightId: string) => {
      return pinnedFlights.some((f) => f.id === flightId);
    },
    [pinnedFlights],
  );

  return {
    pinnedFlights,
    addFlight,
    removeFlight,
    clearAll,
    isFlightPinned,
    pinnedCount: pinnedFlights.length,
    maxPinnedFlights,
  };
}

/**
 * Pin button component for use in flight cards
 */
interface PinButtonProps {
  flightId: string;
  isPinned: boolean;
  onToggle: () => void;
  maxReached?: boolean;
  className?: string;
}

export function PinButton({
  isPinned,
  onToggle,
  maxReached = false,
  className = "",
}: PinButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={maxReached && !isPinned}
      aria-label={isPinned ? "Unpin flight" : "Pin flight"}
      title={
        maxReached && !isPinned
          ? "Maximum flights pinned"
          : isPinned
            ? "Unpin flight"
            : "Pin flight"
      }
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
        isPinned
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      } ${maxReached && !isPinned ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <BarChart3 className="w-4 h-4" />
      {isPinned ? "Pinned" : "Pin"}
    </button>
  );
}
