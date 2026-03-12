export type Tag = "vegetar" | "kød" | "fisk";
export type Preference = "billigst" | "okologisk" | "vegetarisk" | "dansk" | "kød";
export type StoreMode = "alle" | "udvalgte" | "en";

export interface Ingredient {
  id: string;
  name: string;
  isPantry: boolean;
  estimatedPantryPrice?: number;
}

export interface RecipeIngredient {
  ingredient: Ingredient;
  amount: number;
  unit: string;
  notes?: string;
  offerPrice?: number;
  offerStore?: string;
  normalPrice?: number;
  packageDesc?: string;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  servings: number;
  estimatedTimeMinutes?: number;
  imageUrl: string;
  tags: Tag[];
  isOkologisk?: boolean;
  isVegetarisk?: boolean;
  isDansk?: boolean; // OPEN PUNKT: ikke koblet til produktdata endnu
  ingredients: RecipeIngredient[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  price?: number;
  store?: string;
  packageDesc?: string;
  recipeTitle: string;
  isPantry: boolean;
}

export interface RecipePrice {
  mainPrice: number;
  pantryPrice: number;
  totalPrice: number;
  perPerson: number;
  savings: number; // normalPrice - offerPrice sum
}

export interface StoreLocation {
  id: string;
  name: string;
  chain: string; // "Netto" | "Føtex" | "Rema 1000"
  lat: number;
  lng: number;
  address: string;
}

export interface AppState {
  preferences: Preference[];
  persons: number;
  storeMode: StoreMode;
  selectedStoreIds: string[];
  areaCenter: { lat: number; lng: number };
  areaRadiusKm: number;
  searchQuery: string;
  searchType: "retter" | "varer";
  weekDays: number; // 2-7
}

export interface WeeklyPlan {
  days: Array<{
    day: string;
    recipe: Recipe | null;
  }>;
  totalPrice: number;
  pricePerPerson: number;
  shoppingList: ShoppingItem[];
}
