import { Recipe, RecipeIngredient, RecipePrice, ShoppingItem } from "./types";

export function getIngredientPrice(ri: RecipeIngredient): number {
  if (ri.ingredient.isPantry) return 0;
  return ri.offerPrice ?? ri.normalPrice ?? 0;
}

export function calcRecipePrice(
  recipe: Recipe,
  servings?: number,
  deselectedIds?: Set<string>
): RecipePrice {
  const effectiveServings = servings ?? recipe.servings;
  const excluded = deselectedIds ?? new Set<string>();

  // Sub-linear scale: total grows with persons, price/person decreases gently.
  // scale = (persons / recipe.servings) ^ 0.9
  // At recipe.servings: scale = 1 (base price unchanged).
  // Above: total rises but slower than linear → price/person falls slightly each step.
  const scale = Math.pow(effectiveServings / recipe.servings, 0.9);

  const mainIngredients = recipe.ingredients.filter((ri) => !ri.ingredient.isPantry);
  const pantryIngredients = recipe.ingredients.filter((ri) => ri.ingredient.isPantry);

  const mainPrice = mainIngredients
    .filter((ri) => !excluded.has(ri.ingredient.id))
    .reduce((sum, ri) => sum + getIngredientPrice(ri) * scale, 0);

  const pantryPrice = pantryIngredients
    .filter((ri) => excluded.has(ri.ingredient.id))
    .reduce((sum, ri) => sum + (ri.ingredient.estimatedPantryPrice ?? 0) * scale, 0);

  const savings = mainIngredients
    .filter(
      (ri) =>
        !excluded.has(ri.ingredient.id) &&
        ri.offerPrice !== undefined &&
        ri.normalPrice !== undefined
    )
    .reduce((sum, ri) => sum + (ri.normalPrice! - ri.offerPrice!) * scale, 0);

  return {
    mainPrice,
    pantryPrice,
    totalPrice: mainPrice + pantryPrice,
    perPerson: mainPrice / effectiveServings,
    savings,
  };
}

export function buildShoppingList(
  recipe: Recipe,
  deselectedMainIds: Set<string>,
  selectedPantryIds: Set<string>,
  servings: number
): ShoppingItem[] {
  const scale = servings / recipe.servings;
  const items: ShoppingItem[] = [];

  for (const ri of recipe.ingredients) {
    const isPantry = ri.ingredient.isPantry;

    if (isPantry) {
      // Pantry: kun med hvis brugeren aktivt har valgt dem til
      if (!selectedPantryIds.has(ri.ingredient.id)) continue;
    } else {
      // Hoved: med som standard, medmindre brugeren har fravalgt dem
      if (deselectedMainIds.has(ri.ingredient.id)) continue;
    }

    items.push({
      id: ri.ingredient.id,
      name: ri.ingredient.name,
      amount: ri.amount * scale,
      unit: ri.unit,
      price: isPantry
        ? ri.ingredient.estimatedPantryPrice
        : ri.offerPrice ?? ri.normalPrice,
      store: ri.offerStore,
      packageDesc: ri.packageDesc,
      recipeTitle: recipe.title,
      isPantry,
    });
  }

  return items;
}

export function formatPrice(kr: number): string {
  return `${kr.toFixed(0)} kr`;
}
