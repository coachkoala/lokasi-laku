import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress, reverseGeocode } from "@/lib/geocoding";

/**
 * GET /api/geocode?address=...      -> forward geocoding (alamat -> lat/lng)
 * GET /api/geocode?lat=...&lng=...  -> reverse geocoding (lat/lng -> alamat)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    if (lat && lng) {
      const formattedAddress = await reverseGeocode(parseFloat(lat), parseFloat(lng));
      if (!formattedAddress) {
        return NextResponse.json(
          { success: false, error: "Lokasi tidak ditemukan" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { lat: parseFloat(lat), lng: parseFloat(lng), formattedAddress },
      });
    }

    if (address) {
      const result = await geocodeAddress(address);
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Alamat tidak ditemukan. Coba kata kunci lain." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json(
      { success: false, error: "Parameter address atau lat/lng dibutuhkan" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
