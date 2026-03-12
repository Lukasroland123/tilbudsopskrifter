"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useShopping } from "@/context/ShoppingContext";
import { supabase } from "@/lib/supabase";
import { Preference } from "@/lib/types";
import { formatPrice } from "@/lib/pricing";
import MapModal from "@/components/MapModal";

const PREFERENCE_OPTIONS: { value: Preference; label: string }[] = [
  { value: "okologisk", label: "Økologisk" },
  { value: "vegetarisk", label: "Vegetarisk" },
  { value: "kød", label: "Kød" },
  { value: "dansk", label: "Dansk" },
];

const STORE_MODE_SHORT: Record<string, string> = {
  alle: "Alle butikker",
  udvalgte: "Udvalgte butikker",
  en: "Enkelt butik",
};

export default function ProfilPage() {
  const router = useRouter();
  const { state, setPreference, setPersons, savedDefaults, saveDefaults } = useApp();
  const { items } = useShopping();
  const [email, setEmail] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const guest = localStorage.getItem("weekli_guest") === "true";
      setIsGuest(guest);
      if (!guest) {
        const { data } = await supabase.auth.getUser();
        setEmail(data.user?.email ?? null);
      }
    }
    loadUser();
  }, []);

  async function handleSignOut() {
    if (isGuest) {
      localStorage.removeItem("weekli_guest");
    } else {
      await supabase.auth.signOut();
    }
    router.replace("/login");
  }

  function handleSaveDefaults() {
    saveDefaults({
      preferences: state.preferences,
      persons: state.persons,
      storeMode: state.storeMode,
      selectedStoreIds: state.selectedStoreIds,
      areaRadiusKm: state.areaRadiusKm,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalSavings = items.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const activePrefLabels = state.preferences
    .filter((p) => p !== "billigst")
    .map((p) => PREFERENCE_OPTIONS.find((o) => o.value === p)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Profil</h1>

      {/* Konto */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Konto</h2>
        <div className="flex items-center justify-between">
          <div>
            {isGuest ? (
              <>
                <p className="font-medium text-gray-900">Gæst</p>
                <p className="text-sm text-gray-400">Ikke logget ind</p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-900">{email ?? "Ukendt"}</p>
                <p className="text-sm text-gray-400">Logget ind</p>
              </>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl"
          >
            Log ud
          </button>
        </div>
      </section>

      {/* Faste præferencer — samme opbygning som Daily */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4">
        <h2 className="font-semibold text-gray-800 mb-1">Faste præferencer</h2>
        <p className="text-xs text-gray-400 mb-4">
          Gemmes som standard og bruges næste gang du åbner appen.
        </p>

        {/* 1. Præferencer */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Præferencer
          </p>
          <div className="flex flex-col gap-2">
            {PREFERENCE_OPTIONS.map(({ value, label }) => {
              const isOn = state.preferences.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => setPreference(value, !isOn)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${
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
          {activePrefLabels && (
            <p className="text-xs text-green-600 mt-2">Aktive: {activePrefLabels}</p>
          )}
        </div>

        {/* 2. Antal personer */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Antal personer
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setPersons(n)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  state.persons === n ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Butikker / område */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Butikker / område
          </p>
          <button
            onClick={() => setMapOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm"
          >
            <span className="font-medium text-gray-800">
              {STORE_MODE_SHORT[state.storeMode]}
            </span>
            <span className="text-gray-400">{state.areaRadiusKm} km radius</span>
          </button>
        </div>

        {/* Gem knap */}
        <button
          onClick={handleSaveDefaults}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
            saved ? "bg-green-50 text-green-600 border border-green-200" : "bg-green-600 text-white"
          }`}
        >
          {saved ? "Gemt!" : "Gem som standard"}
        </button>
      </section>

      {/* Besparelser */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Besparelser</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Varer i indkøbsliste</p>
          <p className="font-semibold text-gray-900">{items.length} stk</p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-600">Samlet estimeret beløb</p>
          <p className="font-semibold text-green-600">{formatPrice(totalSavings)}</p>
        </div>
        {items.length === 0 && (
          <p className="text-sm text-gray-400 mt-2">
            Tilføj opskrifter til din indkøbsliste for at se besparelser.
          </p>
        )}
      </section>

      {/* Indstillinger */}
      <section className="bg-white border border-gray-100 rounded-2xl p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Indstillinger</h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-center justify-between">
            <span>Version</span>
            <span className="text-gray-400">1.0.0</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Gemte standarder</span>
            <span className="text-gray-400">
              {Object.keys(savedDefaults).length > 0 ? "Ja" : "Ingen"}
            </span>
          </li>
        </ul>
      </section>

      {mapOpen && <MapModal onClose={() => setMapOpen(false)} />}
    </div>
  );
}
