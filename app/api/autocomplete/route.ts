import { NextRequest, NextResponse } from "next/server";
import { autocompleteSuggestions, getPlaceDetails } from "@/lib/geocoding";

/**
 * GET /api/autocomplete?input=...    -> daftar saran alamat (debounced dari client)
 * GET /api/autocomplete?placeId=...  -> detail lat/lng dari saran yang dipilih
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");
  const placeId = searchParams.get("placeId");

  try {
    if (placeId) {
      const details = await getPlaceDetails(placeId);
      if (!details) {
        return NextResponse.json(
          { success: false, error: "Detail lokasi tidak ditemukan" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: details });
    }

    if (!input) {
      return NextResponse.json(
        { success: false, error: "Parameter input dibutuhkan" },
        { status: 400 }
      );
    }

    const suggestions = await autocompleteSuggestions(input);
    return NextResponse.json({ success: true, data: { suggestions } });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
