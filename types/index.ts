/**
 * Type definitions for LokasiLaku
 */

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface Recommendation {
  id: string;
  category: string;
  score: string;
  scoreType: "hot" | "medium" | "low";
  description: string;
  competitors: number;
  avgRating: number | null;
  mapPin: {
    x: number;
    y: number;
  };
}

export interface AnalysisRequest {
  lat: number;
  lng: number;
  radius: number;
  mode: "discover" | "validate";
  category?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    recommendations: Recommendation[];
    insights: string;
    stats: Record<string, any>;
  };
  error?: string;
}

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  rating: number;
  reviewCount: number;
  formattedAddress: string;
}

export interface CategoryRadiusRange {
  min: number;
  max: number;
  label: string;
}

export const CATEGORY_RADIUS_RANGES: Record<string, CategoryRadiusRange> = {
  kafe: { min: 400, max: 1500, label: "Kafe (nongkrong/kerja)" },
  kopi: { min: 300, max: 1000, label: "Kedai kopi to-go" },
  laundry: { min: 400, max: 1200, label: "Laundry kiloan" },
  warmindo: { min: 300, max: 1000, label: "Warmindo / nasi kotak" },
  bengkel: { min: 500, max: 1500, label: "Bengkel motor" },
  salon: { min: 400, max: 1200, label: "Salon / barbershop" },
  apotek: { min: 400, max: 1500, label: "Apotek" },
  bimbel: { min: 500, max: 1500, label: "Bimbel / les privat" },
  kelontong: { min: 200, max: 800, label: "Toko kelontong" },
};
