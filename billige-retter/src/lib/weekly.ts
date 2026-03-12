import { Recipe, Preference, ShoppingItem, WeeklyPlan } from "./types";
import { calcRecipePrice, buildShoppingList } from "./pricing";

const DAY_NAMES = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];

export function filterRecipesByPreferences(recipes: Recipe[], preferences: Preference[]): Recipe[] {
  return recipes.filter((r) => {
    if (preferences.includes("vegetarisk") && !r.isVegetarisk) return false;
    if (preferences.includes("okologisk") && !r.isOkologisk) return false;
    if (preferences.includes("dansk") && !r.isDansk) return false;
    if (preferences.includes("kød") && !r.tags.includes("kød")) return false;
    return true;
  });
}

export function generateWeeklyPlan(
  recipes: Recipe[],
  preferences: Preference[],
  persons: number,
  days: number
): WeeklyPlan {
  const filtered = filterRecipesByPreferences(recipes, preferences);

  // Sort by price ascending (billigst first)
  const sorted = [...filtered].sort(
    (a, b) => calcRecipePrice(a, persons).mainPrice - calcRecipePrice(b, persons).mainPrice
  );

  const picked: (Recipe | null)[] = [];
  const usageCount: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    // Find next recipe: max 2x usage, prefer variety
    let chosen: Recipe | null = null;

    for (const recipe of sorted) {
      const count = usageCount[recipe.id] ?? 0;
      if (count < 1) {
        chosen = recipe;
        usageCount[recipe.id] = count + 1;
        break;
      }
    }

    picked.push(chosen);
  }

  // Build shopping list with ingredient reuse tracking
  const boughtIngredients: Record<string, boolean> = {};
  const shoppingList: ShoppingItem[] = [];

  for (const recipe of picked) {
    if (!recipe) continue;

    const items = buildShoppingList(recipe, new Set(), new Set(), persons);

    for (const item of items) {
      if (!item.isPantry) {
        const key = item.name.toLowerCase();
        if (!boughtIngredients[key]) {
          boughtIngredients[key] = true;
          shoppingList.push(item);
        } else {
          shoppingList.push({ ...item, price: (item.price ?? 0) * 0.5 });
        }
      }
    }
  }

  // Total price: sum of calcRecipePrice per recipe — correctly scales with persons
  const totalPrice = picked.reduce((sum, recipe) => {
    if (!recipe) return sum;
    return sum + calcRecipePrice(recipe, persons).mainPrice;
  }, 0);

  const pricePerPerson = persons > 0 ? totalPrice / persons : totalPrice;

  return {
    days: picked.map((recipe, i) => ({
      day: DAY_NAMES[i],
      recipe,
    })),
    totalPrice,
    pricePerPerson,
    shoppingList,
  };
}

export { DAY_NAMES };
