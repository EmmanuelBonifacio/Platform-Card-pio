'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  key: string;
  productId?: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  addons?: Array<{ name: string; priceCents: number }>;
};

type CartState = {
  slug: string | null;
  items: CartItem[];
  setSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (key: string) => void;
  setQty: (key: string, quantity: number) => void;
  clear: () => void;
  totalCents: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      slug: null,
      items: [],
      setSlug: (slug) => {
        const current = get().slug;
        if (current && current !== slug) {
          set({ slug, items: [] });
        } else {
          set({ slug });
        }
      },
      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        const existing = get().items.find((i) => i.key === item.key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.key === item.key
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          });
          return;
        }
        set({ items: [...get().items, { ...item, quantity }] });
      },
      removeItem: (key) =>
        set({ items: get().items.filter((i) => i.key !== key) }),
      setQty: (key, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.key !== key) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.key === key ? { ...i, quantity } : i,
          ),
        });
      },
      clear: () => set({ items: [] }),
      totalCents: () =>
        get().items.reduce((acc, item) => {
          const addons = (item.addons ?? []).reduce(
            (a, x) => a + x.priceCents,
            0,
          );
          return acc + (item.unitPriceCents + addons) * item.quantity;
        }, 0),
      count: () => get().items.reduce((a, i) => a + i.quantity, 0),
    }),
    {
      name: 'pc-cart-v1',
      skipHydration: true,
    },
  ),
);
