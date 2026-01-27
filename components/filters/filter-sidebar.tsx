/**
 * Filter Sidebar Component
 * Responsive filter panel with all filters, active badges, and reset functionality
 */

"use client";

import { useState, useCallback } from "react";
import { ProcessedFlight, FilterState } from "@/lib/types/flight";
import { X, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { StopsFilter } from "./stops-filter";
import { PriceRangeFilter } from "./price-range-filter";
import { AirlinesFilter } from "./airlines-filter";
import { DepartureTimeFilter } from "./time-filter";

interface TimeRange {
  start: number;
  end: number;
}

interface FilterSidebarProps {
  flights: ProcessedFlight[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

/**
 * Badge for displaying active filter
 */
interface ActiveFilterBadgeProps {
  label: string;
  onRemove: () => void;
}

function ActiveFilterBadge({ label, onRemove }: ActiveFilterBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
      <span className="font-medium">{label}</span>
      <button
        onClick={onRemove}
        className="hover:text-blue-900 transition-colors"
        aria-label="Remove filter"
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/**
 * Collapsible filter section
 */
interface FilterSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  hasActiveFilter?: boolean;
}

function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
  hasActiveFilter = false,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {hasActiveFilter && (
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-gray-600" />
        ) : (
          <ChevronDown size={20} className="text-gray-600" />
        )}
      </button>

      {isOpen && <div className="px-4 py-3 bg-white">{children}</div>}
    </div>
  );
}

/**
 * Main Filter Sidebar Component
 */
export function FilterSidebar({
  flights,
  filters,
  onFiltersChange,
  className = "",
}: FilterSidebarProps) {
  // Expand/collapse state for each section
  const [openSections, setOpenSections] = useState({
    stops: true,
    price: true,
    time: false,
    airlines: true,
  });

  // Time range local state
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);

  /**
   * Toggle section open/closed
   */
  const toggleSection = useCallback((section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  /**
   * Handle stops filter change
   */
  const handleStopsChange = useCallback(
    (stops: number | null) => {
      onFiltersChange({
        ...filters,
        maxStops: stops ?? 2,
      });
    },
    [filters, onFiltersChange],
  );

  /**
   * Handle price range change
   */
  const handlePriceChange = useCallback(
    (minPrice: number, maxPrice: number) => {
      onFiltersChange({
        ...filters,
        minPrice,
        maxPrice,
      });
    },
    [filters, onFiltersChange],
  );

  /**
   * Handle airlines filter change
   */
  const handleAirlinesChange = useCallback(
    (airlines: string[]) => {
      onFiltersChange({
        ...filters,
        selectedAirlines: airlines,
      });
    },
    [filters, onFiltersChange],
  );

  /**
   * Handle time range change
   */
  const handleTimeChange = useCallback(
    (range: TimeRange | null) => {
      setTimeRange(range);
      onFiltersChange({
        ...filters,
        departureTimeRange: range ?? { start: 0, end: 24 },
      });
    },
    [filters, onFiltersChange],
  );

  /**
   * Reset all filters
   */
  const handleResetAll = useCallback(() => {
    onFiltersChange({
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
    setTimeRange(null);
  }, [onFiltersChange]);

  /**
   * Build active filters list
   */
  const activeFilters: Array<{ label: string; onRemove: () => void }> = [];

  if (filters.maxStops !== undefined && filters.maxStops !== 2) {
    activeFilters.push({
      label:
        filters.maxStops === 0
          ? "Direct flights"
          : `${filters.maxStops} stop(s)`,
      onRemove: () => handleStopsChange(2),
    });
  }

  if (filters.minPrice > 0 || filters.maxPrice < 10000) {
    activeFilters.push({
      label: `$${filters.minPrice}-$${filters.maxPrice}`,
      onRemove: () => handlePriceChange(0, 10000),
    });
  }

  if (filters.selectedAirlines && filters.selectedAirlines.length > 0) {
    activeFilters.push({
      label: `${filters.selectedAirlines.length} airline(s)`,
      onRemove: () => handleAirlinesChange([]),
    });
  }

  if (
    filters.departureTimeRange &&
    (filters.departureTimeRange.start !== 0 ||
      filters.departureTimeRange.end !== 24)
  ) {
    const formatHour = (hour: number) => {
      if (hour === 0) return "12 AM";
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return "12 PM";
      return `${hour - 12} PM`;
    };
    activeFilters.push({
      label: `${formatHour(filters.departureTimeRange.start)}-${formatHour(filters.departureTimeRange.end)}`,
      onRemove: () => handleTimeChange(null),
    });
  }

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <>
      {/* Mobile Sheet Overlay */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-40" />

      {/* Sidebar Container */}
      <div
        className={`
          fixed lg:relative
          bottom-0 lg:bottom-auto
          left-0 right-0 lg:left-auto lg:right-auto
          bg-white rounded-t-2xl rounded-b-none lg:rounded-t-lg lg:rounded-b-lg
          max-h-[90vh] lg:max-h-full
          overflow-y-auto
          w-full lg:w-64
          border-t lg:border-t-0 lg:border-r border-gray-200
          z-50 lg:z-auto
          shadow-lg lg:shadow-none
          transition-transform duration-300
          ${className}
        `}
      >
        {/* Mobile Handle */}
        <div className="lg:hidden h-1 w-12 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={handleResetAll}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                type="button"
              >
                <RotateCcw size={16} />
                Reset All
              </button>
            )}
          </div>

          {/* Active Filters Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map((filter, idx) => (
                <ActiveFilterBadge
                  key={idx}
                  label={filter.label}
                  onRemove={filter.onRemove}
                />
              ))}
            </div>
          )}
        </div>

        {/* Filter Sections */}
        <div className="divide-y divide-gray-200">
          {/* Stops Filter */}
          <FilterSection
            title="Stops"
            isOpen={openSections.stops}
            onToggle={() => toggleSection("stops")}
            hasActiveFilter={
              filters.maxStops !== undefined && filters.maxStops !== 2
            }
          >
            <StopsFilter
              flights={flights}
              value={filters.maxStops ?? null}
              onChange={handleStopsChange}
            />
          </FilterSection>

          {/* Price Filter */}
          <FilterSection
            title="Price"
            isOpen={openSections.price}
            onToggle={() => toggleSection("price")}
            hasActiveFilter={filters.minPrice > 0 || filters.maxPrice < 10000}
          >
            <PriceRangeFilter
              flights={flights}
              value={{
                min: filters.minPrice,
                max: filters.maxPrice,
              }}
              onChange={(value) => handlePriceChange(value.min, value.max)}
            />
          </FilterSection>

          {/* Time Filter */}
          <FilterSection
            title="Departure Time"
            isOpen={openSections.time}
            onToggle={() => toggleSection("time")}
            hasActiveFilter={
              filters.departureTimeRange &&
              (filters.departureTimeRange.start !== 0 ||
                filters.departureTimeRange.end !== 24)
            }
          >
            <DepartureTimeFilter
              flights={flights}
              value={timeRange}
              onChange={handleTimeChange}
            />
          </FilterSection>

          {/* Airlines Filter */}
          <FilterSection
            title="Airlines"
            isOpen={openSections.airlines}
            onToggle={() => toggleSection("airlines")}
            hasActiveFilter={
              filters.selectedAirlines && filters.selectedAirlines.length > 0
            }
          >
            <AirlinesFilter
              flights={flights}
              value={filters.selectedAirlines ?? []}
              onChange={handleAirlinesChange}
            />
          </FilterSection>
        </div>

        {/* Mobile Footer CTA */}
        <div className="lg:hidden sticky bottom-0 p-4 border-t border-gray-200 bg-white space-y-2">
          <button
            onClick={handleResetAll}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            type="button"
          >
            Reset All
          </button>
          <button
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            type="button"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Compact Filter Sidebar (Minimal version for headers)
 */
interface CompactFilterSidebarProps {
  activeFilterCount: number;
  onOpen: () => void;
  className?: string;
}

export function CompactFilterButton({
  activeFilterCount,
  onOpen,
  className = "",
}: CompactFilterSidebarProps) {
  return (
    <button
      onClick={onOpen}
      className={`
        inline-flex items-center gap-2
        px-4 py-2
        bg-white border border-gray-300 rounded-lg
        text-sm font-medium text-gray-700
        hover:bg-gray-50 hover:border-gray-400
        transition-colors
        ${className}
      `}
      type="button"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
      Filters
      {activeFilterCount > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}

/**
 * Filter Results Info
 */
interface FilterResultsInfoProps {
  totalFlights: number;
  filteredFlights: number;
  activeFilterCount: number;
}

export function FilterResultsInfo({
  totalFlights,
  filteredFlights,
  activeFilterCount,
}: FilterResultsInfoProps) {
  if (activeFilterCount === 0) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-700">
          Showing all <span className="font-semibold">{totalFlights}</span>{" "}
          flights
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <p className="text-sm text-gray-700">
        <span className="font-semibold">{filteredFlights}</span> of{" "}
        <span className="font-semibold">{totalFlights}</span> flights match{" "}
        <span className="font-semibold">{activeFilterCount}</span> filter
        {activeFilterCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
