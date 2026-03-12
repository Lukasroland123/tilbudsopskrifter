"use client";

import Link from "next/link";
import Image from "next/image";
import { Recipe, Preference } from "@/lib/types";
import { calcRecipePrice, formatPrice } from "@/lib/pricing";

interface Props {
  recipe: Recipe;
  persons: number;
  preferences?: Preference[];
}

export default function RecipeCard({ recipe, persons }: Props) {
  const price = calcRecipePrice(recipe, persons);
  const hasSavings = price.savings > 0;
  const oldPrice = price.mainPrice + price.savings;

  return (
    <Link href={`/opskrift/${recipe.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative h-40 w-full bg-gray-100">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Savings badge — top right */}
          {hasSavings && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
              Spar {formatPrice(price.savings)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h2 className="font-semibold text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
            {recipe.title}
          </h2>

          {/* Price: new / old */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-bold text-green-600">
              {formatPrice(price.mainPrice)}
            </span>
            {hasSavings && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(oldPrice)}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-0.5">
            {formatPrice(price.perPerson)}/pers.
          </p>
        </div>
      </div>
    </Link>
  );
}
