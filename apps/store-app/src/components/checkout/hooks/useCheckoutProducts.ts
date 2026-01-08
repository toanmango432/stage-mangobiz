/**
 * Checkout Products Hook
 *
 * Provides products from the catalog database for checkout.
 * Maps Product (inventory type) → Checkout Product format.
 */

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { productsDB } from '@/db/catalogDatabase';
import type { Product as CatalogProduct } from '@/types';

export interface CheckoutProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
  inStock: boolean;
  stockQuantity: number;
}

export interface UseCheckoutProductsResult {
  products: CheckoutProduct[];
  categories: string[];
  isLoading: boolean;
}

/**
 * Hook to load products from the catalog database for checkout.
 * Only returns retail products (isRetail: true).
 * Automatically updates when catalog data changes (via Dexie live query).
 */
export function useCheckoutProducts(storeId: string): UseCheckoutProductsResult {
  // Validate storeId - must be a non-empty string to query database
  const validStoreId = typeof storeId === 'string' && storeId.trim().length > 0;

  // Load retail products from IndexedDB (active only)
  // Uses guard pattern to prevent IDBKeyRange errors when storeId is invalid
  const catalogProducts = useLiveQuery(
    async () => {
      // Double-check storeId validity inside the query callback
      if (!validStoreId || !storeId || storeId.trim() === '') {
        return [];
      }
      return productsDB.getRetail(storeId);
    },
    [storeId, validStoreId],
    [] as CatalogProduct[]
  );

  // Map CatalogProduct → CheckoutProduct format
  const products = useMemo(() => {
    return catalogProducts.map((p): CheckoutProduct => ({
      id: p.id,
      name: p.name,
      price: p.retailPrice,
      category: p.category,
      sku: p.sku,
      // For now, use minStockLevel as a proxy for stock quantity
      // TODO: Integrate with InventoryLevel table for actual stock tracking
      inStock: p.isActive && (p.minStockLevel ?? 0) > 0,
      stockQuantity: p.minStockLevel ?? 10, // Default to 10 if no min level set
    }));
  }, [catalogProducts]);

  // Extract unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.category));
    return Array.from(uniqueCategories).sort();
  }, [products]);

  return {
    products,
    categories,
    isLoading: !catalogProducts || catalogProducts.length === 0,
  };
}

export default useCheckoutProducts;
