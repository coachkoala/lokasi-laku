/**
 * Type definitions for LokasiLaku
 */

export interface Location {
  address: string;
  lat: number;
  lng: number;
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

export interface CompetitorInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  rating: number | null;
}

export interface ValidationResult {
  category: string;
  verdict: "good" | "risky" | "unknown";
  title: string;
  description: string;
  competitorCount: number;
  avgRating: number | null;
  nearestDistance: number | null;
  competitors: CompetitorInfo[];
  radiusGuidance: CategoryRadiusRange | null;
}

export interface AnalysisRequest {
  lat: number;
  lng: number;
  radius: number;
  category: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: ValidationResult;
  error?: string;
  cached?: boolean;
}

export interface CategoryRadiusRange {
  min: number;
  max: number;
  label: string;
}

/**
 * Rentang radius wajar per kategori bisnis (spec section 3) — dipakai untuk
 * guardrail radius: sarankan default & peringatkan kalau user set radius
 * jauh di luar jarak wajar yang orang biasa mau tempuh untuk kategori itu.
 */
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

const CATEGORY_KEYWORD_MAP: Record<string, keyof typeof CATEGORY_RADIUS_RANGES> = {
  kafe: "kafe",
  cafe: "kafe",
  ngopi: "kafe",
  kopi: "kopi",
  laundry: "laundry",
  londri: "laundry",
  cuci: "laundry",
  warmindo: "warmindo",
  nasi: "warmindo",
  warteg: "warmindo",
  makan: "warmindo",
  bengkel: "bengkel",
  motor: "bengkel",
  servis: "bengkel",
  salon: "salon",
  potong: "salon",
  rambut: "salon",
  barbershop: "salon",
  cukur: "salon",
  apotek: "apotek",
  obat: "apotek",
  farmasi: "apotek",
  bimbel: "bimbel",
  les: "bimbel",
  privat: "bimbel",
  kursus: "bimbel",
  kelontong: "kelontong",
  minimarket: "kelontong",
  warung: "kelontong",
};

/**
 * Cari referensi radius wajar dari teks kategori bebas yang diketik user
 * (fuzzy match berbasis kata kunci). Return null kalau tidak ada yang cocok —
 * ini kondisi normal untuk kategori niche (spec section 4 grup 2), bukan error.
 */
export function matchCategoryRadiusRange(input: string): CategoryRadiusRange | null {
  const lower = input.trim().toLowerCase();
  if (!lower) return null;

  if (CATEGORY_RADIUS_RANGES[lower]) return CATEGORY_RADIUS_RANGES[lower];

  for (const [keyword, key] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    if (lower.includes(keyword)) return CATEGORY_RADIUS_RANGES[key];
  }

  return null;
}
