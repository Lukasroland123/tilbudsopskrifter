"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AppState, Preference, StoreMode } from "@/lib/types";

const DEFAULT_STATE: AppState = {
  preferences: [],
  persons: 1,
  storeMode: "alle",
  selectedStoreIds: [],
  areaCenter: { lat: 56.1629, lng: 10.2039 }, // Aarhus centrum
  areaRadiusKm: 3,
  searchQuery: "",
  searchType: "retter",
  weekDays: 7,
};

interface AppContextType {
  state: AppState;
  setPreference: (pref: Preference, on: boolean) => void;
  setPersons: (n: number) => void;
  setStoreMode: (mode: StoreMode) => void;
  setSelectedStoreIds: (ids: string[]) => void;
  setAreaCenter: (center: { lat: number; lng: number }) => void;
  setAreaRadiusKm: (km: number) => void;
  setSearchQuery: (q: string) => void;
  setSearchType: (t: "retter" | "varer") => void;
  setWeekDays: (n: number) => void;
  savedDefaults: Partial<AppState>;
  saveDefaults: (defaults: Partial<AppState>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [savedDefaults, setSavedDefaults] = useState<Partial<AppState>>({});

  // Load saved defaults from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("weekli_defaults");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        setSavedDefaults(parsed);
        setState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  function setPreference(pref: Preference, on: boolean) {
    setState((prev) => {
      let next = on
        ? [...prev.preferences.filter((p) => p !== pref), pref]
        : prev.preferences.filter((p) => p !== pref);

      // Empty preferences = no restrictions (always sorts cheapest)

      return { ...prev, preferences: next };
    });
  }

  function setPersons(n: number) {
    setState((prev) => ({ ...prev, persons: n }));
  }

  function setStoreMode(mode: StoreMode) {
    setState((prev) => ({ ...prev, storeMode: mode }));
  }

  function setSelectedStoreIds(ids: string[]) {
    setState((prev) => ({ ...prev, selectedStoreIds: ids }));
  }

  function setAreaCenter(center: { lat: number; lng: number }) {
    setState((prev) => ({ ...prev, areaCenter: center }));
  }

  function setAreaRadiusKm(km: number) {
    setState((prev) => ({ ...prev, areaRadiusKm: km }));
  }

  function setSearchQuery(q: string) {
    setState((prev) => ({ ...prev, searchQuery: q }));
  }

  function setSearchType(t: "retter" | "varer") {
    setState((prev) => ({ ...prev, searchType: t }));
  }

  function setWeekDays(n: number) {
    setState((prev) => ({ ...prev, weekDays: n }));
  }

  function saveDefaults(defaults: Partial<AppState>) {
    setSavedDefaults(defaults);
    try {
      localStorage.setItem("weekli_defaults", JSON.stringify(defaults));
    } catch {
      // ignore storage errors
    }
  }

  return (
    <AppContext.Provider
      value={{
        state,
        setPreference,
        setPersons,
        setStoreMode,
        setSelectedStoreIds,
        setAreaCenter,
        setAreaRadiusKm,
        setSearchQuery,
        setSearchType,
        setWeekDays,
        savedDefaults,
        saveDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
