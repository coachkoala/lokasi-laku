/**
 * Google Geocoding API & Places Autocomplete (New) wrapper
 * Semua request dari server (private key), tidak pernah expose ke client
 */

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

// Bounding box Bandung — dipakai sebagai soft bias (bukan filter keras),
// sesuai MVP scope yang fokus 1 kota (spec section 8)
const BANDUNG_BOUNDS = {
  southwest: { lat: -6.97, lng: 107.54 },
  northeast: { lat: -6.8, lng: 107.73 },
};
export const BANDUNG_CENTER = { lat: -6.9147, lng: 107.6098 };

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface AutocompleteSuggestion {
  placeId: string;
  text: string;
}

function requireApiKey(): string {
  if (!PLACES_API_KEY) throw new Error("GOOGLE_PLACES_API_KEY belum dikonfigurasi");
  return PLACES_API_KEY;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = requireApiKey();

  const params = new URLSearchParams({
    address,
    key,
    language: "id",
    region: "id",
    bounds: `${BANDUNG_BOUNDS.southwest.lat},${BANDUNG_BOUNDS.southwest.lng}|${BANDUNG_BOUNDS.northeast.lat},${BANDUNG_BOUNDS.northeast.lng}`,
  });

  const res = await fetch(`${GEOCODE_URL}?${params}`);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) return null;

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = requireApiKey();

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key,
    language: "id",
  });

  const res = await fetch(`${GEOCODE_URL}?${params}`);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) return null;
  return data.results[0].formatted_address;
}

export async function autocompleteSuggestions(input: string): Promise<AutocompleteSuggestion[]> {
  const key = requireApiKey();

  if (!input || input.trim().length < 3) return [];

  const body = {
    input,
    languageCode: "id",
    regionCode: "ID",
    locationBias: {
      circle: {
        center: { latitude: BANDUNG_CENTER.lat, longitude: BANDUNG_CENTER.lng },
        radius: 30000,
      },
    },
  };

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Autocomplete API error:", err);
    return [];
  }

  const data = await res.json();
  const suggestions = data.suggestions || [];

  return suggestions
    .filter((s: any) => s.placePrediction)
    .map((s: any) => ({
      placeId: s.placePrediction.placeId,
      text: s.placePrediction.text?.text || "",
    }));
}

export async function getPlaceDetails(placeId: string): Promise<GeocodeResult | null> {
  const key = requireApiKey();

  const res = await fetch(`${PLACE_DETAILS_URL}/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "location,formattedAddress",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.location) return null;

  return {
    lat: data.location.latitude,
    lng: data.location.longitude,
    formattedAddress: data.formattedAddress || "",
  };
}
