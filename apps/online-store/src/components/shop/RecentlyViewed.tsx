import { useState, useEffect } from 'react';
import { Product } from '@/types/catalog';
import { getRecentlyViewed } from '@/lib/utils/productHelpers';
import { getProducts } from '@/lib/api/store';
import { ProductCard } from '@/components/ProductCard';

interface RecentlyViewedProps {
  currentProductId?: string;
}

export const RecentlyViewed = ({ currentProductId }: RecentlyViewedProps) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadRecentlyViewed() {
      const recentIds = getRecentlyViewed().filter(id => id !== currentProductId);
      if (recentIds.length === 0) return;

      const allProducts = await getProducts();
      const recentProducts = allProducts
        .filter(p => recentIds.includes(p.id))
        .slice(0, 4)
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          retailPrice: p.price,
          compareAtPrice: p.compareAt,
          stockQuantity: p.stock,
          sku: p.id,
          costPrice: p.price * 0.5,
          taxable: true,
          trackInventory: true,
          lowStockThreshold: 10,
          weight: 0,
          dimensions: { length: 0, width: 0, height: 0 },
          tags: p.tags || [],
          images: p.images || [],
          category: p.category || 'General',
          allowBackorders: false,
          requiresShipping: true,
          collections: [],
          variants: [],
          showOnline: true,
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

      setProducts(recentProducts);
    }

    loadRecentlyViewed();
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recently Viewed</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
