"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SearchIcon from "@/components/icons/SearchIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import SpinnerIcon from "@/components/icons/SpinnerIcon";
import { ValidationResult, matchCategoryRadiusRange } from "@/types";

interface LocationState {
  address: string;
  lat: number;
  lng: number;
}

interface Suggestion {
  placeId: string;
  text: string;
}

interface SidebarProps {
  location: LocationState | null;
  radius: number;
  onLocationChange: (address: string, lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  loading: boolean;
  elapsedMs: number;
  error: string | null;
  result: ValidationResult | null;
  selectedCompetitorId: string | null;
  onSelectCompetitor: (id: string | null) => void;
}

function getLoadingMessage(elapsedMs: number): string {
  if (elapsedMs < 1500) return "Memvalidasi lokasi...";
  if (elapsedMs < 5000) return "Mengambil data kompetitor di sekitar radius...";
  if (elapsedMs < 10000) return "AI menganalisa kelayakan usaha...";
  return "Menyusun verdict akhir...";
}

export default function Sidebar({
  location,
  radius,
  onLocationChange,
  onRadiusChange,
  category,
  onCategoryChange,
  loading,
  elapsedMs,
  error,
  result,
  selectedCompetitorId,
  onSelectCompetitor,
}: SidebarProps) {
  const [addressInput, setAddressInput] = useState(location?.address || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextFetch = useRef(false);

  const [categoryInput, setCategoryInput] = useState(category);
  const categoryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location?.address) setAddressInput(location.address);
  }, [location?.address]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/autocomplete?input=${encodeURIComponent(query)}`);
      const result = await res.json();
      if (result.success) {
        setSuggestions(result.data.suggestions);
        setShowSuggestions(true);
      }
    } catch {
      // Autocomplete gagal tidak fatal — user masih bisa tekan Enter untuk cari manual
    }
  }, []);

  const handleInputChange = (value: string) => {
    setAddressInput(value);
    setSearchError(null);

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 400);
  };

  const handleSelectSuggestion = async (suggestion: Suggestion) => {
    skipNextFetch.current = true;
    setAddressInput(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/autocomplete?placeId=${encodeURIComponent(suggestion.placeId)}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      onLocationChange(result.data.formattedAddress || suggestion.text, result.data.lat, result.data.lng);
    } catch {
      setSearchError("Gagal mengambil detail lokasi. Coba lagi.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    setShowSuggestions(false);
    if (!addressInput.trim()) return;

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(addressInput)}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      onLocationChange(result.data.formattedAddress, result.data.lat, result.data.lng);
    } catch {
      setSearchError("Alamat tidak ditemukan. Coba kata kunci lain.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError("Browser tidak mendukung deteksi lokasi.");
      return;
    }

    setGeoLoading(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}`);
          const result = await res.json();
          const address = result.success ? result.data.formattedAddress : "Lokasi saat ini";
          skipNextFetch.current = true;
          setAddressInput(address);
          onLocationChange(address, latitude, longitude);
        } catch {
          skipNextFetch.current = true;
          setAddressInput("Lokasi saat ini");
          onLocationChange("Lokasi saat ini", latitude, longitude);
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setSearchError("Tidak bisa akses lokasi. Cek izin lokasi di browser.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCategoryInputChange = (value: string) => {
    setCategoryInput(value);
    if (categoryDebounceRef.current) clearTimeout(categoryDebounceRef.current);
    categoryDebounceRef.current = setTimeout(() => onCategoryChange(value.trim()), 500);
  };

  const handleResetRadius = () => {
    onRadiusChange(800);
  };

  const radiusGuidance = matchCategoryRadiusRange(categoryInput);
  const radiusTooFar = radiusGuidance ? radius > radiusGuidance.max : false;
  const radiusTooClose = radiusGuidance ? radius < radiusGuidance.min : false;
  const suggestedRadius = radiusTooFar ? radiusGuidance?.max : radiusTooClose ? radiusGuidance?.min : null;

  return (
    <div className="sidebar-container">
      <div className="sb-top">
        <div className="logo">
          <span className="dot"></span>LokasiLaku
        </div>

        <div className="search-box-wrapper">
          <div className="search-box">
            <SearchIcon />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleSearchSubmit}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Masukkan alamat, mis: Jl. Sukajadi Bandung"
            />
            <button
              type="button"
              className="geo-btn"
              onClick={handleUseMyLocation}
              disabled={geoLoading}
              title="Gunakan lokasi saya"
              aria-label="Gunakan lokasi saya"
            >
              {geoLoading ? <SpinnerIcon /> : <LocationIcon />}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestion-dropdown">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  className="suggestion-item"
                  onMouseDown={() => handleSelectSuggestion(s)}
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {searchLoading && <div className="search-status">Mencari lokasi...</div>}
        {searchError && <div className="error-message">{searchError}</div>}

        <div className="category-picker">
          <label htmlFor="categoryInput">Kategori usaha yang ingin divalidasi</label>
          <input
            id="categoryInput"
            type="text"
            className="category-input"
            value={categoryInput}
            onChange={(e) => handleCategoryInputChange(e.target.value)}
            placeholder="Ketik apa saja, mis: kafe, laundry kiloan, warung mie ayam"
          />
        </div>

        <div className="radius-row">
          <span>Radius analisa</span>
          <span className="val">{radius} m</span>
        </div>
        <input
          type="range"
          min="200"
          max="3000"
          value={radius}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          id="radiusSlider"
        />
        <div className="radius-hint">
          Disarankan otomatis dari kepadatan area.{" "}
          <button onClick={handleResetRadius}>Pakai radius otomatis</button>
        </div>
      </div>

      <div className="sb-divider"></div>

      <div className="sb-results">
        {error && <div className="error-message">{error}</div>}

        {radiusGuidance && (radiusTooFar || radiusTooClose) && (
          <div className="radius-warning">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
            <span>
              Radius {radius}m {radiusTooFar ? "cukup jauh" : "mungkin terlalu sempit"} untuk kategori ini —
              biasanya orang {radiusTooFar ? `jalan maksimal ~${radiusGuidance.max}m` : `perlu minimal ~${radiusGuidance.min}m biar data representatif`}.
              <button onClick={() => onRadiusChange(suggestedRadius!)}>Sesuaikan ke {suggestedRadius}m</button>
            </span>
          </div>
        )}

        {loading && (
          <div className="loading-spinner">
            <div className="loading-bar">
              <div className="loading-bar-fill"></div>
            </div>
            <p className="loading-message">{getLoadingMessage(elapsedMs)}</p>
            <p className="loading-timer">{(elapsedMs / 1000).toFixed(1)}s</p>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="empty-state">
            <h3>{!location ? "Pilih lokasi untuk memulai" : "Masukkan kategori usaha"}</h3>
            <p>
              {!location
                ? "Masukkan alamat, klik langsung di peta, atau pakai tombol lokasi saya"
                : "Ketik kategori usaha yang ingin divalidasi, misal: kafe atau laundry kiloan"}
            </p>
          </div>
        )}

        {!loading && result && (
          <>
            <div className={`verdict-card ${result.verdict}`}>
              <div className="verdict-label">Verdict untuk kategori ini</div>
              <div className={`verdict-title ${result.verdict}`}>{result.title}</div>
              <div className="verdict-body">{result.description}</div>
            </div>

            <div className="stat-grid">
              <div className="stat-box">
                <div className="n">{result.competitorCount}</div>
                <div className="l">Kompetitor langsung</div>
              </div>
              <div className="stat-box">
                <div className="n">{result.avgRating ?? "—"}</div>
                <div className="l">Rating rata-rata</div>
              </div>
              <div className="stat-box">
                <div className="n">{result.nearestDistance !== null ? `${result.nearestDistance}m` : "—"}</div>
                <div className="l">Jarak terdekat</div>
              </div>
              <div className="stat-box">
                <div className="n">{radius}m</div>
                <div className="l">Radius analisa</div>
              </div>
            </div>

            <div className="results-label">Kompetitor terdekat</div>
            <div className="competitor-list">
              {result.competitors.length > 0 ? (
                result.competitors.map((c) => (
                  <div
                    key={c.id}
                    className={`competitor-row ${selectedCompetitorId === c.id ? "selected" : ""}`}
                    onClick={() => onSelectCompetitor(c.id)}
                  >
                    <span className="name">{c.name}</span>
                    <span className="dist">{c.distance}m</span>
                    <span className="rating">{c.rating ? `★${c.rating.toFixed(1)}` : "—"}</span>
                  </div>
                ))
              ) : (
                <div className="competitor-row">
                  <span className="name" style={{ color: "var(--muted-dim)" }}>
                    Belum ada data kompetitor untuk kategori ini
                  </span>
                </div>
              )}
            </div>

            <button className="btn-primary">Unduh laporan lengkap</button>
          </>
        )}
      </div>
    </div>
  );
}
