import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, ServerCartCalculation } from '../types/index.ts';

interface CartContextType {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (variantId: string, quantity?: number, meta?: Partial<CartItem>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  shippingMethod: string;
  setShippingMethod: (method: string) => void;
  calculation: ServerCartCalculation | null;
  isCalculating: boolean;
  totalItemCount: number;
  recalculate: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aveart_bag_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [discountCode, setDiscountCode] = useState<string>('');
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [calculation, setCalculation] = useState<ServerCartCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  // Server-authoritative calculation
  const recalculate = useCallback(async () => {
    if (items.length === 0) {
      setCalculation(null);
      return;
    }

    setIsCalculating(true);
    try {
      const res = await fetch('/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          discountCode: discountCode.trim() || undefined,
          shippingMethod,
        }),
      });

      if (res.ok) {
        const data: ServerCartCalculation = await res.json();
        setCalculation(data);
      }
    } catch (err) {
      console.error('Failed to recalculate bag:', err);
    } finally {
      setIsCalculating(false);
    }
  }, [items, discountCode, shippingMethod]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  const addItem = (variantId: string, quantity: number = 1, meta?: Partial<CartItem>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { variantId, quantity, ...meta }];
    });
    setIsDrawerOpen(true);
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    setCalculation(null);
  };

  const totalItemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        discountCode,
        setDiscountCode,
        shippingMethod,
        setShippingMethod,
        calculation,
        isCalculating,
        totalItemCount,
        recalculate,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
