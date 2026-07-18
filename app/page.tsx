"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MapArea from "@/components/MapArea";
import "@/styles/app.css";

interface AnalysisState {
  loading: boolean;
  error: string | null;
  location: {
    address: string;
    lat: number;
    lng: number;
  } | null;
  radius: number;
  recommendations: any[];
}

export default function Home() {
  const [mode, setMode] = useState<"discover" | "validate">("discover");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    loading: false,
    error: null,
    location: null,
    radius: 800,
    recommendations: [],
  });

  const handleLocationChange = (address: string, lat: number, lng: number) => {
    setAnalysisState((prev) => ({
      ...prev,
      location: { address, lat, lng },
    }));
  };

  const handleRadiusChange = (newRadius: number) => {
    setAnalysisState((prev) => ({
      ...prev,
      radius: newRadius,
    }));
  };

  const handleAnalyze = async () => {
    if (!analysisState.location) {
      setAnalysisState((prev) => ({
        ...prev,
        error: "Silakan pilih lokasi terlebih dahulu",
      }));
      return;
    }

    setAnalysisState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // API call akan diintegrasikan di sini
      // const response = await fetch('/api/analyze', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     lat: analysisState.location.lat,
      //     lng: analysisState.location.lng,
      //     radius: analysisState.radius,
      //     mode: mode,
      //   })
      // });
      // const data = await response.json();

      // Placeholder: mock recommendations
      const mockRecommendations = [
        {
          id: "gap1",
          category: "Laundry kiloan",
          score: "Peluang tinggi",
          scoreType: "hot",
          description:
            "12 kos-kosan & kampus dalam radius, cuma 1 laundry terdaftar. Rasio jauh di bawah area sejenis.",
          competitors: 1,
          avgRating: 3.2,
          mapPin: { x: 48, y: 70 },
        },
        {
          id: "poi1",
          category: "Warmindo / nasi kotak",
          score: "Cukup potensial",
          scoreType: "medium",
          description:
            "Area padat kos, jam makan siang & malam belum banyak pilihan murah di bawah 800m.",
          competitors: 4,
          avgRating: 3.6,
          mapPin: { x: 45, y: 35 },
        },
        {
          id: "poi2",
          category: "Fotokopi & alat tulis",
          score: "Cukup potensial",
          scoreType: "medium",
          description:
            "Dekat kampus tapi titik fotokopi terdekat berjarak 1.1km, di luar radius nyaman jalan kaki.",
          competitors: 0,
          avgRating: null,
          mapPin: { x: 30, y: 60 },
        },
      ];

      setAnalysisState((prev) => ({
        ...prev,
        loading: false,
        recommendations: mockRecommendations,
      }));
    } catch (err) {
      setAnalysisState((prev) => ({
        ...prev,
        loading: false,
        error:
          err instanceof Error ? err.message : "Terjadi kesalahan saat analisis",
      }));
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        mode={mode}
        onModeChange={setMode}
        location={analysisState.location}
        radius={analysisState.radius}
        onLocationChange={handleLocationChange}
        onRadiusChange={handleRadiusChange}
        loading={analysisState.loading}
        error={analysisState.error}
        recommendations={analysisState.recommendations}
        onAnalyze={handleAnalyze}
      />
      <MapArea
        location={analysisState.location}
        radius={analysisState.radius}
        recommendations={analysisState.recommendations}
      />
    </div>
  );
}
