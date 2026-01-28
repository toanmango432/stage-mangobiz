'use client';

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useNavigate, useAppRouter, usePathname, useSearchParams } from "@/lib/navigation";
import { ProductCard } from "@/components/ProductCard";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { FilterDrawer } from "@/components/shop/FilterDrawer";
import { FilterChips } from "@/components/shop/FilterChips";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import productsHero from "@/assets/products-hero.jpg";
import { getProducts } from "@/lib/api/store";
import { filterProducts, ProductFilters } from "@/lib/utils/productHelpers";
import { Product } from "@/types/catalog";

interface ShopClientProps {
  initialProducts: Product[];
}

const ShopClient = ({ initialProducts }: ShopClientProps) => {
  const navigate = useNavigate();
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Get max price from products
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.retailPrice), 100);
  }, [products]);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<ProductFilters>({
    priceMin: Number(searchParams.get('priceMin')) || 0,
    priceMax: Number(searchParams.get('priceMax')) || maxPrice,
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    inStockOnly: searchParams.get('inStockOnly') === 'true',
    minRating: Number(searchParams.get('minRating')) || 0,
    searchQuery: searchParams.get('search') || '',
  });

  // Load products on mount only if no initial products were provided
  useEffect(() => {
    if (initialProducts.length > 0) return;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedProducts = await getProducts();

        // Map StoreProduct to Product format
        const mappedProducts: Product[] = loadedProducts.map((p: any) => ({
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

        setProducts(mappedProducts);

        // Update priceMax if it wasn't set from URL
        if (!searchParams.get('priceMax')) {
          const max = Math.max(...mappedProducts.map(p => p.retailPrice), 100);
          setFilters(prev => ({ ...prev, priceMax: max }));
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Sync filters with URL params
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.priceMin > 0) params.set('priceMin', filters.priceMin.toString());
    if (filters.priceMax < maxPrice) params.set('priceMax', filters.priceMax.toString());
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','));
    if (filters.inStockOnly) params.set('inStockOnly', 'true');
    if (filters.minRating > 0) params.set('minRating', filters.minRating.toString());
    if (filters.searchQuery) params.set('search', filters.searchQuery);

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [filters, maxPrice, pathname, router]);

  const handleFiltersChange = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRemoveFilter = (filterType: keyof ProductFilters, value?: string) => {
    if (filterType === 'categories' && value) {
      setFilters(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c !== value),
      }));
    } else if (filterType === 'priceMin') {
      setFilters(prev => ({ ...prev, priceMin: 0 }));
    } else if (filterType === 'priceMax') {
      setFilters(prev => ({ ...prev, priceMax: maxPrice }));
    } else if (filterType === 'inStockOnly') {
      setFilters(prev => ({ ...prev, inStockOnly: false }));
    } else if (filterType === 'searchQuery') {
      setFilters(prev => ({ ...prev, searchQuery: '' }));
    }
  };

  const filteredProducts = useMemo(() => {
    return filterProducts(products, filters);
  }, [products, filters]);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  const activeFilterCount =
    filters.categories.length +
    (filters.priceMin > 0 ? 1 : 0) +
    (filters.priceMax < maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-8">
        <div className="relative h-48 md:h-64 bg-gradient-hero overflow-hidden">
          <Image
            src={productsHero}
            alt="Shop our products"
            fill
            priority
            className="object-cover mix-blend-overlay opacity-40"
            sizes="100vw"
          />
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Shop Our Products</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen pb-20 md:pb-8">
        <div className="relative h-48 md:h-64 bg-gradient-hero overflow-hidden">
          <Image
            src={productsHero}
            alt="Shop our products"
            fill
            priority
            className="object-cover mix-blend-overlay opacity-40"
            sizes="100vw"
          />
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Shop Our Products</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center bg-destructive/10 border border-destructive/20 rounded-lg p-8">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="relative h-48 md:h-64 bg-gradient-hero overflow-hidden">
        <img
          src={productsHero}
          alt="Shop our products"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
        />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Shop Our Products</h1>
          <p className="text-sm md:text-base text-white/90 max-w-2xl">
            Professional-grade beauty products for salon-quality results at home
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search & Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={filters.searchQuery}
              onChange={(e) => handleFiltersChange({ searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="md:hidden">
            <FilterDrawer
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={categories}
              maxPrice={maxPrice}
              activeFilterCount={activeFilterCount}
            />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filter Panel */}
          <aside className="hidden md:block flex-shrink-0">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              categories={categories}
              maxPrice={maxPrice}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <FilterChips
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              maxPrice={maxPrice}
            />

            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/shop/${product.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No products found matching your filters</p>
                <button
                  onClick={() => handleFiltersChange({
                    priceMin: 0,
                    priceMax: maxPrice,
                    categories: [],
                    inStockOnly: false,
                    minRating: 0,
                    searchQuery: '',
                  })}
                  className="text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopClient;
