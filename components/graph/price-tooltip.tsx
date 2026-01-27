/**
 * Custom Recharts Tooltip for Price Graph
 * Displays detailed flight information on hover
 */

"use client";

import { ProcessedFlight } from "@/lib/types/flight";
import { Clock, Plane, MapPin, AlertCircle, Zap } from "lucide-react";

export interface GraphDataPoint {
  time?: string;
  airline?: string;
  stops?: number;
  duration?: string;
  price: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
  flights: ProcessedFlight[];
  flightIds: string[];
}

export interface PriceTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: GraphDataPoint;
    color?: string;
    name?: string;
  }>;
  label?: string;
}

/**
 * Custom tooltip component for Recharts
 * Shows flight details, pricing info, and flight list
 */
export function PriceTooltip({ active, payload }: PriceTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as GraphDataPoint;

  const isPriceDeal = data.price <= data.avgPrice * 0.9;
  const priceVariance = (
    ((data.price - data.minPrice) / (data.maxPrice - data.minPrice)) *
    100
  ).toFixed(0);

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden w-80">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Flight Details</h3>
          {isPriceDeal && (
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
              <Zap className="w-3 h-3" />
              Deal!
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3">
        {/* Flight Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Time Information */}
          {data.time && (
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Departure</p>
                <p className="text-sm font-semibold text-gray-900">
                  {data.time}
                </p>
              </div>
            </div>
          )}

          {/* Airline Information */}
          {data.airline && (
            <div className="flex items-start gap-2">
              <Plane className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Airline</p>
                <p className="text-sm font-semibold text-gray-900">
                  {data.airline}
                </p>
              </div>
            </div>
          )}

          {/* Duration Information */}
          {data.duration && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Duration</p>
                <p className="text-sm font-semibold text-gray-900">
                  {data.duration}
                </p>
              </div>
            </div>
          )}

          {/* Stops Information */}
          {data.stops !== undefined && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Stops</p>
                <p className="text-sm font-semibold text-gray-900">
                  {data.stops === 0
                    ? "Direct"
                    : `${data.stops} ${data.stops === 1 ? "Stop" : "Stops"}`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Section */}
        <div className="border-t border-gray-200 pt-3">
          <div className="space-y-2">
            {/* Current Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Current Price
              </span>
              <span
                className={`text-lg font-bold ${isPriceDeal ? "text-green-600" : "text-blue-600"}`}
              >
                ${data.price.toFixed(2)}
              </span>
            </div>

            {/* Price Statistics */}
            <div className="bg-gray-50 rounded-md p-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Average:</span>
                <span className="font-semibold text-gray-900">
                  ${data.avgPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Lowest:</span>
                <span className="font-semibold text-green-600">
                  ${data.minPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Highest:</span>
                <span className="font-semibold text-orange-600">
                  ${data.maxPrice.toFixed(2)}
                </span>
              </div>

              {/* Price Range Bar */}
              <div className="mt-2 pt-1 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 border-l border-blue-700"
                      style={{ width: `${priceVariance}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                    {priceVariance}%
                  </span>
                </div>
              </div>
            </div>

            {/* Flight Count */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-gray-600">Total Flights:</span>
              <span className="font-semibold text-gray-900">{data.count}</span>
            </div>
          </div>
        </div>

        {/* Individual Flight List */}
        {data.flights.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-semibold text-gray-900 mb-2">
              Flights in this group:
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {data.flights.slice(0, 5).map((flight) => (
                <div
                  key={flight.id}
                  className="text-xs bg-gray-50 rounded p-2 flex items-center justify-between hover:bg-gray-100 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {flight.airlines[0]}
                    </p>
                    <p className="text-gray-600">
                      {flight.stops} {flight.stops === 1 ? "stop" : "stops"}
                    </p>
                  </div>
                  <span className="font-bold text-blue-600 ml-2">
                    ${flight.price}
                  </span>
                </div>
              ))}

              {/* Show more indicator */}
              {data.flights.length > 5 && (
                <div className="text-xs text-center text-gray-600 py-1 font-medium">
                  +{data.flights.length - 5} more flights
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-600">
        <p>Hover over other points for comparison</p>
      </div>
    </div>
  );
}

/**
 * Compact tooltip variant for mobile
 * Reduces height and shows essential info only
 */
export function CompactPriceTooltip({ active, payload }: PriceTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as GraphDataPoint;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64">
      {/* Price and Status */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">Price</span>
        <span className="text-lg font-bold text-blue-600">
          ${data.price.toFixed(2)}
        </span>
      </div>

      {/* Quick Details */}
      <div className="text-xs space-y-1 text-gray-700">
        {data.time && <p>🕐 {data.time}</p>}
        {data.airline && <p>✈️ {data.airline}</p>}
        {data.duration && <p>⏱️ {data.duration}</p>}
        {data.stops !== undefined && (
          <p>
            🛬{" "}
            {data.stops === 0
              ? "Direct"
              : `${data.stops} stop${data.stops > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* Pricing Stats */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 space-y-0.5">
        <p>Avg: ${data.avgPrice.toFixed(2)}</p>
        <p>
          Range: ${data.minPrice.toFixed(2)} - ${data.maxPrice.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

/**
 * Minimal tooltip variant
 * Shows only essential price information
 */
export function MinimalPriceTooltip({ active, payload }: PriceTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as GraphDataPoint;

  return (
    <div className="bg-white rounded-md shadow-lg border border-gray-300 px-3 py-2">
      <p className="text-sm font-bold text-blue-600">
        ${data.price.toFixed(2)}
      </p>
      {data.time && <p className="text-xs text-gray-600">{data.time}</p>}
      {data.count > 0 && (
        <p className="text-xs text-gray-500">{data.count} flights</p>
      )}
    </div>
  );
}

/**
 * Tooltip with comparison indicators
 * Highlights value vs average
 */
export function ComparisonPriceTooltip({ active, payload }: PriceTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as GraphDataPoint;
  const diff = data.price - data.avgPrice;
  const diffPercent = ((diff / data.avgPrice) * 100).toFixed(1);
  const isBelow = diff < 0;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-72">
      {/* Current Price */}
      <div className="mb-2">
        <p className="text-xs text-gray-600 font-medium mb-1">Price</p>
        <p className="text-2xl font-bold text-blue-600">
          ${data.price.toFixed(2)}
        </p>
      </div>

      {/* Comparison to Average */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-md p-2 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">vs Average</span>
          <span
            className={`text-sm font-bold ${
              isBelow ? "text-green-600" : "text-orange-600"
            }`}
          >
            {isBelow ? "-" : "+"}${Math.abs(diff).toFixed(2)} ({diffPercent}%)
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1 text-xs text-gray-700 mb-2">
        {data.time && <p>Departure: {data.time}</p>}
        {data.airline && <p>Airline: {data.airline}</p>}
        {data.duration && <p>Duration: {data.duration}</p>}
        {data.stops !== undefined && (
          <p>Stops: {data.stops === 0 ? "Direct" : `${data.stops}`}</p>
        )}
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 rounded p-2 text-xs space-y-0.5 text-gray-700">
        <p>
          <span className="text-gray-600">Average:</span>{" "}
          <span className="font-semibold">${data.avgPrice.toFixed(2)}</span>
        </p>
        <p>
          <span className="text-gray-600">Cheapest:</span>{" "}
          <span className="font-semibold text-green-600">
            ${data.minPrice.toFixed(2)}
          </span>
        </p>
        <p>
          <span className="text-gray-600">Most Expensive:</span>{" "}
          <span className="font-semibold text-orange-600">
            ${data.maxPrice.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
}
