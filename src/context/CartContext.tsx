import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CartItem, ServerCartCalculation } from '../types/index.ts';
import { addMedusaLineItem, createMedusaCart, getMedusaConfig, isMedusaConfigured, removeMedusaLineItem, updateMedusaLineItem } from '../lib/medusa.ts';

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
  medusaSyncError: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'aveart_bag_items';
const MEDUSA_CART_STORAGE_KEY = 'aveart_medusa_cart_id';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [medusaCartId, setMedusaCartId] = useState<string | null>(() => {
    try { return localStorage.getItem(MEDUSA_CART_STORAGE_KEY); } catch { return null; }
  });
  const [medusaSyncError, setMedusaSyncError] = useState<string | null>(null);
  const medusaCartCreation = useRef<Promise<string> | null>(null);

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
    if (isMedusaConfigured()) {
      // Medusa cart mutations are synced directly below; until the staging region
      // and inventory are configured, do not trust the legacy SQLite calculator.
      setCalculation(null);
      return;
    }
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

  const ensureMedusaCart = async (): Promise<string> => {
    const stored = medusaCartId || (() => {
      try { return localStorage.getItem(MEDUSA_CART_STORAGE_KEY); } catch { return null; }
    })();
    if (stored) return stored;
    if (!medusaCartCreation.current) {
      medusaCartCreation.current = createMedusaCart().then((cart) => {
        try { localStorage.setItem(MEDUSA_CART_STORAGE_KEY, cart.id); } catch { /* storage optional */ }
        setMedusaCartId(cart.id);
        return cart.id;
      }).finally(() => { medusaCartCreation.current = null; });
    }
    return medusaCartCreation.current;
  };

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

    if (isMedusaConfigured()) {
      setMedusaSyncError(null);
      void (async () => {
        try {
          const cartId = await ensureMedusaCart();
          const cart = await addMedusaLineItem(cartId, variantId, quantity);
          const line = cart.items?.find((item) => item.variant_id === variantId);
          if (line) {
            setItems((prev) => prev.map((item) =>
              item.variantId === variantId ? { ...item, medusaLineItemId: line.id } : item
            ));
          }
        } catch (error) {
          setMedusaSyncError(error instanceof Error ? error.message : 'Could not sync the bag with Medusa.');
        }
      })();
    }
  };

  const removeItem = (variantId: string) => {
    const item = items.find((entry) => entry.variantId === variantId);
    setItems((prev) => prev.filter((entry) => entry.variantId !== variantId));
    if (isMedusaConfigured() && medusaCartId && item?.medusaLineItemId) {
      void removeMedusaLineItem(medusaCartId, item.medusaLineItemId).catch((error) => {
        setMedusaSyncError(error instanceof Error ? error.message : 'Could not remove the item from Medusa.');
      });
    }
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    const item = items.find((entry) => entry.variantId === variantId);
    setItems((prev) => prev.map((entry) => (entry.variantId === variantId ? { ...entry, quantity } : entry)));
    if (isMedusaConfigured() && medusaCartId && item?.medusaLineItemId) {
      void updateMedusaLineItem(medusaCartId, item.medusaLineItemId, quantity).catch((error) => {
        setMedusaSyncError(error instanceof Error ? error.message : 'Could not update the Medusa bag.');
      });
    }
  };

  const clearCart = () => {
    setItems([]);
    setDiscountCode('');
    setCalculation(null);
    if (isMedusaConfigured() && medusaCartId) {
      try { localStorage.removeItem(MEDUSA_CART_STORAGE_KEY); } catch { /* storage optional */ }
      setMedusaCartId(null);
    }
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
        medusaSyncError,
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
