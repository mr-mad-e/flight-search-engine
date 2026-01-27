/**
 * Stops Filter Component
 * Filter flights by number of stops with flight count display
 */

"use client";

import { useState } from "react";
import { ProcessedFlight } from "@/lib/types/flight";

interface StopsFilterProps {
  flights: ProcessedFlight[];
  value: number | null;
  onChange: (value: number | null) => void;
  allowMultiple?: boolean;
  className?: string;
}

/**
 * Calculate flight counts by stops
 */
function calculateStopsCounts(flights: ProcessedFlight[]) {
  const counts = {
    direct: 0,
    oneStop: 0,
    twoPlus: 0,
    all: flights.length,
  };

  flights.forEach((flight) => {
    if (flight.stops === 0) counts.direct++;
    else if (flight.stops === 1) counts.oneStop++;
    else counts.twoPlus++;
  });

  return counts;
}

/**
 * Stop option item
 */
interface StopOptionProps {
  id: string;
  label: string;
  count: number;
  isSelected: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  description?: string;
  isMultiple?: boolean;
}

function StopOption({
  id,
  label,
  count,
  isSelected,
  onChange,
  icon,
  description,
  isMultiple = false,
}: StopOptionProps) {
  return (
    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
      {/* Checkbox or Radio */}
      <input
        type={isMultiple ? "checkbox" : "radio"}
        id={id}
        checked={isSelected}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 mt-0.5 rounded"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900">{label}</span>
          <span className="text-sm text-gray-600 font-semibold">{count}</span>
        </div>

        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {/* Icon */}
      {icon && <div className="text-gray-400 flex-shrink-0">{icon}</div>}
    </label>
  );
}

/**
 * Main Stops Filter Component
 */
export function StopsFilter({
  flights,
  value,
  onChange,
  allowMultiple = false,
  className = "",
}: StopsFilterProps) {
  const counts = calculateStopsCounts(flights);

  const handleDirectChange = (checked: boolean) => {
    if (!allowMultiple) {
      onChange(checked ? 0 : null);
    }
  };

  const handleOneStopChange = (checked: boolean) => {
    if (!allowMultiple) {
      onChange(checked ? 1 : null);
    }
  };

  const handleTwoPlus = (checked: boolean) => {
    if (!allowMultiple) {
      onChange(checked ? 2 : null);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Stops</h3>

      <div className="space-y-2">
        {/* Direct Flights */}
        <StopOption
          id="stops-direct"
          label="Direct"
          count={counts.direct}
          isSelected={value === 0}
          onChange={handleDirectChange}
          description="No layovers"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          }
        />

        {/* 1 Stop */}
        <StopOption
          id="stops-one"
          label="1 Stop"
          count={counts.oneStop}
          isSelected={value === 1}
          onChange={handleOneStopChange}
          description="1 layover"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4"
              />
            </svg>
          }
        />

        {/* 2+ Stops */}
        <StopOption
          id="stops-two-plus"
          label="2+ Stops"
          count={counts.twoPlus}
          isSelected={value === 2}
          onChange={handleTwoPlus}
          description="Multiple layovers"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Stats Summary */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Total flights: <span className="font-semibold">{counts.all}</span>
        </p>
      </div>

      {/* Clear Filter Button */}
      {value !== null && (
        <button
          onClick={() => onChange(null)}
          className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
          type="button"
        >
          Clear Filter
        </button>
      )}
    </div>
  );
}

/**
 * Compact Stops Filter (horizontal layout)
 */
export function CompactStopsFilter({
  flights,
  value,
  onChange,
  className = "",
}: Omit<StopsFilterProps, "allowMultiple">) {
  const counts = calculateStopsCounts(flights);

  const options = [
    { label: "Direct", stops: 0, count: counts.direct },
    { label: "1 Stop", stops: 1, count: counts.oneStop },
    { label: "2+ Stops", stops: 2, count: counts.twoPlus },
  ];

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          value === null
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
        }`}
        type="button"
      >
        All <span className="ml-1 opacity-75">({counts.all})</span>
      </button>

      {options.map((option) => (
        <button
          key={option.stops}
          onClick={() => onChange(option.stops === 2 ? 2 : option.stops)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === option.stops
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
          type="button"
        >
          {option.label}
          <span className="ml-1 opacity-75">({option.count})</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Stops Filter with Slider (price range style)
 */
interface StopsSliderFilterProps {
  flights: ProcessedFlight[];
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function StopsSliderFilter({
  flights,
  value,
  onChange,
  className = "",
}: StopsSliderFilterProps) {
  const counts = calculateStopsCounts(flights);

  const labels = {
    0: `Direct (${counts.direct})`,
    1: `1 Stop (${counts.oneStop})`,
    2: `2+ Stops (${counts.twoPlus})`,
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Maximum Stops</h3>

      <div className="space-y-4">
        {/* Slider */}
        <div className="px-2">
          <input
            type="range"
            min="0"
            max="2"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          {/* Labels */}
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Direct</span>
            <span>1 Stop</span>
            <span>2+ Stops</span>
          </div>
        </div>

        {/* Current Value Display */}
        <div className="px-3 py-2 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            Maximum: {labels[value as keyof typeof labels]}
          </p>
        </div>

        {/* Flight Count */}
        <div className="text-xs text-gray-600">
          <p>
            Showing flights with up to{" "}
            <span className="font-semibold">
              {value === 0 ? "direct" : value === 1 ? "1 stop" : "2+ stops"}
            </span>{" "}
            available
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Advanced Stops Filter with statistics
 */
interface AdvancedStopsFilterProps {
  flights: ProcessedFlight[];
  value: number | null;
  onChange: (value: number | null) => void;
  showStats?: boolean;
  className?: string;
}

export function AdvancedStopsFilter({
  flights,
  value,
  onChange,
  showStats = true,
  className = "",
}: AdvancedStopsFilterProps) {
  const counts = calculateStopsCounts(flights);

  // Calculate average duration by stops
  const stats = {
    direct:
      flights
        .filter((f) => f.stops === 0)
        .reduce((sum, f) => sum + f.segments.length, 0) / (counts.direct || 1),
    oneStop:
      flights
        .filter((f) => f.stops === 1)
        .reduce((sum, f) => sum + f.segments.length, 0) / (counts.oneStop || 1),
    twoPlus:
      flights
        .filter((f) => f.stops >= 2)
        .reduce((sum, f) => sum + f.segments.length, 0) / (counts.twoPlus || 1),
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Stops</h3>

      <div className="space-y-2">
        {/* Direct Option */}
        <button
          onClick={() => onChange(value === 0 ? null : 0)}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-left ${
            value === 0
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          type="button"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Direct</div>
              {showStats && (
                <div className="text-xs text-gray-600 mt-0.5">
                  Non-stop flight
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{counts.direct}</div>
              <div className="text-xs text-gray-600">flights</div>
            </div>
          </div>
        </button>

        {/* 1 Stop Option */}
        <button
          onClick={() => onChange(value === 1 ? null : 1)}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-left ${
            value === 1
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          type="button"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">1 Stop</div>
              {showStats && (
                <div className="text-xs text-gray-600 mt-0.5">One layover</div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {counts.oneStop}
              </div>
              <div className="text-xs text-gray-600">flights</div>
            </div>
          </div>
        </button>

        {/* 2+ Stops Option */}
        <button
          onClick={() => onChange(value === 2 ? null : 2)}
          className={`w-full px-4 py-3 rounded-lg border-2 transition-colors text-left ${
            value === 2
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          type="button"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">2+ Stops</div>
              {showStats && (
                <div className="text-xs text-gray-600 mt-0.5">
                  Multiple layovers
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">
                {counts.twoPlus}
              </div>
              <div className="text-xs text-gray-600">flights</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
