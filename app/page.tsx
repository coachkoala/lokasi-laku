"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import MapArea from "@/components/MapArea";
import { ValidationResult } from "@/types";
import "@/styles/app.css";

interface LocationState {
  address: string;
  lat: number;
  lng: number;
}

export default function Home() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [radius, setRadius] = useState(800);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const requestIdRef = useRef(0);

  const runAnalysis = useCallback(async (loc: LocationState, r: number, cat: string) => {
    const myRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setSelectedCompetitorId(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: loc.lat, lng: loc.lng, radius: r, category: cat }),
      });

      const responseJson = await response.json();

      if (myRequestId !== requestIdRef.current) return; // ada request lebih baru, hasil ini dibuang

      if (!responseJson.success) {
        throw new Error(responseJson.error || "Analisis gagal, coba lagi.");
      }

      setResult(responseJson.data);
      setLoading(false);
    } catch (err) {
      if (myRequestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat analisis");
      setResult(null);
      setLoading(false);
    }
  }, []);

  // Auto-analyze setiap kali lokasi/radius/kategori berubah (debounced),
  // hanya jalan kalau lokasi & kategori sama-sama sudah terisi.
  useEffect(() => {
    if (!location || !category.trim()) return;
    const timeout = setTimeout(() => {
      runAnalysis(location, radius, category);
    }, 350);
    return () => clearTimeout(timeout);
  }, [location, radius, category, runAnalysis]);

  // Timer durasi live selama loading berjalan
  useEffect(() => {
    if (!loading) {
      setElapsedMs(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - start), 200);
    return () => clearInterval(interval);
  }, [loading]);

  // User klik langsung di peta: pindahkan pin ke titik itu (analisa otomatis
  // jalan lewat effect di atas begitu lat/lng berubah), lalu isi alamat
  // asli begitu reverse geocoding selesai.
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setLocation({ address: "Memuat alamat...", lat, lng });

    fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setLocation({ address: result.data.formattedAddress, lat, lng });
        } else {
          setLocation({ address: "Titik terpilih", lat, lng });
        }
      })
      .catch(() => {
        setLocation({ address: "Titik terpilih", lat, lng });
      });
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        location={location}
        radius={radius}
        onLocationChange={(address, lat, lng) => setLocation({ address, lat, lng })}
        onRadiusChange={setRadius}
        category={category}
        onCategoryChange={setCategory}
        loading={loading}
        elapsedMs={elapsedMs}
        error={error}
        result={result}
        selectedCompetitorId={selectedCompetitorId}
        onSelectCompetitor={setSelectedCompetitorId}
      />
      <MapArea
        location={location}
        radius={radius}
        result={result}
        selectedCompetitorId={selectedCompetitorId}
        onCompetitorMarkerClick={setSelectedCompetitorId}
        onMapClick={handleMapClick}
      />
    </div>
  );
}
