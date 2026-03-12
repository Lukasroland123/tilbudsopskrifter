"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ShoppingItem } from "@/lib/types";

interface ShoppingContextType {
  items: ShoppingItem[];
  addItems: (newItems: ShoppingItem[]) => void;
  removeItem: (name: string) => void;
  clearList: () => void;
  isOpen: boolean;
  openList: () => void;
  closeList: () => void;
}

const ShoppingContext = createContext<ShoppingContextType | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  function addItems(newItems: ShoppingItem[]) {
    setItems((prev) => {
      const updated = [...prev];
      for (const item of newItems) {
        const existing = updated.findIndex((i) => i.name === item.name);
        if (existing === -1) {
          updated.push(item);
        }
      }
      return updated;
    });
  }

  function removeItem(name: string) {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }

  function clearList() {
    setItems([]);
  }

  return (
    <ShoppingContext.Provider value={{
      items, addItems, removeItem, clearList,
      isOpen, openList: () => setIsOpen(true), closeList: () => setIsOpen(false),
    }}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error("useShopping must be used within ShoppingProvider");
  return ctx;
}
