"use client";

import { ShoppingItem } from "@/lib/types";
import { formatPrice } from "@/lib/pricing";

interface Props {
  items: ShoppingItem[];
  onRemove: (name: string) => void;
  onClose: () => void;
}

export default function ShoppingListDrawer({ items, onRemove, onClose }: Props) {
  const total = items.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const pantryItems = items.filter((i) => i.isPantry);
  const mainItems = items.filter((i) => !i.isPantry);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-xl flex flex-col">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Indkøbsliste</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {mainItems.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Ingredienser
              </h3>
              <ul className="space-y-2">
                {mainItems.map((item) => (
                  <ShoppingRow key={`${item.name}-${item.recipeTitle}`} item={item} onRemove={onRemove} />
                ))}
              </ul>
            </section>
          )}

          {pantryItems.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Krydderier / basisvarer
              </h3>
              <ul className="space-y-2">
                {pantryItems.map((item) => (
                  <ShoppingRow key={`${item.name}-${item.recipeTitle}`} item={item} onRemove={onRemove} />
                ))}
              </ul>
            </section>
          )}

          {items.length === 0 && (
            <p className="text-gray-400 text-center mt-10">
              Ingen varer endnu.<br />Tilføj en opskrift til listen.
            </p>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Skønnet total</span>
              <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-gray-400">* Priser er estimerede og kan variere</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShoppingRow({ item, onRemove }: { item: ShoppingItem; onRemove: (name: string) => void }) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate">{item.name}</p>
        <p className="text-gray-400 text-xs">
          {item.packageDesc ?? `${item.amount % 1 === 0 ? item.amount : item.amount.toFixed(1)} ${item.unit}`}
          {item.store && ` · ${item.store}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.price !== undefined && (
          <span className="text-gray-600 font-medium">{formatPrice(item.price)}</span>
        )}
        <button
          onClick={() => onRemove(item.name)}
          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
          title="Fjern"
        >
          &times;
        </button>
      </div>
    </li>
  );
}
