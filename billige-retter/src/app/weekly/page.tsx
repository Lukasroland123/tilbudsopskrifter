"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { RECIPES } from "@/lib/data";
import { generateWeeklyPlan } from "@/lib/weekly";
import { calcRecipePrice, formatPrice } from "@/lib/pricing";
import { WeeklyPlan, Recipe } from "@/lib/types";
import TopBar from "@/components/TopBar";
import { useShopping } from "@/context/ShoppingContext";
import { filterRecipesByPreferences } from "@/lib/weekly";

const DAY_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7];

export default function WeeklyPage() {
  const { state, setWeekDays } = useApp();
  const { addItems } = useShopping();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [replacingDay, setReplacingDay] = useState<number | null>(null);
  const [addedAll, setAddedAll] = useState(false);

  // Regenerate plan when preferences, persons, or weekDays change
  useEffect(() => {
    const generated = generateWeeklyPlan(RECIPES, state.preferences, state.persons, state.weekDays);
    setPlan(generated);
    setAddedAll(false);
  }, [state.preferences, state.persons, state.weekDays]);

  function handleRemoveDay(idx: number) {
    if (!plan) return;
    const newDays = [...plan.days];
    newDays[idx] = { ...newDays[idx], recipe: null };
    // Recalculate total
    const totalPrice = newDays.reduce((sum, d) => {
      if (!d.recipe) return sum;
      return sum + calcRecipePrice(d.recipe, state.persons).mainPrice;
    }, 0);
    setPlan({
      ...plan,
      days: newDays,
      totalPrice,
      pricePerPerson: state.persons > 0 ? totalPrice / state.persons : totalPrice,
    });
  }

  function handleReplaceDay(idx: number, recipe: Recipe) {
    if (!plan) return;
    const newDays = [...plan.days];
    newDays[idx] = { ...newDays[idx], recipe };
    const totalPrice = newDays.reduce((sum, d) => {
      if (!d.recipe) return sum;
      return sum + calcRecipePrice(d.recipe, state.persons).mainPrice;
    }, 0);
    setPlan({
      ...plan,
      days: newDays,
      totalPrice,
      pricePerPerson: state.persons > 0 ? totalPrice / state.persons : totalPrice,
    });
    setReplacingDay(null);
  }

  function handleAddAll() {
    if (!plan) return;
    for (const { recipe } of plan.days) {
      if (recipe) {
        addItems(plan.shoppingList.filter((i) => i.recipeTitle === recipe.title));
      }
    }
    setAddedAll(true);
  }

  // Total savings across all days in the plan
  const totalSavings = useMemo(() => {
    if (!plan) return 0;
    return plan.days.reduce((sum, d) => {
      if (!d.recipe) return sum;
      return sum + calcRecipePrice(d.recipe, state.persons).savings;
    }, 0);
  }, [plan, state.persons]);

  // Store breakdown
  const storeBreakdown = useMemo(() => {
    if (!plan) return {};
    const breakdown: Record<string, number> = {};
    for (const item of plan.shoppingList) {
      const store = item.store ?? "Ukendt butik";
      breakdown[store] = (breakdown[store] ?? 0) + (item.price ?? 0);
    }
    return breakdown;
  }, [plan]);

  if (!plan) {
    return (
      <>
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <div className="px-4 py-4">
        {/* Header with day selector + total */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Antal dage</p>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {DAY_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setWeekDays(n)}
                className={`w-8 h-7 rounded-lg text-xs font-semibold transition-colors ${
                  state.weekDays === n ? "bg-white text-green-600 shadow-sm" : "text-gray-500"
                }`}
              >
                {n}
              </button>
            ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">{formatPrice(plan.totalPrice)}</p>
            <p className="text-xs text-gray-400">{formatPrice(plan.pricePerPerson)}/pers.</p>
            {totalSavings > 0 && (
              <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Sparet {formatPrice(totalSavings)}
              </span>
            )}
          </div>
        </div>

        {/* Day cards */}
        <div className="space-y-3 mb-6">
          {plan.days.map((dayPlan, idx) => (
            <div key={dayPlan.day} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {dayPlan.recipe ? (
                <div className="flex items-center gap-3 p-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <Image
                      src={dayPlan.recipe.imageUrl}
                      alt={dayPlan.recipe.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium">{dayPlan.day}</p>
                    <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
                      {dayPlan.recipe.title}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      {formatPrice(calcRecipePrice(dayPlan.recipe, state.persons).mainPrice)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveDay(idx)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium">{dayPlan.day}</p>
                    <p className="text-sm text-gray-400">Ingen ret valgt</p>
                  </div>
                  <button
                    onClick={() => setReplacingDay(idx)}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-xl shrink-0"
                  >
                    Tilføj
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Store breakdown */}
        {Object.keys(storeBreakdown).length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Samlet indkøbsliste</h3>
            <ul className="space-y-1.5 mb-3">
              {Object.entries(storeBreakdown).map(([store, amount]) => (
                <li key={store} className="flex justify-between text-sm">
                  <span className="text-gray-600">{store}</span>
                  <span className="font-medium text-gray-800">{formatPrice(amount)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-green-600">{formatPrice(plan.totalPrice)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-end mt-2">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  Sparet {formatPrice(totalSavings)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Add all button */}
        <button
          onClick={handleAddAll}
          disabled={addedAll}
          className={`w-full py-3.5 rounded-2xl font-semibold text-base transition-colors ${
            addedAll
              ? "bg-gray-100 text-gray-400 cursor-default"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {addedAll ? "Tilføjet til indkøbsliste" : "Tilføj hele ugeplan til indkøbsliste"}
        </button>
      </div>

      {/* Replace recipe bottom sheet */}
      {replacingDay !== null && (
        <RecipePicker
          preferences={state.preferences}
          persons={state.persons}
          onPick={(recipe) => handleReplaceDay(replacingDay, recipe)}
          onClose={() => setReplacingDay(null)}
        />
      )}
    </>
  );
}

function RecipePicker({
  preferences,
  persons,
  onPick,
  onClose,
}: {
  preferences: import("@/lib/types").Preference[];
  persons: number;
  onPick: (r: Recipe) => void;
  onClose: () => void;
}) {
  const suggestions = filterRecipesByPreferences(RECIPES, preferences)
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white rounded-t-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Vælg en ret</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
          {suggestions.map((recipe: Recipe) => (
            <li
              key={recipe.id}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => onPick(recipe)}
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{recipe.title}</p>
                <p className="text-xs text-green-600">{formatPrice(calcRecipePrice(recipe, persons).mainPrice)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
