/**
 * Airport Autocomplete Component
 * Debounced search with airport code + city display
 * Integrates with react-hook-form
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { Airport } from "@/lib/types/flight";
import { useController, UseControllerProps } from "react-hook-form";

interface AirportAutocompleteProps extends Omit<
  UseControllerProps<any>,
  "render"
> {
  placeholder?: string;
  onSelect?: (airport: Airport) => void;
  limit?: number;
  disabled?: boolean;
  className?: string;
}

interface AirportSearchResponse {
  success: boolean;
  data: Airport[];
  meta: {
    count: number;
  };
}

/**
 * Fetcher for SWR
 */
async function airportFetcher(url: string): Promise<Airport[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch airports");
  }

  const data: AirportSearchResponse = await response.json();
  return data.data || [];
}

/**
 * Airport Autocomplete Component (standalone)
 */
export function AirportAutocompleteStandalone({
  placeholder = "Search airports...",
  onSelect,
  limit = 10,
  disabled = false,
  className = "",
}: Omit<AirportAutocompleteProps, "name" | "control">) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      if (search.length > 0) {
        setIsOpen(true);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  // Fetch airports
  const {
    data: airports = [],
    isLoading,
    error,
  } = useSWR<Airport[]>(
    debouncedSearch.length > 0
      ? `/api/airports?q=${encodeURIComponent(debouncedSearch)}&limit=${limit}`
      : null,
    airportFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Handle airport selection
   */
  const handleSelectAirport = (airport: Airport) => {
    setSelectedAirport(airport);
    setSearch(`${airport.iataCode}`);
    setIsOpen(false);
    onSelect?.(airport);
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  const showEmpty =
    debouncedSearch.length > 0 && !isLoading && airports.length === 0;
  const showResults = !isLoading && airports.length > 0;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => search.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {/* Loading state */}
          {isLoading && (
            <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Searching airports...
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="px-4 py-2 text-sm text-red-600">
              Failed to load airports. Please try again.
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              <svg
                className="w-6 h-6 mx-auto mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-9-2m9 2l9-2m-9-8l9 2m-9-2l-9 2"
                />
              </svg>
              No airports found for "{debouncedSearch}"
            </div>
          )}

          {/* Results */}
          {showResults && (
            <ul className="divide-y divide-gray-100">
              {airports.map((airport) => (
                <li key={airport.iataCode}>
                  <button
                    type="button"
                    onClick={() => handleSelectAirport(airport)}
                    className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 transition-colors focus:outline-none"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {airport.iataCode}
                        </div>
                        <div className="text-sm text-gray-600">
                          {airport.name}
                          {airport.city && ` • ${airport.city}`}
                        </div>
                      </div>
                      {selectedAirport?.iataCode === airport.iataCode && (
                        <svg
                          className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Search prompt */}
          {!isLoading && !error && debouncedSearch.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Type to search for airports...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Airport Autocomplete Component with react-hook-form integration
 */
export function AirportAutocomplete({
  placeholder = "Search airports...",
  onSelect,
  limit = 10,
  disabled = false,
  className = "",
  control,
  name,
  ...props
}: AirportAutocompleteProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
    ...props,
  });

  const handleSelect = (airport: Airport) => {
    field.onChange(airport.iataCode);
    onSelect?.(airport);
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          {...field}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          } disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {/* Render standalone component for dropdown */}
      <AirportAutocompleteStandalone
        placeholder={placeholder}
        onSelect={handleSelect}
        limit={limit}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Minimal Airport Autocomplete (for use in controlled forms)
 * Simpler version without dropdown management
 */
interface MinimalAirportAutocompleteProps {
  value: string;
  onChange: (airport: Airport | null) => void;
  placeholder?: string;
  limit?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export function MinimalAirportAutocomplete({
  value,
  onChange,
  placeholder = "Select airport...",
  limit = 10,
  disabled = false,
  error,
  label,
}: MinimalAirportAutocompleteProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  // Fetch airports
  const { data: airports = [], isLoading } = useSWR<Airport[]>(
    debouncedSearch.length > 0
      ? `/api/airports?q=${encodeURIComponent(debouncedSearch)}&limit=${limit}`
      : null,
    airportFetcher,
    { revalidateOnFocus: false },
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (airport: Airport) => {
    setSearch(airport.iataCode);
    onChange(airport);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}

      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500"
          }`}
        />

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {isLoading && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Searching...
              </div>
            )}

            {!isLoading && airports.length === 0 && search.length > 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">
                No airports found
              </div>
            )}

            {!isLoading && airports.length > 0 && (
              <ul className="divide-y">
                {airports.map((airport) => (
                  <li key={airport.iataCode}>
                    <button
                      type="button"
                      onClick={() => handleSelect(airport)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50"
                    >
                      <div className="font-semibold">{airport.iataCode}</div>
                      <div className="text-sm text-gray-600">
                        {airport.city}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
