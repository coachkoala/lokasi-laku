import { NextRequest, NextResponse } from "next/server";
import { searchPlacesByText, calculateDistance } from "@/lib/places-service";
import { generateValidationVerdict } from "@/lib/claude-service";
import { generateCacheKey, get as cacheGet, set as cacheSet } from "@/lib/cache";
import { matchCategoryRadiusRange, ValidationResult } from "@/types";

/**
 * POST /api/analyze
 * Validasi kelayakan 1 kategori usaha (bebas ketik) di 1 lokasi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, radius, category } = body;

    if (typeof lat !== "number" || typeof lng !== "number" || !radius || !category?.trim()) {
      return NextResponse.json(
        { success: false, error: "Parameter tidak lengkap" },
        { status: 400 }
      );
    }

    const trimmedCategory: string = category.trim();
    const cacheKey = generateCacheKey(lat, lng, radius, trimmedCategory.toLowerCase());
    const cached = cacheGet<ValidationResult>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    const rawPlaces = await searchPlacesByText(trimmedCategory, lat, lng, radius);

    // Text Search cuma soft-bias ke lokasi (bukan hard filter seperti Nearby
    // Search), jadi hasil di luar radius difilter manual di sini.
    const competitors = rawPlaces
      .map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        rating: p.rating > 0 ? p.rating : null,
        distance: calculateDistance(lat, lng, p.lat, p.lng),
      }))
      .filter((c) => c.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    const ratedCompetitors = competitors.filter((c) => c.rating !== null);
    const avgRating =
      ratedCompetitors.length > 0
        ? Math.round(
            (ratedCompetitors.reduce((sum, c) => sum + (c.rating || 0), 0) / ratedCompetitors.length) * 10
          ) / 10
        : null;

    const radiusGuidance = matchCategoryRadiusRange(trimmedCategory);

    const verdict = await generateValidationVerdict(trimmedCategory, competitors, radius, radiusGuidance);

    const responseData: ValidationResult = {
      category: trimmedCategory,
      verdict: verdict.verdict,
      title: verdict.title,
      description: verdict.description,
      competitorCount: competitors.length,
      avgRating,
      nearestDistance: competitors[0]?.distance ?? null,
      competitors: competitors.slice(0, 20),
      radiusGuidance,
    };

    cacheSet(cacheKey, responseData);

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan internal",
      },
      { status: 500 }
    );
  }
}
