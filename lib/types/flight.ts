/**
 * TypeScript interfaces for flight search data
 * Based on Amadeus Self-Service API response structure
 */

/**
 * Airport information
 */
export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  countryCode: string;
}

/**
 * Airline information
 */
export interface Airline {
  iataCode: string;
  name: string;
  logo?: string;
}

/**
 * Aircraft information
 */
export interface Aircraft {
  iataCode: string;
  name: string;
}

/**
 * Flight segment (leg of the journey)
 */
export interface FlightSegment {
  id: string;
  departure: {
    iataCode: string;
    at: string; // ISO 8601 datetime
    terminal?: string;
  };
  arrival: {
    iataCode: string;
    at: string; // ISO 8601 datetime
    terminal?: string;
  };
  operatingAirline: {
    carrierCode: string;
    name?: string;
  };
  aircraft: {
    code: string;
    name?: string;
  };
  operating?: string;
  stops?: number;
  carrierCode: string;
  number: string;
  duration: string; // ISO 8601 duration (e.g., "PT10H30M")
  numberOfStops: number;
  blacklistedInEU?: boolean;
}

/**
 * Flight itinerary (outbound or return leg)
 */
export interface FlightItinerary {
  duration: string; // ISO 8601 duration
  segments: FlightSegment[];
}

/**
 * Traveler pricing details
 */
export interface TravelerPricing {
  travelerId: string;
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    fareBasis: string;
    class?: string;
    includedCheckedBags?: {
      weight: number;
      weightUnit: string;
    };
  }>;
}

/**
 * Price breakdown
 */
export interface PriceDetails {
  total: string;
  base: string;
  fee: string;
  grandTotal: string;
  currency: string;
  billingCurrency?: string;
}

/**
 * Main flight offer returned by Amadeus API
 */
export interface FlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string; // ISO date
  numberOfBookableSeats: number;
  itineraries: FlightItinerary[];
  price: PriceDetails;
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

/**
 * Search request parameters
 */
export interface SearchParams {
  departure: string; // IATA code
  arrival: string; // IATA code
  departDate: string; // ISO date YYYY-MM-DD
  returnDate?: string; // ISO date YYYY-MM-DD (optional for round trip)
  adults: number;
  children: number;
  infants?: number;
  cabin?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  currencyCode?: string;
  max?: number;
}

/**
 * Filter state for UI filtering and sorting
 */
export interface FilterState {
  // Price filters
  maxPrice: number;
  minPrice: number;

  // Airline filters
  selectedAirlines: string[];

  // Time filters
  departureTimeRange: {
    start: number; // Hour 0-23
    end: number;
  };
  arrivalTimeRange: {
    start: number;
    end: number;
  };

  // Stops filter
  maxStops: number;

  // Duration filter
  maxDuration: number; // Minutes

  // Sorting
  sortBy: "price" | "duration" | "departure" | "arrival" | "stops";
  sortOrder: "asc" | "desc";

  // Cabin filter
  cabins: Array<"ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST">;
}

/**
 * Processed flight for display
 */
export interface ProcessedFlight {
  id: string;
  departure: {
    airport: string;
    time: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    time: string;
    terminal?: string;
  };
  duration: string;
  stops: number;
  airlines: string[];
  price: number;
  currency: string;
  cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  bestAtTime?: string; // Best price at this time slot
  departureDate: string;
  segments: FlightSegment[];
  rawOffer: FlightOffer;
}

/**
 * Amadeus API error response
 */
export interface AmadeusError {
  errors: Array<{
    status: number;
    code: string;
    title: string;
    detail: string;
    source?: {
      pointer?: string;
      parameter?: string;
    };
  }>;
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  data: T;
  meta?: {
    count: number;
    links: {
      self: string;
    };
  };
  errors?: AmadeusError["errors"];
}

/**
 * Search result with metadata
 */
export interface SearchResult {
  flights: ProcessedFlight[];
  meta: {
    totalResults: number;
    currency: string;
    searchParams: SearchParams;
  };
}

/**
 * Price statistics
 */
export interface PriceStats {
  min: number;
  max: number;
  average: number;
  median: number;
}

/**
 * Airline statistics
 */
export interface AirlineStats {
  code: string;
  name: string;
  count: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
}

/**
 * Amenities for a segment
 */
export interface Amenity {
  isChargeable: boolean;
  amenity: string;
  description?: string;
}

/**
 * Bag allowance details
 */
export interface BagDetails {
  weight: number;
  weightUnit: string;
  pieces?: number;
}

/**
 * Seat information
 */
export interface SeatInfo {
  designator: string;
  cabin: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  deck?: string;
  aislePosition?: string;
  position?: string;
}

/**
 * Booking reference after booking
 */
export interface BookingConfirmation {
  id: string;
  associatedRecords: Array<{
    reference: string;
    creationDate: string;
  }>;
  queuingOfficeId: string;
  flightOffers: FlightOffer[];
  travelers: Array<{
    id: string;
    dateOfBirth: string;
    name: {
      firstName: string;
      lastName: string;
    };
    gender: "MALE" | "FEMALE";
    contact: {
      emailAddress: string;
      phones: Array<{
        deviceType: string;
        countryCallingCode: string;
        number: string;
      }>;
    };
    documents: Array<{
      documentType: string;
      birthPlace?: string;
      issuanceLocation?: string;
      issuanceDate?: string;
      number: string;
      expiryDate: string;
      issuanceCountry: string;
      validityCountry: string;
      nationality: string;
      holder: boolean;
    }>;
  }>;
  remarks?: Array<{
    category: string;
    detail: string;
  }>;
  contacts: Array<{
    addresseeName: {
      firstName: string;
      lastName: string;
    };
    address: {
      lines: string[];
      cityName: string;
      postalCode: string;
      countryCode: string;
    };
    emailAddress: string;
    phones: Array<{
      deviceType: string;
      countryCallingCode: string;
      number: string;
    }>;
  }>;
}
