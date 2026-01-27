/**
 * Time Filter Component
 * Departure and arrival time filtering with presets
 */

"use client";

import { useState, useMemo } from "react";
import { ProcessedFlight } from "@/lib/types/flight";
import { extractHour } from "@/lib/utils/flight-utils";

interface TimeRange {
  start: number; // 0-23 (hours)
  end: number; // 0-23 (hours)
}

/**
 * Time of day presets
 */
const TIME_PRESETS = {
  morning: { label: "Morning", range: { start: 6, end: 12 }, icon: "🌅" },
  afternoon: { label: "Afternoon", range: { start: 12, end: 18 }, icon: "☀️" },
  evening: { label: "Evening", range: { start: 18, end: 24 }, icon: "🌆" },
  redEye: { label: "Red-eye", range: { start: 0, end: 6 }, icon: "🌙" },
};

/**
 * Calculate flight counts by hour
 */
function calculateHourlyCounts(
  flights: ProcessedFlight[],
  getTime: (flight: ProcessedFlight) => string,
): number[] {
  const counts = Array(24).fill(0);

  flights.forEach((flight) => {
    const hour = extractHour(getTime(flight));
    counts[hour]++;
  });

  return counts;
}

/**
 * Format hour to 12-hour format
 */
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

/**
 * Get readable time range label
 */
function getTimeRangeLabel(start: number, end: number): string {
  return `${formatHour(start)} - ${formatHour(end === 24 ? 0 : end)}`;
}

/**
 * Count flights in time range
 */
function countFlightsInRange(
  flights: ProcessedFlight[],
  start: number,
  end: number,
  getTime: (flight: ProcessedFlight) => string,
): number {
  return flights.filter((flight) => {
    const hour = extractHour(getTime(flight));
    if (start <= end) {
      return hour >= start && hour < end;
    } else {
      // Handle ranges that cross midnight (e.g., 22:00 - 06:00)
      return hour >= start || hour < end;
    }
  }).length;
}

interface DepartureTimeFilterProps {
  flights: ProcessedFlight[];
  value: TimeRange | null;
  onChange: (range: TimeRange | null) => void;
  className?: string;
}

/**
 * Main Departure Time Filter with Timeline
 */
export function DepartureTimeFilter({
  flights,
  value,
  onChange,
  className = "",
}: DepartureTimeFilterProps) {
  const hourlyCounts = useMemo(
    () => calculateHourlyCounts(flights, (f) => f.departure.time),
    [flights],
  );

  const maxCount = Math.max(...hourlyCounts);
  const [customRange, setCustomRange] = useState<TimeRange | null>(value);

  // Calculate preset counts
  const presetCounts = useMemo(
    () => ({
      morning: countFlightsInRange(flights, 6, 12, (f) => f.departure.time),
      afternoon: countFlightsInRange(flights, 12, 18, (f) => f.departure.time),
      evening: countFlightsInRange(flights, 18, 24, (f) => f.departure.time),
      redEye: countFlightsInRange(flights, 0, 6, (f) => f.departure.time),
    }),
    [flights],
  );

  /**
   * Handle preset selection
   */
  const handlePresetClick = (preset: TimeRange) => {
    if (value?.start === preset.start && value?.end === preset.end) {
      onChange(null);
    } else {
      onChange(preset);
      setCustomRange(preset);
    }
  };

  /**
   * Handle timeline bar click
   */
  const handleTimelineClick = (hour: number) => {
    const newRange: TimeRange = {
      start: hour,
      end: Math.min(hour + 4, 24),
    };
    onChange(newRange);
    setCustomRange(newRange);
  };

  const isPresetSelected = (preset: TimeRange) =>
    value?.start === preset.start && value?.end === preset.end;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <h3 className="text-sm font-semibold text-gray-900">Departure Time</h3>

      {/* Preset Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(TIME_PRESETS).map(([key, preset]) => {
          const count = presetCounts[key as keyof typeof presetCounts];
          const isSelected = isPresetSelected(preset.range);

          return (
            <button
              key={key}
              onClick={() => handlePresetClick(preset.range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </div>
              <div className="text-xs opacity-75">({count})</div>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Timeline
        </label>

        {/* Bar Chart */}
        <div className="flex items-end gap-1 h-16 bg-gray-50 p-2 rounded-lg">
          {hourlyCounts.map((count, hour) => (
            <button
              key={hour}
              onClick={() => handleTimelineClick(hour)}
              className={`flex-1 rounded-sm transition-colors hover:opacity-80 ${
                value &&
                hour >= value.start &&
                (value.end === 24 ? hour < value.end : hour < value.end)
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
              style={{ height: `${(count / maxCount) * 100}%` }}
              title={`${formatHour(hour)}: ${count} flights`}
              type="button"
            />
          ))}
        </div>

        {/* Hour Labels */}
        <div className="flex justify-between text-xs text-gray-600 px-1">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      {/* Selected Time Display */}
      {value && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900">
            {getTimeRangeLabel(value.start, value.end)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {countFlightsInRange(
              flights,
              value.start,
              value.end,
              (f) => f.departure.time,
            )}{" "}
            flights available
          </div>
        </div>
      )}

      {/* Reset Button */}
      {value && (
        <button
          onClick={() => {
            onChange(null);
            setCustomRange(null);
          }}
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
 * Compact Time Filter (Preset buttons only)
 */
interface CompactTimeFilterProps {
  flights: ProcessedFlight[];
  value: TimeRange | null;
  onChange: (range: TimeRange | null) => void;
  className?: string;
}

export function CompactTimeFilter({
  flights,
  value,
  onChange,
  className = "",
}: CompactTimeFilterProps) {
  const presetCounts = useMemo(
    () => ({
      morning: countFlightsInRange(flights, 6, 12, (f) => f.departure.time),
      afternoon: countFlightsInRange(flights, 12, 18, (f) => f.departure.time),
      evening: countFlightsInRange(flights, 18, 24, (f) => f.departure.time),
      redEye: countFlightsInRange(flights, 0, 6, (f) => f.departure.time),
    }),
    [flights],
  );

  const handleClick = (preset: TimeRange) => {
    if (value?.start === preset.start && value?.end === preset.end) {
      onChange(null);
    } else {
      onChange(preset);
    }
  };

  const isSelected = (preset: TimeRange) =>
    value?.start === preset.start && value?.end === preset.end;

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Departure Time</h3>

      <div className="flex flex-wrap gap-2">
        {Object.entries(TIME_PRESETS).map(([key, preset]) => {
          const count = presetCounts[key as keyof typeof presetCounts];
          const selected = isSelected(preset.range);

          return (
            <button
              key={key}
              onClick={() => handleClick(preset.range)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              type="button"
            >
              {preset.icon} {preset.label}
              <span className="ml-1 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Dual Time Filter (Departure + Arrival)
 */
interface DualTimeFilterProps {
  flights: ProcessedFlight[];
  departureRange: TimeRange | null;
  arrivalRange: TimeRange | null;
  onDepartureChange: (range: TimeRange | null) => void;
  onArrivalChange: (range: TimeRange | null) => void;
  className?: string;
}

export function DualTimeFilter({
  flights,
  departureRange,
  arrivalRange,
  onDepartureChange,
  onArrivalChange,
  className = "",
}: DualTimeFilterProps) {
  const departureCounts = useMemo(
    () => calculateHourlyCounts(flights, (f) => f.departure.time),
    [flights],
  );

  const arrivalCounts = useMemo(
    () => calculateHourlyCounts(flights, (f) => f.arrival.time),
    [flights],
  );

  const maxDeparture = Math.max(...departureCounts);
  const maxArrival = Math.max(...arrivalCounts);

  /**
   * Render timeline component
   */
  const renderTimeline = (
    title: string,
    counts: number[],
    maxCount: number,
    selectedRange: TimeRange | null,
    onRangeChange: (range: TimeRange | null) => void,
  ) => (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-700">{title}</label>

      <div className="flex items-end gap-1 h-12 bg-gray-50 p-2 rounded-lg">
        {counts.map((count, hour) => (
          <button
            key={hour}
            onClick={() => {
              const newRange: TimeRange = {
                start: hour,
                end: Math.min(hour + 4, 24),
              };
              onRangeChange(newRange);
            }}
            className={`flex-1 rounded-sm transition-colors hover:opacity-80 ${
              selectedRange &&
              hour >= selectedRange.start &&
              (selectedRange.end === 24
                ? hour < selectedRange.end
                : hour < selectedRange.end)
                ? "bg-blue-500"
                : "bg-gray-300"
            }`}
            style={{ height: `${(count / maxCount) * 100}%` }}
            title={`${formatHour(hour)}: ${count} flights`}
            type="button"
          />
        ))}
      </div>

      {selectedRange && (
        <div className="text-xs text-gray-600">
          {getTimeRangeLabel(selectedRange.start, selectedRange.end)}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Flight Times</h3>

      {renderTimeline(
        "Departure",
        departureCounts,
        maxDeparture,
        departureRange,
        onDepartureChange,
      )}

      {renderTimeline(
        "Arrival",
        arrivalCounts,
        maxArrival,
        arrivalRange,
        onArrivalChange,
      )}

      {/* Clear All Button */}
      {(departureRange || arrivalRange) && (
        <button
          onClick={() => {
            onDepartureChange(null);
            onArrivalChange(null);
          }}
          className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
          type="button"
        >
          Clear Time Filters
        </button>
      )}
    </div>
  );
}

/**
 * Time Slider (Range slider style)
 */
interface TimeSliderFilterProps {
  flights: ProcessedFlight[];
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

export function TimeSliderFilter({
  flights,
  value,
  onChange,
  className = "",
}: TimeSliderFilterProps) {
  const count = countFlightsInRange(
    flights,
    value.start,
    value.end,
    (f) => f.departure.time,
  );

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = Math.min(parseInt(e.target.value), value.end);
    onChange({ start: newStart, end: value.end });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = Math.max(parseInt(e.target.value), value.start);
    onChange({ start: value.start, end: newEnd });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Departure Time</h3>

      <div className="space-y-3">
        {/* Start Time Slider */}
        <div>
          <label
            htmlFor="time-start"
            className="text-xs font-medium text-gray-700 block mb-1"
          >
            From: {formatHour(value.start)}
          </label>
          <input
            id="time-start"
            type="range"
            min="0"
            max="23"
            value={value.start}
            onChange={handleStartChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* End Time Slider */}
        <div>
          <label
            htmlFor="time-end"
            className="text-xs font-medium text-gray-700 block mb-1"
          >
            To: {formatHour(value.end)}
          </label>
          <input
            id="time-end"
            type="range"
            min="0"
            max="23"
            value={value.end}
            onChange={handleEndChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm font-medium text-gray-900">
          {getTimeRangeLabel(value.start, value.end)}
        </p>
        <p className="text-xs text-gray-600 mt-1">{count} flights available</p>
      </div>
    </div>
  );
}
