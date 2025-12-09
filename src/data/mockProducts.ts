// Mock product data for checkout panel
import { Grid, Droplet, Sparkles, Palette, Heart } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  category: string;
  size: string;
  price: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'all', name: 'All Products', icon: Grid },
  { id: 'shampoo', name: 'Shampoo', icon: Droplet },
  { id: 'styling', name: 'Styling', icon: Sparkles },
  { id: 'color', name: 'Color', icon: Palette },
  { id: 'skincare', name: 'Skincare', icon: Heart },
];

export const MOCK_PRODUCTS: Product[] = [
  // Shampoo
  { id: 'prod-1', name: 'Premium Shampoo', category: 'shampoo', size: '8 oz', price: 28 },
  { id: 'prod-2', name: 'Moisturizing Shampoo', category: 'shampoo', size: '12 oz', price: 32 },
  { id: 'prod-3', name: 'Color-Safe Shampoo', category: 'shampoo', size: '10 oz', price: 35 },

  // Styling
  { id: 'prod-4', name: 'Hair Spray', category: 'styling', size: '10 oz', price: 22 },
  { id: 'prod-5', name: 'Styling Gel', category: 'styling', size: '6 oz', price: 18 },
  { id: 'prod-6', name: 'Mousse', category: 'styling', size: '8 oz', price: 24 },
  { id: 'prod-7', name: 'Heat Protectant', category: 'styling', size: '6 oz', price: 26 },

  // Color
  { id: 'prod-8', name: 'Leave-in Conditioner', category: 'color', size: '6 oz', price: 35 },
  { id: 'prod-9', name: 'Color Depositing Mask', category: 'color', size: '8 oz', price: 42 },
  { id: 'prod-10', name: 'Gloss Treatment', category: 'color', size: '4 oz', price: 38 },

  // Skincare
  { id: 'prod-11', name: 'Face Moisturizer', category: 'skincare', size: '2 oz', price: 45 },
  { id: 'prod-12', name: 'Eye Cream', category: 'skincare', size: '0.5 oz', price: 55 },
  { id: 'prod-13', name: 'Facial Cleanser', category: 'skincare', size: '4 oz', price: 32 },
];

export function getProductsByCategory(categoryId: string): Product[] {
  if (categoryId === 'all') return MOCK_PRODUCTS;
  return MOCK_PRODUCTS.filter(p => p.category === categoryId);
}
