"use client";

import { useEffect, useRef } from "react";
import "@/styles/map.css";

interface MapAreaProps {
  location: { address: string; lat: number; lng: number } | null;
  radius: number;
  recommendations: any[];
}

export default function MapArea({ location, radius, recommendations }: MapAreaProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TODO: Initialize Google Maps with location and POI markers
    // This is a placeholder for now
  }, [location, radius]);

  const radiusCircleSize = Math.max(140, Math.min(600, radius / 6));

  return (
    <div className="map-area">
      <div className="map-grid"></div>

      {/* Radius Circle */}
      <div
        className="radius-circle"
        id="radiusCircle"
        style={{
          width: `${radiusCircleSize}px`,
          height: `${radiusCircleSize}px`,
          margin: `${-radiusCircleSize / 2}px 0 0 ${-radiusCircleSize / 2}px`,
        }}
      ></div>

      {/* Center Pin */}
      <div className="map-pin">
        <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
          <path
            d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z"
            fill="#E8AD4D"
          />
          <circle cx="15" cy="15" r="5.5" fill="#101A16" />
        </svg>
      </div>

      {/* POI Markers - Placeholder */}
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className={`poi-marker ${rec.scoreType === "hot" ? "gap" : "dense"}`}
          style={{
            top: `${rec.mapPin.y}%`,
            left: `${rec.mapPin.x}%`,
          }}
          data-card={rec.id}
          data-category={rec.category.toLowerCase()}
        ></div>
      ))}

      {/* Map Top Bar */}
      <div className="map-topbar">
        {location && (
          <div className="location-chip">
            <span className="pulse"></span>
            {location.address} · radius <span id="chipRadius">{radius}m</span>
          </div>
        )}
        <div className="legend" id="mapLegend">
          <div>
            <span className="sw" style={{ background: "var(--coral)" }}></span>
            Gap / peluang
          </div>
          <div>
            <span className="sw" style={{ background: "var(--teal)" }}></span>
            Kompetitor padat
          </div>
          <div>
            <span className="sw" style={{ background: "rgba(242,243,236,0.55)" }}></span>
            POI lainnya
          </div>
        </div>
      </div>

      {/* Floating Callout - Placeholder */}
      {recommendations.length > 0 && (
        <div className="floating-callout" style={{ top: "74%", left: "38%" }}>
          <span className="tag">Gap tertinggi</span>
          <div>
            {recommendations[0].category} — {recommendations[0].description.slice(0, 50)}...
          </div>
        </div>
      )}

      <div ref={mapRef} style={{ position: "absolute", inset: 0, display: "none" }} id="map" />
    </div>
  );
}
