import { useState } from "react";
import SearchIcon from "@/components/icons/SearchIcon";
import RecommendationCard from "@/components/RecommendationCard";

interface SidebarProps {
  mode: "discover" | "validate";
  onModeChange: (mode: "discover" | "validate") => void;
  location: { address: string; lat: number; lng: number } | null;
  radius: number;
  onLocationChange: (address: string, lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  loading: boolean;
  error: string | null;
  recommendations: any[];
  onAnalyze: () => void;
}

export default function Sidebar({
  mode,
  onModeChange,
  location,
  radius,
  onLocationChange,
  onRadiusChange,
  loading,
  error,
  recommendations,
  onAnalyze,
}: SidebarProps) {
  const [addressInput, setAddressInput] = useState(
    location?.address || "Jl. Sukajadi No. 12, Bandung"
  );
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // TODO: Geocode address to coordinates
      onLocationChange(addressInput, -6.9271, 107.6411); // Placeholder coords for Bandung
    }
  };

  const handleResetRadius = () => {
    onRadiusChange(800);
  };

  return (
    <div className="sidebar-container">
      <div className="sb-top">
        {/* Logo */}
        <div className="logo">
          <span className="dot"></span>LokasiLaku
        </div>

        {/* Search Box */}
        <div className="search-box">
          <SearchIcon />
          <input
            type="text"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyPress={handleSearchSubmit}
            placeholder="Masukkan alamat atau pin lokasi"
          />
        </div>

        {/* Radius Control */}
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

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`${mode === "discover" ? "active" : ""}`}
            onClick={() => onModeChange("discover")}
          >
            Temukan Peluang
          </button>
          <button
            className={`${mode === "validate" ? "active" : ""}`}
            onClick={() => onModeChange("validate")}
          >
            Validasi Ide
          </button>
        </div>
      </div>

      <div className="sb-divider"></div>

      {/* Results Section */}
      <div className="sb-results">
        {error && <div className="error-message">{error}</div>}

        {mode === "discover" && (
          <>
            <div className="results-label">
              Rekomendasi teratas · {recommendations.length} ditemukan
            </div>

            {loading && (
              <div className="loading-spinner">
                <p>Menganalisa lokasi...</p>
              </div>
            )}

            {!loading && recommendations.length === 0 && !location && (
              <div className="empty-state">
                <h3>Pilih lokasi untuk memulai</h3>
                <p>Masukkan alamat atau pin di peta untuk analisa potensi bisnis</p>
              </div>
            )}

            {!loading &&
              recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  selected={selectedCard === rec.id}
                  onSelect={() => setSelectedCard(rec.id)}
                />
              ))}

            {!loading && recommendations.length > 0 && (
              <button className="btn-primary">Unduh laporan lengkap</button>
            )}
          </>
        )}

        {mode === "validate" && (
          <div className="empty-state">
            <h3>Mode Validasi Ide</h3>
            <p>Fitur ini akan tersedia di iterasi berikutnya</p>
          </div>
        )}
      </div>
    </div>
  );
}
