"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppContext";
import { STORES } from "@/lib/stores";
import { StoreMode } from "@/lib/types";

const MapInner = dynamic(() => import("./MapInner"), { ssr: false });

interface Props {
  onClose: () => void;
}

const STORE_MODE_OPTIONS: {
  value: StoreMode;
  label: string;
  description: string;
}[] = [
  {
    value: "alle",
    label: "Alle butikker",
    description: "Brug alle butikker inden for dit område",
  },
  {
    value: "udvalgte",
    label: "Udvalgte",
    description: "Vælg selv hvilke butikker der må bruges",
  },
  {
    value: "en",
    label: "Enkelt butik",
    description: "Appen vælger automatisk den billigste butik",
  },
];

export default function MapModal({ onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-[430px] bg-white rounded-t-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">Butikker / område</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content — min-h-0 is required for flex scroll to work */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Map */}
          <div className="h-52 w-full bg-gray-100">
            <MapInner stores={STORES} />
          </div>

          {/* Radius */}
          <RadiusSlider />

          {/* Vælg butikker */}
          <StoreModeSelector />

          {/* Store list (only if udvalgte) */}
          <StoreList />

          {/* Bottom padding */}
          <div className="h-4" />
        </div>

        {/* Confirm button */}
        <div className="px-4 py-3 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-green-600 text-white rounded-2xl font-semibold text-base"
          >
            Gem valg
          </button>
        </div>
      </div>
    </div>
  );
}

function RadiusSlider() {
  const { state, setAreaRadiusKm } = useApp();

  return (
    <div className="px-4 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">Radius</span>
        <span className="text-sm font-bold text-green-600">{state.areaRadiusKm} km</span>
      </div>
      <input
        type="range"
        min={1}
        max={15}
        step={1}
        value={state.areaRadiusKm}
        onChange={(e) => setAreaRadiusKm(Number(e.target.value))}
        className="w-full accent-green-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>1 km</span>
        <span>15 km</span>
      </div>
    </div>
  );
}

function StoreModeSelector() {
  const { state, setStoreMode } = useApp();

  return (
    <div className="px-4 py-4 border-b border-gray-100">
      <p className="text-sm font-semibold text-gray-800 mb-3">Vælg butikker</p>
      <div className="flex flex-col gap-2">
        {STORE_MODE_OPTIONS.map(({ value, label, description }) => {
          const isSelected = state.storeMode === value;
          return (
            <button
              key={value}
              onClick={() => setStoreMode(value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-colors ${
                isSelected
                  ? "bg-green-50 border-green-300"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              {/* Radio indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "border-green-600" : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${isSelected ? "text-green-700" : "text-gray-800"}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StoreList() {
  const { state, setSelectedStoreIds } = useApp();

  if (state.storeMode !== "udvalgte") return null;

  function toggleStore(id: string) {
    const next = state.selectedStoreIds.includes(id)
      ? state.selectedStoreIds.filter((s) => s !== id)
      : [...state.selectedStoreIds, id];
    setSelectedStoreIds(next);
  }

  // OPEN PUNKT: filter stores by actual haversine distance from areaCenter
  const inRange = STORES;

  return (
    <div className="px-4 py-4">
      <p className="text-sm font-semibold text-gray-800 mb-1">Butikker i dit område</p>
      <p className="text-xs text-gray-400 mb-3">Klik en butik til/fra</p>
      <div className="flex flex-col gap-1.5">
        {inRange.map((store) => {
          const isSelected = state.selectedStoreIds.includes(store.id);
          return (
            <button
              key={store.id}
              onClick={() => toggleStore(store.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors border ${
                isSelected
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-100"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  store.chain === "Netto"
                    ? "bg-blue-500"
                    : store.chain === "Føtex"
                    ? "bg-red-500"
                    : "bg-orange-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{store.name}</p>
                <p className="text-xs text-gray-400 truncate">{store.address}</p>
              </div>
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
