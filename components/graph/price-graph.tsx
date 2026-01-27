/**
 * Interactive Price Graph Component
 * Shows price trends across filtered flights with Recharts
 */

"use client";

import { useMemo, useState } from "react";
import { ProcessedFlight } from "@/lib/types/flight";
import { formatPrice, durationToMinutes } from "@/lib/utils/flight-utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { PriceTooltip, CompactPriceTooltip } from "./price-tooltip";

interface PriceGraphProps {
  flights: ProcessedFlight[];
  selectedFlightId?: string | null;
  onFlightSelect?: (flightId: string) => void;
  height?: number;
  showAverageLine?: boolean;
  showLegend?: boolean;
  animationDuration?: number;
  className?: string;
  groupBy?: "time" | "airline" | "stops" | "duration";
}

interface GraphDataPoint {
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

/**
 * Custom dot renderer for data points
 */
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: GraphDataPoint;
  isSelected?: boolean;
}

function CustomDot({ cx, cy, isSelected }: CustomDotProps) {
  if (cx === undefined || cy === undefined) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isSelected ? 6 : 4}
      fill={isSelected ? "#2563EB" : "#3B82F6"}
      stroke={isSelected ? "#1E40AF" : "#1D4ED8"}
      strokeWidth={isSelected ? 2 : 1}
      className="transition-all"
    />
  );
}

/**
 * Price Statistics Component
 */
interface PriceStatsProps {
  flights: ProcessedFlight[];
  averagePrice: number;
  currency: string;
}

function PriceStats({ flights, averagePrice, currency }: PriceStatsProps) {
  const prices = flights.map((f) => f.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const cheapestFlight = flights.find((f) => f.price === minPrice);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Average Price */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
          Average
        </p>
        <p className="text-xl font-bold text-blue-900">
          {formatPrice(averagePrice, currency)}
        </p>
      </div>

      {/* Minimum Price */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
        <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">
          Lowest
        </p>
        <p className="text-xl font-bold text-green-900">
          {formatPrice(minPrice, currency)}
        </p>
        {cheapestFlight && (
          <p className="text-xs text-green-700 mt-1 truncate">
            {cheapestFlight.airlines[0]}
          </p>
        )}
      </div>

      {/* Maximum Price */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">
          Highest
        </p>
        <p className="text-xl font-bold text-orange-900">
          {formatPrice(maxPrice, currency)}
        </p>
      </div>

      {/* Price Range */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">
          Range
        </p>
        <p className="text-xl font-bold text-purple-900">
          {formatPrice(priceRange, currency)}
        </p>
        <p className="text-xs text-purple-700 mt-1">
          {((priceRange / minPrice) * 100).toFixed(0)}% variance
        </p>
      </div>
    </div>
  );
}

/**
 * Main Price Graph Component
 */
export function PriceGraph({
  flights,
  selectedFlightId,
  height = 400,
  showAverageLine = true,
  showLegend = true,
  animationDuration = 300,
  className = "",
  groupBy = "time",
}: PriceGraphProps) {
  // Process data based on grouping
  const { graphData, averagePrice, minPrice, maxPrice, currency } =
    useMemo(() => {
      if (flights.length === 0) {
        return {
          graphData: [],
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
          currency: "USD",
        };
      }

      const currency = flights[0].currency;
      const priceMap = new Map<string, GraphDataPoint>();

      flights.forEach((flight) => {
        let key: string;

        switch (groupBy) {
          case "airline":
            key = flight.airlines[0] || "Unknown";
            break;
          case "stops":
            key = `${flight.stops} Stop${flight.stops !== 1 ? "s" : ""}`;
            break;
          case "duration":
            key = flight.duration;
            break;
          case "time":
          default:
            key = flight.departure.time;
            break;
        }

        if (!priceMap.has(key)) {
          priceMap.set(key, {
            ...(groupBy === "time" && { time: key }),
            ...(groupBy === "airline" && { airline: key }),
            ...(groupBy === "stops" && { stops: parseInt(key) }),
            ...(groupBy === "duration" && { duration: key }),
            price: flight.price,
            avgPrice: flight.price,
            minPrice: flight.price,
            maxPrice: flight.price,
            count: 1,
            flights: [flight],
            flightIds: [flight.id],
          });
        } else {
          const existing = priceMap.get(key)!;
          existing.price = (existing.price + flight.price) / 2;
          existing.avgPrice = existing.avgPrice;
          existing.minPrice = Math.min(existing.minPrice, flight.price);
          existing.maxPrice = Math.max(existing.maxPrice, flight.price);
          existing.count++;
          existing.flights.push(flight);
          existing.flightIds.push(flight.id);
        }
      });

      const data = Array.from(priceMap.values());

      // Sort data for better visualization
      if (groupBy === "time") {
        data.sort(
          (a, b) =>
            parseInt(a.time?.split(":")[0] || "0") -
            parseInt(b.time?.split(":")[0] || "0"),
        );
      } else if (groupBy === "stops") {
        data.sort((a, b) => (a.stops || 0) - (b.stops || 0));
      } else if (groupBy === "duration") {
        data.sort(
          (a, b) =>
            durationToMinutes(a.duration || "PT0H") -
            durationToMinutes(b.duration || "PT0H"),
        );
      }

      const prices = flights.map((f) => f.price);
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Update average price for all points
      data.forEach((point) => {
        point.avgPrice = averagePrice;
      });

      return {
        graphData: data,
        averagePrice,
        minPrice,
        maxPrice,
        currency,
      };
    }, [flights, groupBy]);

  const selectedIndex = useMemo(() => {
    if (!selectedFlightId) return -1;
    return graphData.findIndex((point) =>
      point.flightIds.includes(selectedFlightId),
    );
  }, [graphData, selectedFlightId]);

  if (flights.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-gray-50 p-8 ${className}`}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Info className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">No flight data available</p>
          <p className="text-sm text-gray-500">
            Add filters or search to see price trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Price Trends</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {maxPrice > averagePrice ? (
              <>
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span>Higher than average</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span>Lower than average</span>
              </>
            )}
          </div>
        </div>

        {/* Price Statistics */}
        <PriceStats
          flights={flights}
          averagePrice={averagePrice}
          currency={currency}
        />
      </div>

      {/* Chart */}
      <div className="rounded-lg bg-gray-50 p-4 mb-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={graphData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              vertical={false}
            />
            <XAxis
              dataKey={
                groupBy === "time"
                  ? "time"
                  : groupBy === "airline"
                    ? "airline"
                    : groupBy === "stops"
                      ? "stops"
                      : "duration"
              }
              stroke="#6B7280"
              style={{ fontSize: 12 }}
              angle={groupBy === "time" ? 0 : -45}
              textAnchor={groupBy === "time" ? "middle" : "end"}
              height={groupBy === "time" ? 30 : 60}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: 12 }}
              label={{
                value: `Price (${currency})`,
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
              domain={[minPrice * 0.9, maxPrice * 1.1]}
            />
            <Tooltip content={<PriceTooltip />} />
            {showLegend && <Legend />}

            {/* Average price line */}
            {showAverageLine && (
              <ReferenceLine
                y={averagePrice}
                stroke="#9CA3AF"
                strokeDasharray="5 5"
                label={{
                  value: `Avg: $${averagePrice.toFixed(0)}`,
                  position: "right",
                  fill: "#6B7280",
                  fontSize: 12,
                }}
              />
            )}

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={(props) => (
                <CustomDot
                  {...props}
                  isSelected={
                    selectedIndex === graphData.indexOf(props.payload)
                  }
                />
              )}
              activeDot={{ r: 7, fill: "#2563EB", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={animationDuration}
              name="Price"
              connectNulls
            />

            {/* Min/Max shading */}
            <Line
              type="monotone"
              dataKey="minPrice"
              stroke="transparent"
              strokeWidth={0}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="maxPrice"
              stroke="transparent"
              strokeWidth={0}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-700">Price Trend</span>
        </div>
        {showAverageLine && (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-0.5 bg-gray-400"
              style={{ borderTop: "2px dashed #9CA3AF" }}
            ></div>
            <span className="text-gray-700">Average Price</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span className="text-gray-700">Selected Flight</span>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>💡 Insight:</strong> {flights.length} flights found. The price
          range is{" "}
          <strong>
            {formatPrice(maxPrice - minPrice, currency)} (
            {(((maxPrice - minPrice) / minPrice) * 100).toFixed(0)}%)
          </strong>
          . Cheapest at{" "}
          <strong>
            {flights.find((f) => f.price === minPrice)?.departure.time}
          </strong>
          .
        </p>
      </div>
    </div>
  );
}

/**
 * Alternative: Stacked Area Chart variant
 */
export function PriceAreaChart({
  flights,
  selectedFlightId,
  onFlightSelect,
  height = 400,
  className = "",
}: Omit<PriceGraphProps, "groupBy"> & { groupBy?: never }) {
  return (
    <PriceGraph
      flights={flights}
      selectedFlightId={selectedFlightId}
      onFlightSelect={onFlightSelect}
      height={height}
      className={className}
      groupBy="time"
    />
  );
}

/**
 * Price Graph with multiple metrics
 */
interface MultiMetricPriceGraphProps extends Omit<PriceGraphProps, "groupBy"> {
  metrics?: ("price" | "duration" | "stops")[];
}

export function MultiMetricPriceGraph({
  flights,
  selectedFlightId,
  onFlightSelect,
  height = 500,
  className = "",
  metrics = ["price"],
}: MultiMetricPriceGraphProps) {
  const [activeMetric, setActiveMetric] = useState<
    "price" | "duration" | "stops"
  >("price");

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
    >
      {/* Metric Selector */}
      {metrics.length > 1 && (
        <div className="mb-4 flex gap-2">
          {metrics.map((metric) => (
            <button
              key={metric}
              onClick={() => setActiveMetric(metric)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeMetric === metric
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {metric === "price" && "💰 Price"}
              {metric === "duration" && "⏱️ Duration"}
              {metric === "stops" && "✈️ Stops"}
            </button>
          ))}
        </div>
      )}

      {/* Graph */}
      <PriceGraph
        flights={flights}
        selectedFlightId={selectedFlightId}
        onFlightSelect={onFlightSelect}
        height={height}
        groupBy="time"
      />
    </div>
  );
}
