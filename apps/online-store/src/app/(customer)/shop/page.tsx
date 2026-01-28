import type { Metadata } from 'next';
import ShopClient from '@/pages/ShopClient';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { siteConfig } from '@/lib/metadata';
import { getProducts } from '@/lib/api/store';
import type { Product } from '@/types/catalog';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Browse and shop premium beauty and wellness products. Find everything from skincare to hair care at Mango.',
};

/**
 * Map StoreProduct (from API) to Product (catalog type used by UI components).
 */
function mapStoreProductsToProducts(storeProducts: any[]): Product[] {
  return storeProducts.map((p: any) => ({
    id: p.id,
    name: p.name,
    category: p.category || 'Uncategorized',
    description: p.description,
    sku: p.id,
    retailPrice: p.price,
    compareAtPrice: p.compareAt,
    costPrice: 0,
    stockQuantity: p.stock || 0,
    lowStockThreshold: 5,
    trackInventory: true,
    allowBackorders: false,
    requiresShipping: true,
    taxable: true,
    taxCode: '',
    variants: [],
    images: p.images || [],
    tags: p.tags || [],
    collections: [],
    featured: false,
    active: true,
    showOnline: true,
    brand: p.brand,
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    shippingRequired: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export default async function ShopPage() {
  let initialProducts: Product[] = [];

  try {
    const storeProducts = await getProducts();
    initialProducts = mapStoreProductsToProducts(storeProducts);
  } catch {
    // Server-side fetch failed — ShopClient will fetch on the client as fallback
  }

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: siteConfig.url },
          { name: 'Shop', url: `${siteConfig.url}/shop` },
        ]}
      />
      <ShopClient initialProducts={initialProducts} />
    </>
  );
}
