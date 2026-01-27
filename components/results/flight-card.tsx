/**
 * Flight Card Component
 * Displays flight information with timeline, stops, price, and booking action
 */

"use client";

import { useState } from "react";
import { ProcessedFlight } from "@/lib/types/flight";
import {
  formatPrice,
  formatDuration,
  formatTime,
  durationToMinutes,
} from "@/lib/utils/flight-utils";
import { Plane, MapPin, Clock, Check } from "lucide-react";

interface FlightCardProps {
  flight: ProcessedFlight;
  onSelect?: (flight: ProcessedFlight) => void;
  isSelected?: boolean;
  showBadges?: boolean;
  isCheapest?: boolean;
  isFastest?: boolean;
  isBestValue?: boolean;
  className?: string;
}

/**
 * Badge component for flight highlights
 */
interface BadgeProps {
  label: string;
  variant: "cheapest" | "fastest" | "best-value";
}

function Badge({ label, variant }: BadgeProps) {
  const variantClasses = {
    cheapest: "bg-green-100 text-green-700 border-green-300",
    fastest: "bg-blue-100 text-blue-700 border-blue-300",
    "best-value": "bg-purple-100 text-purple-700 border-purple-300",
  };

  const icons = {
    cheapest: "💰",
    fastest: "⚡",
    "best-value": "⭐",
  };

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border ${variantClasses[variant]}`}
    >
      <span>{icons[variant]}</span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Timeline component showing departure and arrival
 */
interface TimelineProps {
  departure: string;
  arrival: string;
  departureAirport: string;
  arrivalAirport: string;
  duration: string;
  stops: number;
}

function FlightTimeline({
  departure,
  arrival,
  departureAirport,
  arrivalAirport,
  duration,
  stops,
}: TimelineProps) {
  const departureTime = formatTime(departure);
  const arrivalTime = formatTime(arrival);
  const durationMinutes = durationToMinutes(duration);
  const formattedDuration = formatDuration(durationMinutes);

  return (
    <div className="flex items-center gap-4 py-3">
      {/* Departure */}
      <div className="flex-shrink-0">
        <div className="text-lg font-bold text-gray-900">{departureTime}</div>
        <div className="text-sm font-semibold text-gray-700">
          {departureAirport}
        </div>
      </div>

      {/* Timeline Arrow */}
      <div className="flex-1">
        <div className="relative h-8 flex items-center">
          {/* Timeline line */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Duration label centered */}
          <div className="relative mx-auto">
            <div className="bg-white px-2 text-xs font-semibold text-gray-600 whitespace-nowrap">
              {formattedDuration}
            </div>
          </div>
        </div>

        {/* Stops indicator */}
        {stops > 0 && (
          <div className="text-center mt-1">
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
              {stops === 1 ? "1 stop" : `${stops} stops`}
            </span>
          </div>
        )}
      </div>

      {/* Arrival */}
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-bold text-gray-900">{arrivalTime}</div>
        <div className="text-sm font-semibold text-gray-700">
          {arrivalAirport}
        </div>
      </div>
    </div>
  );
}

/**
 * Stops visualization component
 */
interface StopsVisualizationProps {
  stops: number;
  segments: ProcessedFlight["segments"];
}

function StopsVisualization({ stops, segments }: StopsVisualizationProps) {
  if (stops === 0) {
    return (
      <div className="text-xs text-green-600 font-medium flex items-center gap-1">
        <Check size={14} />
        Direct flight
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {segments.map((segment, idx) => (
        <div key={idx} className="text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-700 font-semibold text-xs">
              {idx + 1}
            </span>
            <span className="font-medium">
              {segment.departure.iataCode} → {segment.arrival.iataCode}
            </span>
            <span className="text-gray-500">
              ({formatDuration(durationToMinutes(segment.duration))})
            </span>
          </div>

          {/* Layover time */}
          {idx < segments.length - 1 && segments[idx + 1] && (
            <div className="ml-7 text-gray-600 text-xs mt-1">
              Layover:{" "}
              {formatDuration(durationToMinutes(segments[idx + 1].duration))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Main Flight Card Component
 */
export function FlightCard({
  flight,
  onSelect,
  isSelected = false,
  showBadges = true,
  isCheapest = false,
  isFastest = false,
  isBestValue = false,
  className = "",
}: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasBadges = isCheapest || isFastest || isBestValue;

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg
        transition-all duration-200
        hover:shadow-md hover:border-gray-300
        overflow-hidden
        ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
        ${className}
      `}
      role="article"
      aria-label={`Flight from ${flight.departure.airport} to ${flight.arrival.airport}`}
    >
      {/* Header with badges */}
      {hasBadges && showBadges && (
        <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 flex flex-wrap gap-2">
          {isCheapest && <Badge label="Cheapest" variant="cheapest" />}
          {isFastest && <Badge label="Fastest" variant="fastest" />}
          {isBestValue && <Badge label="Best Value" variant="best-value" />}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Airline and Price Header */}
        <div className="flex items-start justify-between gap-4">
          {/* Airline Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Plane size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {flight.airlines[0] || "Flight"}
                </p>
                <p className="text-xs text-gray-500">
                  {flight.cabin
                    .replace(/_/g, " ")
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase(),
                    )
                    .join(" ")}
                </p>
              </div>
            </div>
          </div>

          {/* Price and Button */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(flight.price, flight.currency)}
            </div>
            <div className="text-xs text-gray-500">per person</div>
          </div>
        </div>

        {/* Timeline */}
        <FlightTimeline
          departure={flight.departure.time}
          arrival={flight.arrival.time}
          departureAirport={flight.departure.airport}
          arrivalAirport={flight.arrival.airport}
          duration={flight.duration}
          stops={flight.stops}
        />

        {/* Additional Details */}
        <div className="pt-3 border-t border-gray-200 space-y-3">
          {/* Terminals (if available) */}
          {(flight.departure.terminal || flight.arrival.terminal) && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin
                size={16}
                className="text-gray-500 flex-shrink-0 mt-0.5"
              />
              <span className="text-gray-600">
                {flight.departure.terminal &&
                  `Terminal ${flight.departure.terminal}`}
                {flight.departure.terminal && flight.arrival.terminal && " → "}
                {flight.arrival.terminal &&
                  `Terminal ${flight.arrival.terminal}`}
              </span>
            </div>
          )}

          {/* Expandable Section for Stop Details */}
          {flight.stops > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                aria-expanded={expanded}
                aria-controls={`stops-${flight.id}`}
                type="button"
              >
                <Clock size={16} />
                <span>
                  {flight.stops === 1 ? "1 stop" : `${flight.stops} stops`}
                </span>
                <span className="text-xs text-gray-500">
                  {expanded ? "−" : "+"}
                </span>
              </button>

              {expanded && (
                <div id={`stops-${flight.id}`} className="mt-2 ml-6 space-y-2">
                  <StopsVisualization
                    stops={flight.stops}
                    segments={flight.segments}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Select Button */}
        <button
          onClick={() => onSelect?.(flight)}
          disabled={!onSelect}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-center
            transition-all duration-200
            ${
              isSelected
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }
            disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isSelected ? "focus:ring-green-500" : "focus:ring-blue-500"}
          `}
          aria-pressed={isSelected}
          type="button"
        >
          {isSelected ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={18} />
              Selected
            </span>
          ) : (
            "Select Flight"
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Compact Flight Card (for mobile/list view)
 */
interface CompactFlightCardProps extends Omit<FlightCardProps, "flight"> {
  flight: ProcessedFlight;
}

export function CompactFlightCard({
  flight,
  onSelect,
  isSelected = false,
  isCheapest = false,
  isFastest = false,
  className = "",
}: CompactFlightCardProps) {
  const departureTime = formatTime(flight.departure.time);
  const arrivalTime = formatTime(flight.arrival.time);
  const durationMinutes = durationToMinutes(flight.duration);

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg p-3
        flex items-center justify-between gap-3
        hover:shadow-md transition-all duration-200
        ${isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""}
        ${className}
      `}
    >
      {/* Left: Route and Time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-900">
            {flight.departure.airport}
          </span>
          <Plane size={14} className="text-gray-500 flex-shrink-0" />
          <span className="font-semibold text-gray-900">
            {flight.arrival.airport}
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {departureTime} – {arrivalTime} ({formatDuration(durationMinutes)})
        </div>
        {flight.stops > 0 && (
          <div className="text-xs text-orange-600 font-medium">
            {flight.stops === 1 ? "1 stop" : `${flight.stops} stops`}
          </div>
        )}
      </div>

      {/* Right: Price and Badges */}
      <div className="flex-shrink-0 text-right space-y-2">
        {(isCheapest || isFastest) && (
          <div className="flex gap-1 justify-end">
            {isCheapest && <Badge label="Cheapest" variant="cheapest" />}
            {isFastest && <Badge label="Fastest" variant="fastest" />}
          </div>
        )}
        <div className="text-lg font-bold text-gray-900">
          {formatPrice(flight.price, flight.currency)}
        </div>
        <button
          onClick={() => onSelect?.(flight)}
          className={`
            w-20 py-1.5 px-2 text-xs font-semibold rounded
            transition-colors duration-200
            ${
              isSelected
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }
          `}
          type="button"
        >
          {isSelected ? "Selected" : "Select"}
        </button>
      </div>
    </div>
  );
}

/**
 * Flight Card Skeleton (Loading state)
 */
export function FlightCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}
      role="status"
      aria-label="Loading flight"
    >
      {/* Airline skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="py-3">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Details skeleton */}
      <div className="space-y-2 pt-3 border-t border-gray-200">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
      </div>

      {/* Button skeleton */}
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}
