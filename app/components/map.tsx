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

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
};

export default function Map({
  onPosChange,
}: {
  onPosChange: (pos: [number, number]) => void;
}) {
  const defaultPos: [number, number] = [14.5547, 121.0244];
  const [pos, setPos] = useState<[number, number]>(defaultPos);
  const [centered, setCentered] = useState(false);
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
        setCentered(true);
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
      {centered && <RecenterMap lat={pos[0]} lng={pos[1]} />}
      <ClickHandler onMapClick={handleMapClick} />

      {/* Current pin being placed */}
      <Marker position={pos} icon={icon}>
        <Popup>Tap Submit to report this spot</Popup>
      </Marker>

      {/* All submitted spots */}
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={icon}>
          <Popup>
            <img src={spot.photo_url} style={{ width: 150, borderRadius: 8 }} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
