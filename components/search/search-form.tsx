/**
 * Flight Search Form Component
 * Main search form with all filters and options
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Airport, SearchParams } from "@/lib/types/flight";
import { AirportAutocompleteStandalone } from "@/components/search/airport-autocomplete";
import {
  DatePickerStandalone,
  DateRangePickerStandalone,
} from "@/components/search/date-picker";

/**
 * Validation schema for flight search
 */
const flightSearchSchema = z.object({
  departure: z
    .string()
    .length(3, "Departure airport code must be 3 letters")
    .regex(/^[A-Z]{3}$/, "Departure code must be uppercase letters"),

  arrival: z
    .string()
    .length(3, "Arrival airport code must be 3 letters")
    .regex(/^[A-Z]{3}$/, "Arrival code must be uppercase letters"),

  departDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid departure date format"),

  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid return date format")
    .optional()
    .or(z.literal("")),

  adults: z
    .number()
    .min(1, "At least 1 adult is required")
    .max(9, "Maximum 9 adults allowed"),

  children: z
    .number()
    .min(0, "Cannot have negative children")
    .max(8, "Maximum 8 children allowed"),

  cabin: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),

  isRoundTrip: z.boolean().default(false),
});

export type FlightSearchFormData = z.infer<typeof flightSearchSchema>;

interface SearchFormProps {
  onSearch: (data: FlightSearchFormData) => void;
  isLoading?: boolean;
  initialValues?: Partial<FlightSearchFormData>;
}

/**
 * Passenger count selector component
 */
function PassengerSelector({
  label,
  value,
  onChange,
  min = 0,
  max = 9,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
              d="M20 12H4"
            />
          </svg>
        </button>

        <span className="w-12 text-center text-lg font-semibold">{value}</span>

        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="p-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Main Flight Search Form Component
 */
export function FlightSearchForm({
  onSearch,
  isLoading = false,
  initialValues,
}: SearchFormProps) {
  const [departure, setDeparture] = useState<Airport | null>(null);
  const [arrival, setArrival] = useState<Airport | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(
    initialValues?.isRoundTrip ?? false,
  );
  const [adults, setAdults] = useState(initialValues?.adults ?? 1);
  const [children, setChildren] = useState(initialValues?.children ?? 0);
  const [departDate, setDepartDate] = useState(initialValues?.departDate ?? "");
  const [returnDate, setReturnDate] = useState(initialValues?.returnDate ?? "");
  const [cabin, setCabin] = useState<
    "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"
  >(initialValues?.cabin ?? "ECONOMY");
  const [errors, setErrors] = useState<
    Partial<Record<keyof FlightSearchFormData, string>>
  >({});

  /**
   * Validate and submit form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const formData = {
        departure: departure?.iataCode || "",
        arrival: arrival?.iataCode || "",
        departDate,
        returnDate: isRoundTrip ? returnDate : undefined,
        adults,
        children,
        cabin,
        isRoundTrip,
      };

      const validated = flightSearchSchema.parse(formData);
      onSearch(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        // error.errors.forEach((err) => {
        //   const path = err.path[0] as keyof FlightSearchFormData;
        //   fieldErrors[path] = err.message;
        // });
        setErrors(fieldErrors);
      }
    }
  };

  /**
   * Swap departure and arrival airports
   */
  const handleSwapAirports = () => {
    const temp = departure;
    setDeparture(arrival);
    setArrival(temp);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Trip Type Selection */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!isRoundTrip}
              onChange={() => {
                setIsRoundTrip(false);
                setReturnDate("");
              }}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">One Way</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isRoundTrip}
              onChange={() => setIsRoundTrip(true)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Round Trip</span>
          </label>
        </div>

        {/* Airports Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Departure Airport */}
            <div>
              <label className="block text-sm font-medium mb-2">From</label>
              <AirportAutocompleteStandalone
                onSelect={(airport) => {
                  setDeparture(airport);
                  setErrors({ ...errors, departure: "" });
                }}
              />
              {errors.departure && (
                <p className="text-red-600 text-sm mt-1">{errors.departure}</p>
              )}
              {departure && (
                <p className="text-sm text-gray-600 mt-1">{departure.city}</p>
              )}
            </div>

            {/* Arrival Airport */}
            <div>
              <label className="block text-sm font-medium mb-2">To</label>
              <div className="relative">
                <AirportAutocompleteStandalone
                  onSelect={(airport) => {
                    setArrival(airport);
                    setErrors({ ...errors, arrival: "" });
                  }}
                />

                {/* Swap Button */}
                <button
                  type="button"
                  onClick={handleSwapAirports}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-md transition-colors"
                  title="Swap airports"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
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
                </button>
              </div>

              {errors.arrival && (
                <p className="text-red-600 text-sm mt-1">{errors.arrival}</p>
              )}
              {arrival && (
                <p className="text-sm text-gray-600 mt-1">{arrival.city}</p>
              )}
            </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="space-y-4">
          {isRoundTrip ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure Date */}
              <div>
                <DatePickerStandalone
                  value={departDate}
                  onChange={(date) => {
                    setDepartDate(date);
                    setErrors({ ...errors, departDate: "" });
                  }}
                  label="Depart"
                  showFlexibleDatesHint={true}
                />
                {errors.departDate && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.departDate}
                  </p>
                )}
              </div>

              {/* Return Date */}
              <div>
                <DatePickerStandalone
                  value={returnDate}
                  onChange={(date) => {
                    setReturnDate(date);
                    setErrors({ ...errors, returnDate: "" });
                  }}
                  label="Return"
                  minDate={departDate ? new Date(departDate) : undefined}
                  showFlexibleDatesHint={true}
                />
                {errors.returnDate && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.returnDate}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* One Way Departure Date */}
              <DatePickerStandalone
                value={departDate}
                onChange={(date) => {
                  setDepartDate(date);
                  setErrors({ ...errors, departDate: "" });
                }}
                label="Depart"
                showFlexibleDatesHint={true}
              />
              {errors.departDate && (
                <p className="text-red-600 text-sm mt-1">{errors.departDate}</p>
              )}
            </div>
          )}
        </div>

        {/* Passengers & Cabin Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Adults */}
          <PassengerSelector
            label="Adults"
            value={adults}
            onChange={(value) => {
              setAdults(value);
              setErrors({ ...errors, adults: "" });
            }}
            min={1}
            max={9}
          />

          {/* Children */}
          <PassengerSelector
            label="Children"
            value={children}
            onChange={(value) => {
              setChildren(value);
              setErrors({ ...errors, children: "" });
            }}
            min={0}
            max={8}
          />

          {/* Cabin Class */}
          <div className="space-y-1">
            <label
              htmlFor="cabin"
              className="block text-sm font-medium text-gray-700"
            >
              Cabin Class
            </label>
            <select
              id="cabin"
              value={cabin}
              onChange={(e) => {
                setCabin(e.target.value as typeof cabin);
                setErrors({ ...errors, cabin: "" });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ECONOMY">Economy</option>
              <option value="PREMIUM_ECONOMY">Premium Economy</option>
              <option value="BUSINESS">Business</option>
              <option value="FIRST">First Class</option>
            </select>
            {errors.cabin && (
              <p className="text-red-600 text-sm mt-1">{errors.cabin}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search Flights
              </>
            )}
          </button>

          {/* Clear Button */}
          <button
            type="button"
            onClick={() => {
              setDeparture(null);
              setArrival(null);
              setDepartDate("");
              setReturnDate("");
              setAdults(1);
              setChildren(0);
              setCabin("ECONOMY");
              setIsRoundTrip(false);
              setErrors({});
            }}
            className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </form>
  );
}

/**
 * Compact Flight Search Form (for sticky header)
 */
export function CompactFlightSearchForm({
  onSearch,
  isLoading = false,
}: SearchFormProps) {
  const [departure, setDeparture] = useState<Airport | null>(null);
  const [arrival, setArrival] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departure?.iataCode || !arrival?.iataCode || !departDate) {
      return;
    }

    const formData = {
      departure: departure.iataCode,
      arrival: arrival.iataCode,
      departDate,
      returnDate: undefined,
      adults: 1,
      children: 0,
      cabin: "ECONOMY" as const,
      isRoundTrip: false,
    };

    onSearch(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white rounded-lg shadow p-4 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
        {/* Departure */}
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1">From</label>
          <AirportAutocompleteStandalone
            onSelect={setDeparture}
            placeholder="JFK"
          />
        </div>

        {/* Arrival */}
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1">To</label>
          <AirportAutocompleteStandalone
            onSelect={setArrival}
            placeholder="LHR"
          />
        </div>

        {/* Depart Date */}
        <div className="flex-1">
          <DatePickerStandalone
            value={departDate}
            onChange={setDepartDate}
            placeholder="Depart"
            showFlexibleDatesHint={false}
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading || !departure || !arrival || !departDate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>
    </form>
  );
}
