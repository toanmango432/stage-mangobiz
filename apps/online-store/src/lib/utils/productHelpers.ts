import { Product } from '@/types/catalog';

export interface ProductFilters {
  priceMin: number;
  priceMax: number;
  categories: string[];
  inStockOnly: boolean;
  minRating: number;
  searchQuery: string;
}

export const filterProducts = (products: Product[], filters: ProductFilters): Product[] => {
  return products.filter(product => {
    // Price filter
    if (product.retailPrice < filters.priceMin || product.retailPrice > filters.priceMax) {
      return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }

    // Stock filter
    if (filters.inStockOnly && product.stockQuantity <= 0) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesDescription = product.description.toLowerCase().includes(query);
      const matchesTags = product.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    return true;
  });
};

export const getRelatedProducts = (product: Product, allProducts: Product[], limit = 6): Product[] => {
  // Find products in same category or with overlapping tags
  const related = allProducts
    .filter(p => 
      p.id !== product.id && 
      (p.category === product.category || 
       p.tags.some(tag => product.tags.includes(tag)))
    )
    .slice(0, limit);
  
  return related;
};

export const trackRecentlyViewed = (productId: string) => {
  const viewed = getRecentlyViewed();
  const filtered = viewed.filter(id => id !== productId);
  const updated = [productId, ...filtered].slice(0, 10); // Keep last 10
  localStorage.setItem('mango-recently-viewed', JSON.stringify(updated));
};

export const getRecentlyViewed = (): string[] => {
  const saved = localStorage.getItem('mango-recently-viewed');
  return saved ? JSON.parse(saved) : [];
};

export const calculateDiscount = (retailPrice: number, compareAtPrice?: number): number => {
  if (!compareAtPrice || compareAtPrice <= retailPrice) return 0;
  return Math.round(((compareAtPrice - retailPrice) / compareAtPrice) * 100);
};
