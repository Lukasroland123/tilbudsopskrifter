"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Preference } from "@/lib/types";
import MapModal from "@/components/MapModal";

const PREFERENCE_OPTIONS: { value: Preference; label: string }[] = [
  { value: "okologisk", label: "Økologisk" },
  { value: "vegetarisk", label: "Vegetarisk" },
  { value: "kød", label: "Kød" },
  { value: "dansk", label: "Dansk" },
];

const STORE_MODE_SHORT: Record<string, string> = {
  alle: "Alle",
  udvalgte: "Udvalgte",
  en: "Enkelt",
};

type OpenBox = "preferences" | "persons" | null;

export default function TopBar() {
  const { state, setPreference, setPersons, setSearchQuery, setSearchType } = useApp();
  const [openBox, setOpenBox] = useState<OpenBox>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenBox(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleBox(box: OpenBox) {
    setOpenBox((prev) => (prev === box ? null : box));
  }

  const activePrefLabels = state.preferences
    .filter((p) => p !== "billigst")
    .map((p) => PREFERENCE_OPTIONS.find((o) => o.value === p)?.label)
    .filter(Boolean)
    .join(", ");

  const prefSummary = activePrefLabels || "Ingen valgt";
  const personsSummary = `${state.persons} ${state.persons === 1 ? "person" : "personer"}`;
  const storeSummary = `${STORE_MODE_SHORT[state.storeMode]}, ${state.areaRadiusKm} km`;

  const prefActive = state.preferences.filter((p) => p !== "billigst").length > 0;
  const personsActive = state.persons !== 1;
  const storeActive = state.storeMode !== "alle" || state.areaRadiusKm !== 3;

  return (
    <>
      <div ref={containerRef} className="bg-white border-b border-gray-100 px-4 pt-3 sticky top-0 z-40">
        {/* Search row */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <input
              type="text"
              value={state.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={state.searchType === "retter" ? "Søg efter retter..." : "Søg efter varer..."}
              className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex bg-gray-100 rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setSearchType("retter")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                state.searchType === "retter" ? "bg-green-600 text-white" : "text-gray-500"
              }`}
            >
              Retter
            </button>
            <button
              onClick={() => setSearchType("varer")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                state.searchType === "varer" ? "bg-green-600 text-white" : "text-gray-500"
              }`}
            >
              Varer
            </button>
          </div>
        </div>

        {/* 3 filter boxes */}
        <div className="grid grid-cols-3 gap-2">
          <FilterBox
            label="Præferencer"
            summary={prefSummary}
            isOpen={openBox === "preferences"}
            isActive={prefActive}
            onClick={() => toggleBox("preferences")}
          />
          <FilterBox
            label="Antal personer"
            summary={personsSummary}
            isOpen={openBox === "persons"}
            isActive={personsActive}
            onClick={() => toggleBox("persons")}
          />
          <FilterBox
            label="Butikker / område"
            summary={storeSummary}
            isOpen={false}
            isActive={storeActive}
            onClick={() => {
              setOpenBox(null);
              setMapOpen(true);
            }}
          />
        </div>

        {/* Expanded: Præferencer */}
        {openBox === "preferences" && (
          <div className="pt-2 pb-3 flex flex-col gap-2">
            {PREFERENCE_OPTIONS.map(({ value, label }) => {
              const isOn = state.preferences.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => setPreference(value, !isOn)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors border ${
                    isOn
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-700 border-gray-100"
                  }`}
                >
                  <span>{label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isOn ? "bg-green-600 border-green-600" : "border-gray-300"
                    }`}
                  >
                    {isOn && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Expanded: Antal personer */}
        {openBox === "persons" && (
          <div className="pt-2 pb-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    setPersons(n);
                    setOpenBox(null);
                  }}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    state.persons === n ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className={openBox === null ? "h-3" : ""} />
      </div>

      {mapOpen && <MapModal onClose={() => setMapOpen(false)} />}
    </>
  );
}

function FilterBox({
  label,
  summary,
  isOpen,
  isActive,
  onClick,
}: {
  label: string;
  summary: string;
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start px-3 py-2 rounded-xl text-left transition-colors border ${
        isOpen || isActive
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between w-full gap-1">
        <span
          className={`text-xs font-semibold leading-tight ${
            isOpen || isActive ? "text-green-700" : "text-gray-500"
          }`}
        >
          {label}
        </span>
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isOpen || isActive ? "#16a34a" : "#9ca3af"}
          strokeWidth="2.5"
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <span
        className={`text-xs truncate w-full mt-0.5 ${
          isOpen || isActive ? "text-green-600" : "text-gray-400"
        }`}
      >
        {summary}
      </span>
    </button>
  );
}
