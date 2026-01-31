'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, PromoCode, CartSummary } from '@/types/cart';

interface CartContextType {
  items: CartItem[];
  savedForLater: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => CartSummary;
  getCartItemCount: () => number;
  promoCode: PromoCode | null;
  applyPromoCode: (code: string) => boolean;
  removePromoCode: () => void;
  saveForLater: (itemId: string) => void;
  moveToCart: (itemId: string) => void;
  removeFromSaved: (itemId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PROMO_CODES: Record<string, PromoCode> = {
  'WELCOME10': { code: 'WELCOME10', type: 'percent', value: 10, minPurchase: 0 },
  'SAVE20': { code: 'SAVE20', type: 'percent', value: 20, minPurchase: 100 },
  'FREESHIP': { code: 'FREESHIP', type: 'shipping', value: 0, minPurchase: 0 },
  'SPRING25': { code: 'SPRING25', type: 'fixed', value: 25, minPurchase: 75 },
};

const TAX_RATE = 0.10;
const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 7.99;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<PromoCode | null>(null);

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedCart = localStorage.getItem('mango-cart');
    const savedItems = localStorage.getItem('mango-saved-for-later');
    const savedPromo = localStorage.getItem('mango-promo-code');

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }

    if (savedItems) {
      try {
        setSavedForLater(JSON.parse(savedItems));
      } catch (e) {
        console.error('Failed to load saved items:', e);
      }
    }

    if (savedPromo) {
      try {
        setPromoCode(JSON.parse(savedPromo));
      } catch (e) {
        console.error('Failed to load promo code:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mango-cart', JSON.stringify(items));
  }, [items]);

  // Save saved-for-later to localStorage (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mango-saved-for-later', JSON.stringify(savedForLater));
  }, [savedForLater]);

  // Save promo code to localStorage (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (promoCode) {
      localStorage.setItem('mango-promo-code', JSON.stringify(promoCode));
    } else {
      localStorage.removeItem('mango-promo-code');
    }
  }, [promoCode]);

  const addToCart = (item: CartItem) => {
    setItems(prevItems => {
      // Check if item already exists
      const existingItemIndex = prevItems.findIndex(i => i.id === item.id && i.type === item.type);
      
      if (existingItemIndex > -1) {
        // Update quantity for products only
        if (item.type === 'product' && prevItems[existingItemIndex].quantity) {
          const newItems = [...prevItems];
          newItems[existingItemIndex].quantity = (newItems[existingItemIndex].quantity || 1) + (item.quantity || 1);
          return newItems;
        }
        // For other types, don't add duplicates
        return prevItems;
      }
      
      // Add new item
      return [...prevItems, item];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode(null);
  };

  const getCartItemCount = () => {
    return items.reduce((count, item) => {
      if (item.type === 'product') {
        return count + (item.quantity || 1);
      }
      return count + 1;
    }, 0);
  };

  const getCartTotal = (): CartSummary => {
    const subtotal = items.reduce((total, item) => {
      const itemTotal = item.price * (item.quantity || 1);
      // Add service add-ons
      if (item.serviceDetails?.addOns) {
        const addOnsTotal = item.serviceDetails.addOns.reduce((sum, addOn) => sum + addOn.price, 0);
        return total + itemTotal + addOnsTotal;
      }
      return total + itemTotal;
    }, 0);

    let discount = 0;
    if (promoCode) {
      if (subtotal >= promoCode.minPurchase) {
        if (promoCode.type === 'percent') {
          discount = subtotal * (promoCode.value / 100);
        } else if (promoCode.type === 'fixed') {
          discount = promoCode.value;
        }
      }
    }

    const hasPhysicalItems = items.some(item => item.type === 'product');
    let shipping = 0;
    
    if (hasPhysicalItems) {
      if (promoCode?.type === 'shipping') {
        shipping = 0;
      } else {
        shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      }
    }

    const tax = (subtotal - discount) * TAX_RATE;
    const total = subtotal - discount + tax + shipping;

    return {
      subtotal,
      discount,
      tax,
      shipping,
      total,
    };
  };

  const applyPromoCode = (code: string): boolean => {
    const upperCode = code.toUpperCase();
    const promo = PROMO_CODES[upperCode];
    
    if (promo) {
      const { subtotal } = getCartTotal();
      if (subtotal >= promo.minPurchase) {
        setPromoCode(promo);
        return true;
      }
    }
    return false;
  };

  const removePromoCode = () => {
    setPromoCode(null);
  };

  const saveForLater = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSavedForLater(prev => [...prev, item]);
      removeFromCart(itemId);
    }
  };

  const moveToCart = (itemId: string) => {
    const item = savedForLater.find(i => i.id === itemId);
    if (item) {
      addToCart(item);
      setSavedForLater(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const removeFromSaved = (itemId: string) => {
    setSavedForLater(prev => prev.filter(i => i.id !== itemId));
  };

  return (
    <CartContext.Provider
      value={{
        items,
        savedForLater,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
        promoCode,
        applyPromoCode,
        removePromoCode,
        saveForLater,
        moveToCart,
        removeFromSaved,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
