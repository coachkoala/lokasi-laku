/**
 * Google Places API (New) wrapper — Text Search untuk kategori bisnis bebas ketik
 */

import { POI } from "@/types";

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.formattedAddress";

/**
 * Cari bisnis berdasar kategori bebas ketik user (Text Search, bukan Nearby
 * Search) — Text Search menerima query bahasa natural apa saja, tidak
 * terbatas ke taksonomi tipe tetap Google, sesuai kebutuhan input bebas.
 *
 * Text Search hanya mendukung locationBias (soft bias), bukan locationRestriction
 * (hard filter) seperti Nearby Search. Jadi hasil tetap perlu difilter jarak
 * di sisi kita (lihat route handler) supaya benar-benar dalam radius.
 */
export async function searchPlacesByText(
  query: string,
  lat: number,
  lng: number,
  radius: number
): Promise<POI[]> {
  if (!PLACES_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY belum dikonfigurasi");
  }

  const requestBody = {
    textQuery: query,
    languageCode: "id",
    maxResultCount: 20,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius,
      },
    },
  };

  const response = await fetch(TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Places Text Search error:", error);
    throw new Error(`Places API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return (data.places || []).map((place: any) => ({
    id: place.id,
    name: place.displayName?.text || "",
    lat: place.location?.latitude || 0,
    lng: place.location?.longitude || 0,
    category: query,
    rating: place.rating || 0,
    reviewCount: place.userRatingCount || 0,
    formattedAddress: place.formattedAddress || "",
  }));
}

/**
 * Jarak great-circle antara dua koordinat (meter), formula Haversine.
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
