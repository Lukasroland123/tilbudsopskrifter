"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useApp } from "@/context/AppContext";
import { StoreLocation } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon path issue in Next.js
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function createStoreIcon(chain: string) {
  const color =
    chain === "Netto" ? "#3b82f6" : chain === "Føtex" ? "#ef4444" : "#f97316";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

interface Props {
  stores: StoreLocation[];
}

export default function MapInner({ stores }: Props) {
  const { state, setAreaCenter } = useApp();

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const center: [number, number] = [state.areaCenter.lat, state.areaCenter.lng];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      {/* Area circle */}
      <Circle
        center={center}
        radius={state.areaRadiusKm * 1000}
        pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.1, weight: 2 }}
      />
      {/* Store markers */}
      {stores.map((store) => (
        <Marker
          key={store.id}
          position={[store.lat, store.lng]}
          icon={createStoreIcon(store.chain)}
          eventHandlers={{
            click: () => {
              setAreaCenter({ lat: store.lat, lng: store.lng });
            },
          }}
        />
      ))}
      {/* Center click to move */}
      <MapClickHandler onMapClick={(lat, lng) => setAreaCenter({ lat, lng })} />
    </MapContainer>
  );
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    function handler(e: L.LeafletMouseEvent) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onMapClick]);
  return null;
}
