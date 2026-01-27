/**
 * Airlines Filter Component
 * Multi-select filter with alliance grouping and flight counts
 */

"use client";

import { useState, useMemo } from "react";
import { ProcessedFlight } from "@/lib/types/flight";
import {
  getUniqueAirlines,
  calculateAirlineStats,
} from "@/lib/utils/flight-utils";

/**
 * Airline information with alliance
 */
interface AirlineInfo {
  code: string;
  name: string;
  alliance?: "Star Alliance" | "OneWorld" | "SkyTeam" | "Other";
  logo?: string;
  count?: number;
}

/**
 * Map airline codes to info (can be extended)
 */
const AIRLINE_DATABASE: Record<string, AirlineInfo> = {
  // Star Alliance
  UA: { code: "UA", name: "United Airlines", alliance: "Star Alliance" },
  LH: { code: "LH", name: "Lufthansa", alliance: "Star Alliance" },
  AC: { code: "AC", name: "Air Canada", alliance: "Star Alliance" },
  SQ: { code: "SQ", name: "Singapore Airlines", alliance: "Star Alliance" },
  NH: { code: "NH", name: "All Nippon Airways", alliance: "Star Alliance" },
  AZ: { code: "AZ", name: "Alitalia", alliance: "Star Alliance" },
  BR: { code: "BR", name: "EVA Air", alliance: "Star Alliance" },
  SA: { code: "SA", name: "South African Airways", alliance: "Star Alliance" },
  TP: { code: "TP", name: "TAP Portugal", alliance: "Star Alliance" },

  // OneWorld
  AA: { code: "AA", name: "American Airlines", alliance: "OneWorld" },
  BA: { code: "BA", name: "British Airways", alliance: "OneWorld" },
  QA: { code: "QA", name: "Qatar Airways", alliance: "OneWorld" },
  JL: { code: "JL", name: "Japan Airlines", alliance: "OneWorld" },
  CX: { code: "CX", name: "Cathay Pacific", alliance: "OneWorld" },
  LA: { code: "LA", name: "LATAM Airlines", alliance: "OneWorld" },
  RJ: { code: "RJ", name: "Royal Jordanian", alliance: "OneWorld" },

  // SkyTeam
  AF: { code: "AF", name: "Air France", alliance: "SkyTeam" },
  KL: { code: "KL", name: "KLM", alliance: "SkyTeam" },
  DL: { code: "DL", name: "Delta Airlines", alliance: "SkyTeam" },
  MU: { code: "MU", name: "China Eastern", alliance: "SkyTeam" },
  KE: { code: "KE", name: "Korean Air", alliance: "SkyTeam" },
  VN: { code: "VN", name: "Vietnam Airlines", alliance: "SkyTeam" },

  // Other/Low-cost carriers
  SW: { code: "SW", name: "Southwest Airlines", alliance: "Other" },
  EK: { code: "EK", name: "Emirates", alliance: "Other" },
  TK: { code: "TK", name: "Turkish Airlines", alliance: "Other" },
  G7: { code: "G7", name: "GoAir", alliance: "Other" },
  FR: { code: "FR", name: "Ryanair", alliance: "Other" },
  U2: { code: "U2", name: "EasyJet", alliance: "Other" },
  VB: { code: "VB", name: "Frontier", alliance: "Other" },
};

/**
 * Get airline info
 */
function getAirlineInfo(code: string): AirlineInfo {
  return AIRLINE_DATABASE[code] || { code, name: code, alliance: "Other" };
}

/**
 * Group airlines by alliance
 */
function groupAirlinesByAlliance(
  airlines: string[],
): Record<string, AirlineInfo[]> {
  const groups: Record<string, AirlineInfo[]> = {
    "Star Alliance": [],
    OneWorld: [],
    SkyTeam: [],
    Other: [],
  };

  airlines.forEach((code) => {
    const info = getAirlineInfo(code);
    const alliance = info.alliance || "Other";
    groups[alliance].push(info);
  });

  return groups;
}

interface AirlinesFilterProps {
  flights: ProcessedFlight[];
  value: string[];
  onChange: (airlines: string[]) => void;
  groupByAlliance?: boolean;
  className?: string;
}

/**
 * Main Airlines Filter Component
 */
export function AirlinesFilter({
  flights,
  value,
  onChange,
  groupByAlliance = true,
  className = "",
}: AirlinesFilterProps) {
  const airlines = getUniqueAirlines(flights);
  const stats = calculateAirlineStats(flights);
  const [expandedAlliances, setExpandedAlliances] = useState<Set<string>>(
    new Set(
      groupByAlliance ? ["Star Alliance", "OneWorld", "SkyTeam", "Other"] : [],
    ),
  );

  // Create airline count map
  const airlineCountMap = new Map(stats.map((stat) => [stat.code, stat.count]));

  // Group airlines
  const groupedAirlines = useMemo(() => {
    if (groupByAlliance) {
      return groupAirlinesByAlliance(airlines);
    } else {
      return {
        All: airlines.map((code) => getAirlineInfo(code)),
      };
    }
  }, [airlines, groupByAlliance]);

  /**
   * Toggle alliance expansion
   */
  const toggleAlliance = (alliance: string) => {
    const newExpanded = new Set(expandedAlliances);
    if (newExpanded.has(alliance)) {
      newExpanded.delete(alliance);
    } else {
      newExpanded.add(alliance);
    }
    setExpandedAlliances(newExpanded);
  };

  /**
   * Handle airline selection
   */
  const handleToggleAirline = (code: string) => {
    const newValue = value.includes(code)
      ? value.filter((c) => c !== code)
      : [...value, code];
    onChange(newValue);
  };

  /**
   * Select all airlines in alliance
   */
  const handleSelectAlliance = (alliance: string) => {
    const allianceAirlines =
      groupedAirlines[alliance]?.map((a) => a.code) || [];
    const isAllSelected = allianceAirlines.every((code) =>
      value.includes(code),
    );

    if (isAllSelected) {
      // Deselect all
      onChange(value.filter((code) => !allianceAirlines.includes(code)));
    } else {
      // Select all
      const newValue = new Set(value);
      allianceAirlines.forEach((code) => newValue.add(code));
      onChange(Array.from(newValue));
    }
  };

  /**
   * Select all airlines
   */
  const handleSelectAll = () => {
    if (value.length === airlines.length) {
      onChange([]);
    } else {
      onChange(airlines);
    }
  };

  /**
   * Clear all selections
   */
  const handleClear = () => {
    onChange([]);
  };

  const isAllSelected = value.length === airlines.length;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Airlines</h3>
        <span className="text-xs text-gray-600">{value.length} selected</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={handleSelectAll}
          className={`flex-1 px-2 py-1.5 rounded transition-colors font-medium ${
            isAllSelected
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          type="button"
        >
          All
        </button>

        {value.length > 0 && (
          <button
            onClick={handleClear}
            className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors font-medium"
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      {/* Airlines List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.entries(groupedAirlines).map(([alliance, allianceAirlines]) => (
          <div key={alliance} className="space-y-1">
            {/* Alliance Header */}
            {groupByAlliance && allianceAirlines.length > 0 && (
              <button
                onClick={() => toggleAlliance(alliance)}
                className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded transition-colors"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      expandedAlliances.has(alliance) ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-gray-700">
                    {alliance}
                  </span>
                </div>

                {/* Select All for Alliance */}
                <label
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAlliance(alliance);
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="checkbox"
                    checked={
                      allianceAirlines.length > 0 &&
                      allianceAirlines.every((a) => value.includes(a.code))
                    }
                    onChange={() => {}}
                    className="w-3 h-3 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </label>
              </button>
            )}

            {/* Airlines */}
            {expandedAlliances.has(alliance) && (
              <div className="space-y-1 pl-2 border-l-2 border-gray-200">
                {allianceAirlines.map((airlineInfo) => {
                  const count = airlineCountMap.get(airlineInfo.code) || 0;
                  const isSelected = value.includes(airlineInfo.code);

                  return (
                    <label
                      key={airlineInfo.code}
                      className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleAirline(airlineInfo.code)}
                        className="w-4 h-4 mt-0.5 rounded accent-blue-600"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900">
                          {airlineInfo.code}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {airlineInfo.name}
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-gray-600 flex-shrink-0">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {airlines.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No airlines available</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Airlines Filter (no grouping)
 */
interface CompactAirlinesFilterProps {
  flights: ProcessedFlight[];
  value: string[];
  onChange: (airlines: string[]) => void;
  className?: string;
}

export function CompactAirlinesFilter({
  flights,
  value,
  onChange,
  className = "",
}: CompactAirlinesFilterProps) {
  const airlines = getUniqueAirlines(flights).sort();
  const stats = calculateAirlineStats(flights);
  const airlineCountMap = new Map(stats.map((stat) => [stat.code, stat.count]));

  const handleToggle = (code: string) => {
    const newValue = value.includes(code)
      ? value.filter((c) => c !== code)
      : [...value, code];
    onChange(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">Airlines</h3>

      <div className="flex flex-wrap gap-2">
        {airlines.map((code) => {
          const info = getAirlineInfo(code);
          const count = airlineCountMap.get(code) || 0;
          const isSelected = value.includes(code);

          return (
            <button
              key={code}
              onClick={() => handleToggle(code)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              title={info.name}
              type="button"
            >
              {code}
              <span className="ml-1 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Airlines Filter with Search
 */
interface SearchableAirlinesFilterProps {
  flights: ProcessedFlight[];
  value: string[];
  onChange: (airlines: string[]) => void;
  className?: string;
}

export function SearchableAirlinesFilter({
  flights,
  value,
  onChange,
  className = "",
}: SearchableAirlinesFilterProps) {
  const airlines = getUniqueAirlines(flights);
  const stats = calculateAirlineStats(flights);
  const [search, setSearch] = useState("");

  const airlineCountMap = new Map(stats.map((stat) => [stat.code, stat.count]));

  const filteredAirlines = airlines.filter((code) => {
    const info = getAirlineInfo(code);
    const searchLower = search.toLowerCase();
    return (
      code.toLowerCase().includes(searchLower) ||
      info.name.toLowerCase().includes(searchLower)
    );
  });

  const handleToggle = (code: string) => {
    const newValue = value.includes(code)
      ? value.filter((c) => c !== code)
      : [...value, code];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === filteredAirlines.length) {
      onChange([]);
    } else {
      const newValue = new Set(value);
      filteredAirlines.forEach((code) => newValue.add(code));
      onChange(Array.from(newValue));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <h3 className="text-sm font-semibold text-gray-900">Airlines</h3>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search airlines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Select All */}
      {filteredAirlines.length > 0 && (
        <button
          onClick={handleSelectAll}
          className="w-full px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium"
          type="button"
        >
          {value.length === filteredAirlines.length ? "Deselect" : "Select"} All
        </button>
      )}

      {/* Airlines Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {filteredAirlines.map((code) => {
          const info = getAirlineInfo(code);
          const count = airlineCountMap.get(code) || 0;
          const isSelected = value.includes(code);

          return (
            <label
              key={code}
              className={`flex items-center gap-2 p-2 rounded border-2 cursor-pointer transition-colors ${
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(code)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900">
                  {code}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {info.name}
                </div>
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0">
                {count}
              </span>
            </label>
          );
        })}
      </div>

      {/* No Results */}
      {filteredAirlines.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-xs">No airlines match "{search}"</p>
        </div>
      )}
    </div>
  );
}
