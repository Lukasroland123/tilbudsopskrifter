"use client";

import { useMemo } from "react";
import RecipeCard from "@/components/RecipeCard";
import TopBar from "@/components/TopBar";
import { RECIPES } from "@/lib/data";
import { calcRecipePrice } from "@/lib/pricing";
import { filterRecipesByPreferences } from "@/lib/weekly";
import { useApp } from "@/context/AppContext";

export default function DailyPage() {
  const { state } = useApp();

  const filtered = useMemo(() => {
    let list = filterRecipesByPreferences(RECIPES, state.preferences);

    // Apply search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      if (state.searchType === "retter") {
        list = list.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
        );
      } else {
        list = list.filter((r) =>
          r.ingredients.some((ri) =>
            ri.ingredient.name.toLowerCase().includes(q)
          )
        );
      }
    }

    // Sort by price
    return [...list]
      .sort(
        (a, b) =>
          calcRecipePrice(a, state.persons).mainPrice -
          calcRecipePrice(b, state.persons).mainPrice
      )
      .slice(0, 10);
  }, [state.preferences, state.persons, state.searchQuery, state.searchType]);

  return (
    <>
      <TopBar />
      <div className="px-4 py-4">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-center">Ingen retter matcher dine filtre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                persons={state.persons}
                preferences={state.preferences}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
