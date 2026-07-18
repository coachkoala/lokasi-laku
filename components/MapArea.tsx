"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { ValidationResult } from "@/types";
import "@/styles/map.css";

const BANDUNG_CENTER = { lat: -6.9147, lng: 107.6098 };

interface MapAreaProps {
  location: { address: string; lat: number; lng: number } | null;
  radius: number;
  result: ValidationResult | null;
  selectedCompetitorId: string | null;
  onCompetitorMarkerClick: (id: string) => void;
  onMapClick: (lat: number, lng: number) => void;
}

// Tema peta gelap yang senada dengan palet "night market" (market-green + ochre)
const NIGHT_MARKET_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#15251e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1712" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a7b0a9" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#233830" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1c3329" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2b4239" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a2b23" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1c3329" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1712" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2b4239" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

let optionsSet = false;
let loaderPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (!optionsSet) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "", v: "weekly" });
    optionsSet = true;
  }
  if (!loaderPromise) {
    // "maps" -> Map, Circle, SymbolPath, Point. "marker" -> Marker (legacy pin).
    loaderPromise = Promise.all([importLibrary("maps"), importLibrary("marker")]).then(() => undefined);
  }
  return loaderPromise;
}

export default function MapArea({
  location,
  radius,
  result,
  selectedCompetitorId,
  onCompetitorMarkerClick,
  onMapClick,
}: MapAreaProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const poiMarkersRef = useRef<google.maps.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Ref supaya click listener (dipasang sekali di effect init) selalu panggil
  // versi terbaru dari onMapClick, bukan closure lama dari render pertama.
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Init map sekali di awal, center default Bandung
  useEffect(() => {
    let cancelled = false;

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setMapError("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY belum di-set di environment variables.");
      return;
    }

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;

        mapRef.current = new google.maps.Map(mapDivRef.current, {
          center: BANDUNG_CENTER,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          styles: NIGHT_MARKET_MAP_STYLE,
          draggableCursor: "crosshair",
        });

        mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          onMapClickRef.current(e.latLng.lat(), e.latLng.lng());
        });

        setMapReady(true);

        // Google Maps membaca ukuran container sekali saat init. Kalau container
        // masih di tengah reflow CSS grid saat itu, proyeksi internal Maps jadi
        // salah sampai dipicu ulang manual — cukup sekali, jangan pakai observer
        // hidup karena fitBounds di dalamnya bisa memicu resize lagi (loop).
        setTimeout(() => {
          if (cancelled || !mapRef.current) return;
          google.maps.event.trigger(mapRef.current, "resize");
          mapRef.current.setCenter(BANDUNG_CENTER);
        }, 200);
      })
      .catch((err) => {
        console.error("Google Maps gagal dimuat:", err);
        setMapError("Peta gagal dimuat. Cek API key & pastikan 'Maps JavaScript API' aktif.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Update marker pusat + lingkaran radius saat lokasi/radius berubah
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (!location) {
      centerMarkerRef.current?.setMap(null);
      radiusCircleRef.current?.setMap(null);
      return;
    }

    const position = { lat: location.lat, lng: location.lng };

    if (!centerMarkerRef.current) {
      centerMarkerRef.current = new google.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          path: "M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z",
          fillColor: "#E8AD4D",
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 1,
          anchor: new google.maps.Point(15, 38),
        },
        zIndex: 999,
      });
    } else {
      centerMarkerRef.current.setPosition(position);
      centerMarkerRef.current.setMap(mapRef.current);
    }

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = new google.maps.Circle({
        map: mapRef.current,
        center: position,
        radius,
        strokeColor: "#e8ad4d",
        strokeOpacity: 0.45,
        strokeWeight: 1,
        fillColor: "#e8ad4d",
        fillOpacity: 0.08,
      });
    } else {
      radiusCircleRef.current.setCenter(position);
      radiusCircleRef.current.setRadius(radius);
      radiusCircleRef.current.setMap(mapRef.current);
    }

    const bounds = radiusCircleRef.current.getBounds();
    if (bounds) {
      mapRef.current.fitBounds(bounds);
    } else {
      mapRef.current.panTo(position);
    }
  }, [mapReady, location, radius]);

  // Update marker kompetitor tiap kali hasil validasi berubah
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    poiMarkersRef.current.forEach((m) => m.setMap(null));
    poiMarkersRef.current = [];

    (result?.competitors || []).forEach((comp) => {
      const isSelected = selectedCompetitorId === comp.id;

      const marker = new google.maps.Marker({
        position: { lat: comp.lat, lng: comp.lng },
        map: mapRef.current!,
        title: comp.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 8 : 5,
          fillColor: "#5a9385",
          fillOpacity: 1,
          strokeColor: "#0d1712",
          strokeWeight: 2,
        },
        zIndex: isSelected ? 500 : 100,
      });

      marker.addListener("click", () => onCompetitorMarkerClick(comp.id));
      poiMarkersRef.current.push(marker);
    });
  }, [mapReady, result, selectedCompetitorId, onCompetitorMarkerClick]);

  return (
    <div className="map-area">
      {mapError && (
        <div className="map-error-overlay">
          <p>{mapError}</p>
        </div>
      )}

      <div ref={mapDivRef} className="google-map-canvas" />

      <div className="map-topbar">
        {location && (
          <div className="location-chip">
            <span className="pulse"></span>
            {location.address} · radius <span>{radius}m</span>
          </div>
        )}
        {result && (
          <div className="legend">
            <div>
              <span className="sw" style={{ background: "var(--teal)" }}></span>
              Kompetitor ({result.competitorCount})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
