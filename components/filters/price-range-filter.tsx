/**
 * Price Range Filter Component
 * Dual-handle slider with histogram and debounced updates
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ProcessedFlight } from "@/lib/types/flight";
import { calculatePriceStats } from "@/lib/utils/flight-utils";

interface PriceRange {
  min: number;
  max: number;
}

interface PriceRangeFilterProps {
  flights: ProcessedFlight[];
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  currency?: string;
  debounceMs?: number;
  className?: string;
}

/**
 * Format price with currency
 */
function formatPrice(price: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Calculate price histogram data
 */
function calculateHistogram(flights: ProcessedFlight[], buckets: number = 20) {
  if (flights.length === 0) {
    return [];
  }

  const stats = calculatePriceStats(flights);
  const range = stats.max - stats.min || 1;
  const bucketSize = range / buckets;

  // Initialize buckets
  const histogram = Array(buckets).fill(0);

  // Distribute flights into buckets
  flights.forEach((flight) => {
    const bucket = Math.min(
      Math.floor((flight.price - stats.min) / bucketSize),
      buckets - 1,
    );
    histogram[bucket]++;
  });

  // Find max count for scaling
  const maxCount = Math.max(...histogram);

  return {
    data: histogram,
    min: stats.min,
    max: stats.max,
    bucketSize,
    maxCount,
  };
}

/**
 * Main Price Range Filter Component
 */
export function PriceRangeFilter({
  flights,
  value,
  onChange,
  currency = "USD",
  debounceMs = 500,
  className = "",
}: PriceRangeFilterProps) {
  const stats = calculatePriceStats(flights);
  const histogram: any = calculateHistogram(flights);

  const [localMin, setLocalMin] = useState(value.min);
  const [localMax, setLocalMax] = useState(value.max);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced onChange
  const handleRangeChange = useCallback(
    (min: number, max: number) => {
      setLocalMin(min);
      setLocalMax(max);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onChange({ min, max });
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  // Update local state when external value changes
  useEffect(() => {
    setLocalMin(value.min);
    setLocalMax(value.max);
  }, [value]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const displayMin = Math.max(localMin, stats.min);
  const displayMax = Math.min(localMax, stats.max);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Price</h3>
        <div className="text-sm font-medium">
          <span className="text-gray-900">
            {formatPrice(displayMin, currency)}
          </span>
          <span className="text-gray-600 mx-2">–</span>
          <span className="text-gray-900">
            {formatPrice(displayMax, currency)}
          </span>
        </div>
      </div>

      {/* Histogram */}
      {histogram.data && histogram.maxCount > 0 && (
        <div className="h-12 bg-gray-50 rounded-lg p-2 flex items-end gap-0.5">
          {histogram.data.map((count: number, index: number) => {
            const height = (count / histogram.maxCount) * 100;
            const isInRange =
              index * histogram.bucketSize + histogram.min >= displayMin &&
              index * histogram.bucketSize + histogram.min <= displayMax;

            return (
              <div
                key={index}
                className={`flex-1 rounded-sm transition-colors ${
                  isInRange ? "bg-blue-500" : "bg-gray-300"
                }`}
                style={{ height: `${height}%` }}
                title={`${count} flights`}
              />
            );
          })}
        </div>
      )}

      {/* Slider Container */}
      <div className="space-y-4">
        {/* Min Slider */}
        <div>
          <label
            htmlFor="price-min"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Minimum Price
          </label>
          <div className="flex items-center gap-2">
            <input
              id="price-min"
              type="range"
              min={stats.min}
              max={stats.max}
              value={localMin}
              onChange={(e) => {
                const newMin = Math.min(parseInt(e.target.value), localMax);
                handleRangeChange(newMin, localMax);
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 slider-thumb"
            />
            <span className="w-16 text-right text-sm font-medium text-gray-900">
              {formatPrice(displayMin, currency)}
            </span>
          </div>
        </div>

        {/* Max Slider */}
        <div>
          <label
            htmlFor="price-max"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Maximum Price
          </label>
          <div className="flex items-center gap-2">
            <input
              id="price-max"
              type="range"
              min={stats.min}
              max={stats.max}
              value={localMax}
              onChange={(e) => {
                const newMax = Math.max(parseInt(e.target.value), localMin);
                handleRangeChange(localMin, newMax);
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 slider-thumb"
            />
            <span className="w-16 text-right text-sm font-medium text-gray-900">
              {formatPrice(displayMax, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="pt-2 border-t border-gray-200 space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Lowest:</span>
          <span className="font-semibold">
            {formatPrice(stats.min, currency)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Average:</span>
          <span className="font-semibold">
            {formatPrice(stats.average, currency)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>Highest:</span>
          <span className="font-semibold">
            {formatPrice(stats.max, currency)}
          </span>
        </div>
      </div>

      {/* Reset Button */}
      {(localMin !== stats.min || localMax !== stats.max) && (
        <button
          onClick={() => {
            handleRangeChange(stats.min, stats.max);
          }}
          className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
          type="button"
        >
          Reset Price Range
        </button>
      )}

      <style>{`
        input[type='range'].slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        input[type='range'].slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #2563eb;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

/**
 * Compact Price Range Filter (single dual-handle slider)
 */
interface CompactPriceRangeFilterProps {
  flights: ProcessedFlight[];
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  currency?: string;
  debounceMs?: number;
  className?: string;
}

export function CompactPriceRangeFilter({
  flights,
  value,
  onChange,
  currency = "USD",
  debounceMs = 500,
  className = "",
}: CompactPriceRangeFilterProps) {
  const stats = calculatePriceStats(flights);
  const [localMin, setLocalMin] = useState(value.min);
  const [localMax, setLocalMax] = useState(value.max);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleRangeChange = useCallback(
    (min: number, max: number) => {
      setLocalMin(min);
      setLocalMax(max);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onChange({ min, max });
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  useEffect(() => {
    setLocalMin(value.min);
    setLocalMax(value.max);
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Price</h3>
        <div className="text-sm font-medium">
          {formatPrice(localMin, currency)} – {formatPrice(localMax, currency)}
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={stats.min}
          max={stats.max}
          value={localMin}
          onChange={(e) => {
            const newMin = Math.min(parseInt(e.target.value), localMax);
            handleRangeChange(newMin, localMax);
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <input
          type="range"
          min={stats.min}
          max={stats.max}
          value={localMax}
          onChange={(e) => {
            const newMax = Math.max(parseInt(e.target.value), localMin);
            handleRangeChange(localMin, newMax);
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
}

/**
 * Price Input Component (manual entry)
 */
interface PriceInputsProps {
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  currency?: string;
  minPrice?: number;
  maxPrice?: number;
  className?: string;
}

export function PriceInputs({
  value,
  onChange,
  currency = "USD",
  minPrice = 0,
  maxPrice = 10000,
  className = "",
}: PriceInputsProps) {
  const [minInput, setMinInput] = useState(String(value.min));
  const [maxInput, setMaxInput] = useState(String(value.max));

  const handleApply = () => {
    const min = Math.max(minPrice, parseInt(minInput) || minPrice);
    const max = Math.min(maxPrice, parseInt(maxInput) || maxPrice);

    if (min <= max) {
      onChange({ min, max });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>

      <div className="grid grid-cols-2 gap-2">
        {/* Min Price Input */}
        <div>
          <label
            htmlFor="price-input-min"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Min
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <span className="px-2 text-gray-600 text-sm">$</span>
            <input
              id="price-input-min"
              type="number"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              min={minPrice}
              max={maxPrice}
              className="flex-1 px-2 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            />
          </div>
        </div>

        {/* Max Price Input */}
        <div>
          <label
            htmlFor="price-input-max"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Max
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <span className="px-2 text-gray-600 text-sm">$</span>
            <input
              id="price-input-max"
              type="number"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              min={minPrice}
              max={maxPrice}
              className="flex-1 px-2 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleApply}
        className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        type="button"
      >
        Apply
      </button>
    </div>
  );
}

/**
 * Price Filter Presets
 */
interface PricePresetsProps {
  flights: ProcessedFlight[];
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  currency?: string;
  className?: string;
}

export function PricePresets({
  flights,
  value,
  onChange,
  currency = "USD",
  className = "",
}: PricePresetsProps) {
  const stats = calculatePriceStats(flights);

  const presets = [
    {
      label: "Budget",
      min: stats.min,
      max: stats.min + (stats.max - stats.min) * 0.25,
    },
    {
      label: "Moderate",
      min: stats.min + (stats.max - stats.min) * 0.25,
      max: stats.min + (stats.max - stats.min) * 0.5,
    },
    {
      label: "Standard",
      min: stats.min + (stats.max - stats.min) * 0.5,
      max: stats.min + (stats.max - stats.min) * 0.75,
    },
    {
      label: "Premium",
      min: stats.min + (stats.max - stats.min) * 0.75,
      max: stats.max,
    },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Price Categories</h3>

      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange({ min: preset.min, max: preset.max })}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              value.min === preset.min && value.max === preset.max
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            type="button"
          >
            <div>{preset.label}</div>
            <div className="text-xs opacity-75">
              {formatPrice(preset.min, currency)} –{" "}
              {formatPrice(preset.max, currency)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
