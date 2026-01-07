import { CartItem } from "@/types/cart";
import { PromoCode } from "@/types/cart";

export interface ValidationError {
  itemId: string;
  type: 'stock' | 'conflict' | 'price_change' | 'unavailable';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateCartItems = (items: CartItem[]): ValidationResult => {
  const errors: ValidationError[] = [];

  items.forEach(item => {
    // Check product stock
    if (item.type === 'product' && item.inStock === false) {
      errors.push({
        itemId: item.id,
        type: 'unavailable',
        message: `${item.name} is currently out of stock`
      });
    }

    // Check quantity against stock
    if (item.type === 'product' && item.quantity && item.quantity > 10) {
      errors.push({
        itemId: item.id,
        type: 'stock',
        message: `Only 10 units of ${item.name} available`
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const checkServiceConflicts = (items: CartItem[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  const serviceItems = items.filter(item => item.type === 'service');
  
  // Check for overlapping time slots
  for (let i = 0; i < serviceItems.length; i++) {
    for (let j = i + 1; j < serviceItems.length; j++) {
      const service1 = serviceItems[i];
      const service2 = serviceItems[j];
      
      if (service1.serviceDetails && service2.serviceDetails) {
        if (service1.serviceDetails.date === service2.serviceDetails.date &&
            service1.serviceDetails.time === service2.serviceDetails.time) {
          errors.push({
            itemId: service2.id,
            type: 'conflict',
            message: `Time slot conflict with ${service1.name}`
          });
        }
      }
    }
  }

  return errors;
};

export const calculateShipping = (items: CartItem[], subtotal: number): number => {
  const hasPhysicalProducts = items.some(item => item.type === 'product');
  
  if (!hasPhysicalProducts) return 0;
  if (subtotal >= 50) return 0; // Free shipping over $50
  
  return 8.99;
};

export const validatePromoCode = (
  code: string,
  subtotal: number,
  availableCodes: PromoCode[]
): { valid: boolean; promoCode?: PromoCode; error?: string } => {
  const promo = availableCodes.find(p => p.code === code.toUpperCase());
  
  if (!promo) {
    return { valid: false, error: "Invalid promo code" };
  }

  if (subtotal < promo.minPurchase) {
    return { 
      valid: false, 
      error: `Minimum purchase of $${promo.minPurchase.toFixed(2)} required` 
    };
  }

  return { valid: true, promoCode: promo };
};

export const calculateDiscount = (promoCode: PromoCode, subtotal: number): number => {
  if (promoCode.type === 'percent') {
    return subtotal * (promoCode.value / 100);
  } else if (promoCode.type === 'fixed') {
    return Math.min(promoCode.value, subtotal);
  }
  return 0;
};
