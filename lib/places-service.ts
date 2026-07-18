/**
 * Google Places API (New) wrapper untuk fetch & process POI data
 */

import { POI } from "@/types";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://places.googleapis.com/v1/places:searchNearby";

/**
 * POI kategori mapping untuk Google Places
 * Sesuaikan dengan Google's type taxonomy
 */
const CATEGORY_MAPPING: Record<string, string[]> = {
  laundry: ["laundry"],
  kafe: ["cafe"],
  kopi: ["cafe"],
  warmindo: ["restaurant"],
  bengkel: ["auto_repair"],
  salon: ["beauty_salon", "hair_care"],
  apotek: ["pharmacy"],
  bimbel: ["tutoring_center"],
  kelontong: ["grocery_store"],
  fotokopi: ["office_supply_store"],
};

interface PlacesNearbyRequest {
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  includedTypes?: string[];
  pageSize?: number;
  languageCode?: string;
}

/**
 * Fetch nearby places (POIs) dari Google Places API
 * Returns: Array of normalized POI objects
 */
export async function getNearbyPlaces(
  lat: number,
  lng: number,
  radius: number,
  categories?: string[]
): Promise<POI[]> {
  if (!PLACES_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY not configured");
  }

  const types = categories
    ? categories.flatMap((cat) => CATEGORY_MAPPING[cat.toLowerCase()] || [])
    : undefined;

  const requestBody: PlacesNearbyRequest = {
    location: {
      latitude: lat,
      longitude: lng,
    },
    radius,
    includedTypes: types && types.length > 0 ? types : undefined,
    pageSize: 50,
    languageCode: "id",
  };

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": PLACES_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Places API error:", error);
      throw new Error(`Places API error: ${error.error?.message}`);
    }

    const data = await response.json();

    // Map Google Places response to our POI format
    const pois: POI[] = (data.places || []).map((place: any) => ({
      id: place.name, // Google Places returns full path as name
      name: place.displayName?.text || "",
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      category: place.types?.[0] || "unknown",
      rating: place.rating || 0,
      reviewCount: place.userRatingCount || 0,
      formattedAddress: place.formattedAddress || "",
    }));

    return pois;
  } catch (error) {
    console.error("Error fetching places:", error);
    throw error;
  }
}

/**
 * Group POIs by category dan compute aggregates
 */
export function aggregatePOIsByCategory(pois: POI[]): Record<string, any> {
  const aggregated: Record<string, any> = {};

  for (const poi of pois) {
    const cat = poi.category;
    if (!aggregated[cat]) {
      aggregated[cat] = {
        count: 0,
        totalRating: 0,
        minDistance: Infinity,
        places: [],
      };
    }

    aggregated[cat].count += 1;
    aggregated[cat].totalRating += poi.rating;
    aggregated[cat].places.push(poi);
  }

  // Compute averages
  const result: Record<string, any> = {};
  for (const [cat, data] of Object.entries(aggregated)) {
    result[cat] = {
      count: data.count,
      avgRating: data.count > 0 ? (data.totalRating / data.count).toFixed(1) : 0,
      places: data.places,
    };
  }

  return result;
}

/**
 * Calculate distance between two coordinates (simplified - using delta coords)
 * For production, use proper Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Find nearest POI for a category
 */
export function findNearest(
  pois: POI[],
  userLat: number,
  userLng: number
): POI | null {
  if (pois.length === 0) return null;

  let nearest = pois[0];
  let minDist = calculateDistance(userLat, userLng, pois[0].lat, pois[0].lng);

  for (const poi of pois.slice(1)) {
    const dist = calculateDistance(userLat, userLng, poi.lat, poi.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = poi;
    }
  }

  return nearest;
}
