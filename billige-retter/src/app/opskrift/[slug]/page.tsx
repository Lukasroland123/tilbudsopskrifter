"use client";

import { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { use } from "react";
import { RECIPES } from "@/lib/data";
import { calcRecipePrice, buildShoppingList, formatPrice, getIngredientPrice } from "@/lib/pricing";
import { useShopping } from "@/context/ShoppingContext";
import { useApp } from "@/context/AppContext";
import { RecipeIngredient } from "@/lib/types";

export default function OpskriftPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const recipe = RECIPES.find((r) => r.slug === slug);
  if (!recipe) notFound();

  const router = useRouter();
  const { state } = useApp();

  const [servings, setServings] = useState(state.persons > 0 ? state.persons : recipe.servings);
  // Fravalgte hovedingredienser (brugeren har dem allerede)
  const [deselectedMain, setDeselectedMain] = useState<Set<string>>(new Set());
  // Tilvalgte krydderier (brugeren mangler dem)
  const [selectedPantry, setSelectedPantry] = useState<Set<string>>(new Set());
  const [addedToList, setAddedToList] = useState(false);
  const { addItems, openList } = useShopping();

  const price = calcRecipePrice(recipe, servings, deselectedMain);
  const pantryTotal = [...selectedPantry].reduce((sum, id) => {
    const ri = recipe.ingredients.find((i) => i.ingredient.id === id);
    return sum + (ri?.ingredient.estimatedPantryPrice ?? 0);
  }, 0);
  const dynamicTotal = price.mainPrice + pantryTotal;

  const mainIngredients = recipe.ingredients.filter((ri) => !ri.ingredient.isPantry);
  const pantryIngredients = recipe.ingredients.filter((ri) => ri.ingredient.isPantry);

  function toggleMain(id: string) {
    setDeselectedMain((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setAddedToList(false);
  }

  function togglePantry(id: string) {
    setSelectedPantry((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setAddedToList(false);
  }

  function handleAddToList() {
    const items = buildShoppingList(recipe!, deselectedMain, selectedPantry, servings);
    addItems(items);
    setAddedToList(true);
    openList();
  }

  return (
    <div className="pb-6">
      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-green-600 text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Tilbage
        </button>
      </div>

      {/* Hero image */}
      <div className="relative h-56 w-full bg-gray-100">
        <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
      </div>

      <div className="px-4">
        {/* Title + price */}
        <div className="flex items-start justify-between mt-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 flex-1 mr-3">{recipe.title}</h1>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-green-600">{formatPrice(dynamicTotal)}</div>
            <div className="text-xs text-gray-400">
              {formatPrice(dynamicTotal / servings)} pr. person
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">{recipe.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                tag === "vegetar"
                  ? "bg-green-100 text-green-700"
                  : tag === "fisk"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {tag === "vegetar" ? "Vegetar" : tag === "fisk" ? "Fisk" : "Kødret"}
            </span>
          ))}
          {recipe.isOkologisk && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-lime-100 text-lime-700">
              Okologisk
            </span>
          )}
          {recipe.isDansk && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">
              Dansk
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-5">
          {recipe.estimatedTimeMinutes && <span>{recipe.estimatedTimeMinutes} min</span>}
          <div className="flex items-center gap-1">
            <span>Portioner:</span>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setServings(n)}
                className={`ml-1 w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                  servings === n ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5 text-sm space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>Ingredienser du skal købe</span>
            <span className="font-medium">{formatPrice(price.mainPrice)}</span>
          </div>
          {price.savings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Besparelse på tilbud</span>
              <span className="font-medium">-{formatPrice(price.savings)}</span>
            </div>
          )}
          {selectedPantry.size > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Krydderier du mangler (skøn)</span>
              <span>{formatPrice(pantryTotal)}</span>
            </div>
          )}
          {deselectedMain.size > 0 && (
            <div className="text-gray-400 text-xs">
              {deselectedMain.size} ingrediens(er) fravalgt
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-green-100 pt-1.5">
            <span>Din total</span>
            <span className="text-green-600">{formatPrice(dynamicTotal)}</span>
          </div>
        </div>

        {/* Main ingredients */}
        <section className="mb-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Ingredienser</h2>
          <p className="text-xs text-gray-400 mb-3">Klik fra hvis du allerede har varen.</p>
          <ul className="space-y-2">
            {mainIngredients.map((ri) => {
              const deselected = deselectedMain.has(ri.ingredient.id);
              const ingPrice = getIngredientPrice(ri);
              return (
                <IngredientRow
                  key={ri.ingredient.id}
                  ri={ri}
                  deselected={deselected}
                  onToggle={() => toggleMain(ri.ingredient.id)}
                  price={ingPrice}
                  isOffer={!!ri.offerPrice}
                />
              );
            })}
          </ul>
        </section>

        {/* Pantry ingredients */}
        {pantryIngredients.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Krydderier & basisvarer</h2>
            <p className="text-xs text-gray-400 mb-3">
              Klik til hvis du mangler dem.
            </p>
            <ul className="space-y-2">
              {pantryIngredients.map((ri) => {
                const selected = selectedPantry.has(ri.ingredient.id);
                return (
                  <li
                    key={ri.ingredient.id}
                    className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                      selected
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white border-gray-100"
                    }`}
                    onClick={() => togglePantry(ri.ingredient.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selected ? "bg-amber-400 border-amber-400" : "border-gray-300"
                      }`}>
                        {selected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{ri.ingredient.name}</p>
                        {ri.packageDesc && (
                          <p className="text-xs text-gray-400">{ri.packageDesc}</p>
                        )}
                      </div>
                    </div>
                    {ri.ingredient.estimatedPantryPrice && (
                      <span className="text-xs text-gray-400">
                        ~{formatPrice(ri.ingredient.estimatedPantryPrice)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Add to shopping list */}
        <button
          onClick={handleAddToList}
          disabled={addedToList}
          className={`w-full py-4 rounded-2xl font-semibold text-base transition-colors ${
            addedToList
              ? "bg-gray-100 text-gray-400 cursor-default"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {addedToList ? "Tilføjet til indkøbsliste" : "Tilføj til indkøbsliste"}
        </button>
      </div>
    </div>
  );
}

function IngredientRow({
  ri, deselected, onToggle, price, isOffer,
}: {
  ri: RecipeIngredient;
  deselected: boolean;
  onToggle: () => void;
  price: number;
  isOffer: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-all ${
        deselected
          ? "bg-gray-50 border-gray-100 opacity-50"
          : "bg-white border-gray-100"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
          deselected ? "bg-gray-300 border-gray-300" : "border-green-500 bg-green-500"
        }`}>
          {!deselected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        <div>
          <p className={`font-medium text-sm ${deselected ? "text-gray-400 line-through" : "text-gray-800"}`}>
            {ri.ingredient.name}
          </p>
          {ri.packageDesc && (
            <p className="text-xs text-gray-400">{ri.packageDesc}</p>
          )}
          {ri.offerStore && (
            <p className="text-xs text-gray-400">{ri.offerStore}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 ml-3 text-right">
        {isOffer ? (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              {ri.normalPrice && (
                <span className="text-gray-400 text-xs line-through">
                  {formatPrice(ri.normalPrice)}
                </span>
              )}
              <span className="text-green-600 font-semibold text-sm bg-green-50 px-2 py-0.5 rounded-full">
                {formatPrice(price)}
              </span>
            </div>
            {ri.normalPrice && (
              <span className="text-xs text-green-600 font-medium">
                Spar {formatPrice(ri.normalPrice - price)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">{formatPrice(price)}</span>
        )}
      </div>
    </li>
  );
}
