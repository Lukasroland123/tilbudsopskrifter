"use client";

import { useMemo } from "react";
import { RECIPES } from "@/lib/data";
import { formatPrice } from "@/lib/pricing";

interface OfferItem {
  name: string;
  store: string;
  normalPrice: number;
  offerPrice: number;
  savingsPct: number;
  packageDesc?: string;
}

const STORE_COLOR: Record<string, string> = {
  Netto: "bg-blue-500",
  Føtex: "bg-red-500",
  "Rema 1000": "bg-orange-500",
  Bilka: "bg-purple-500",
};

export default function TilbudPage() {
  // Group offers by store
  const byStore = useMemo<Record<string, OfferItem[]>>(() => {
    const seen = new Set<string>();
    const grouped: Record<string, OfferItem[]> = {};

    for (const recipe of RECIPES) {
      for (const ri of recipe.ingredients) {
        if (ri.offerPrice === undefined || ri.normalPrice === undefined) continue;

        const store = ri.offerStore ?? "Ukendt";
        const key = `${ri.ingredient.name}::${store}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const item: OfferItem = {
          name: ri.ingredient.name,
          store,
          normalPrice: ri.normalPrice,
          offerPrice: ri.offerPrice,
          savingsPct: Math.round(((ri.normalPrice - ri.offerPrice) / ri.normalPrice) * 100),
          packageDesc: ri.packageDesc,
        };

        if (!grouped[store]) grouped[store] = [];
        grouped[store].push(item);
      }
    }

    // Sort each store's items by savings % descending
    for (const store in grouped) {
      grouped[store].sort((a, b) => b.savingsPct - a.savingsPct);
    }

    return grouped;
  }, []);

  const stores = Object.keys(byStore);
  const totalOffers = stores.reduce((sum, s) => sum + byStore[s].length, 0);

  return (
    <div className="py-4">
      {/* Header */}
      <div className="px-4 mb-4">
        <h1 className="text-xl font-bold text-gray-900">Butikkernes fremhævede</h1>
      </div>

      {stores.length === 0 ? (
        <p className="text-gray-400 text-center py-20 px-4">Ingen tilbud fundet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {stores.map((store) => (
            <section key={store}>
              {/* Store header */}
              <div className="flex items-center gap-2 px-4 mb-3">
                <span
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    STORE_COLOR[store] ?? "bg-gray-400"
                  }`}
                />
                <h2 className="font-bold text-gray-900 text-base">{store}</h2>
                <span className="text-xs text-gray-400 font-medium">
                  {byStore[store].length} tilbud
                </span>
              </div>

              {/* Horizontal scroll row */}
              <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
                {byStore[store].map((offer, idx) => (
                  <OfferCard key={idx} offer={offer} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer }: { offer: OfferItem }) {
  return (
    <div className="shrink-0 w-36 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
      {/* Savings badge */}
      <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
        -{offer.savingsPct}%
      </span>

      {/* Product name */}
      <p className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
        {offer.name}
      </p>

      {/* Package desc */}
      {offer.packageDesc && (
        <p className="text-xs text-gray-400 mb-2 line-clamp-1">{offer.packageDesc}</p>
      )}

      {/* Prices */}
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-base font-bold text-green-600">
          {formatPrice(offer.offerPrice)}
        </span>
        <span className="text-xs text-gray-400 line-through">
          {formatPrice(offer.normalPrice)}
        </span>
      </div>
    </div>
  );
}
