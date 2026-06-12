"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../../lib/supabase";

function createIcon(color: string) {
  return L.divIcon({
    html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.5 14 26 14 26s14-16.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const icons: Record<string, L.DivIcon> = {
  shop: createIcon("#3B82F6"),
  food: createIcon("#F59E0B"),
  event: createIcon("#8B5CF6"),
  alert: createIcon("#EF4444"),
};

const defaultIcon = createIcon("#6B7280");

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

type Spot = {
  id: string;
  lat: number;
  lng: number;
  photo_url: string;
  type: string;
  description: string | null;
};

export default function Map({
  onPosChange,
  type,
}: {
  onPosChange: (pos: [number, number]) => void;
  type: string;
}) {
  const defaultPos: [number, number] = [14.5547, 121.0244];
  const [pos, setPos] = useState<[number, number]>(defaultPos);
  const [gpsPos, setGpsPos] = useState<[number, number] | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);

  // Load existing spots on mount
  useEffect(() => {
    async function loadSpots() {
      const { data } = await supabase.from("spots").select("*");
      if (data) setSpots(data);
    }
    loadSpots();
  }, []);

  // Subscribe to new spots in real time
  useEffect(() => {
    const channel = supabase
      .channel("spots-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "spots" },
        (payload) => {
          setSpots((prev) => [...prev, payload.new as Spot]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // GPS centering
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        const newPos: [number, number] = [
          p.coords.latitude,
          p.coords.longitude,
        ];
        setPos(newPos);
        onPosChange(newPos);
        setGpsPos(newPos);
      });
    }
  }, []);

  function handleMapClick(newPos: [number, number]) {
    setPos(newPos);
    onPosChange(newPos);
  }

  return (
    <MapContainer
      center={defaultPos}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {gpsPos && <RecenterMap lat={gpsPos[0]} lng={gpsPos[1]} />}
      <ClickHandler onMapClick={handleMapClick} />

      {/* Current pin being placed */}
      <Marker position={pos} icon={icons[type] || defaultIcon}>
        <Popup>Tap Submit to report this spot</Popup>
      </Marker>

      {/* All submitted spots */}
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={icons[spot.type] || defaultIcon}
        >
          <Popup>
            <img src={spot.photo_url} style={{ width: 150, borderRadius: 8 }} />
            {spot.description && (
              <p style={{ marginTop: 6, fontSize: 13, color: "#374151" }}>
                {spot.description}
              </p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
