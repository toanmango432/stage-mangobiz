'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '@/types/catalog';
import { getProducts } from '@/lib/api/store';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { VariantSelector } from '@/components/shop/VariantSelector';
import { RelatedProducts } from '@/components/shop/RelatedProducts';
import { StockAlert } from '@/components/shop/StockAlert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Minus, Plus, Heart, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'sonner';
import { trackRecentlyViewed, getRelatedProducts, calculateDiscount } from '@/lib/utils/productHelpers';
import { ReviewsSection } from '@/components/shop/ReviewsSection';
import { SocialShare } from '@/components/shop/SocialShare';
import { RecentlyViewed } from '@/components/shop/RecentlyViewed';

const ProductDetail = () => {
  const params = useParams();
  const productId = params.productId as string | undefined;
  const router = useRouter();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [stockAlertOpen, setStockAlertOpen] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (productId) {
        try {
          const allProducts = await getProducts();
          const found = allProducts.find(p => p.id === productId);
          
          if (found) {
            // Map StoreProduct to Product
            const mappedProduct: Product = {
              id: found.id,
              name: found.name,
              description: found.description,
              retailPrice: found.price,
              compareAtPrice: found.compareAt,
              stockQuantity: found.stock,
              sku: found.id,
              costPrice: found.price * 0.5,
              taxable: true,
              trackInventory: true,
              lowStockThreshold: 10,
              weight: 0,
              dimensions: { length: 0, width: 0, height: 0 },
              tags: found.tags || [],
              images: found.images || [],
              category: found.category || 'General',
              allowBackorders: false,
              requiresShipping: true,
              collections: [],
              variants: [],
              showOnline: true,
              featured: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            setProduct(mappedProduct);
            setSelectedVariant(null);
            trackRecentlyViewed(productId);
            
            const related = getRelatedProducts(mappedProduct, allProducts.map(p => ({
              ...p,
              retailPrice: p.price,
              stockQuantity: p.stock,
              sku: p.id,
              costPrice: p.price * 0.5,
              taxable: true,
              trackInventory: true,
              lowStockThreshold: 10,
              weight: 0,
              dimensions: { length: 0, width: 0, height: 0 },
              isActive: true,
              isFeatured: false,
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
            })), 6);
            setRelatedProducts(related);
          } else {
            router.push('/shop');
          }
        } catch (error) {
          console.error('Failed to load product:', error);
          router.push('/shop');
        }
      }
    }
    fetchProduct();
  }, [productId, router]);

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const currentPrice = selectedVariant?.price || product.retailPrice;
  const inStock = selectedVariant ? selectedVariant.stockQuantity > 0 : product.stockQuantity > 0;
  const discount = calculateDiscount(product.retailPrice, product.compareAtPrice);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!inStock) return;
    
    addToCart({
      id: product.id,
      type: 'product',
      name: product.name,
      price: currentPrice,
      quantity,
      image: product.images[0],
      sku: selectedVariant?.sku || product.sku,
      inStock,
    });
    toast.success(`Added ${quantity} ${product.name} to cart`);
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product.id);
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Breadcrumbs */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/shop" className="hover:text-foreground">Shop</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Gallery */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">
                ${currentPrice.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                  <Badge variant="destructive">{discount}% OFF</Badge>
                </>
              )}
            </div>

            {product.variants && product.variants.length > 0 && selectedVariant && (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
              />
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Quantity</div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!inStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-16 text-center text-lg font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!inStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleWishlistToggle}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {!inStock && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setStockAlertOpen(true)}
              >
                Notify Me When Available
              </Button>
            )}

            {inStock && (
              <Badge variant="secondary" className="w-fit">
                ✓ In Stock - Ships within 2-3 business days
              </Badge>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="howto">How to Use</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="prose prose-sm max-w-none mt-6">
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            
            <div className="mt-6">
              <SocialShare productName={product.name} />
            </div>
          </TabsContent>
          
          <TabsContent value="ingredients" className="mt-6">
            <div className="space-y-2">
              {product.tags.map((ingredient, index) => (
                <p key={index} className="text-muted-foreground">• {ingredient}</p>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="howto" className="mt-6">
            <div className="space-y-3 text-muted-foreground">
              <p>1. Clean and prepare the application area</p>
              <p>2. Apply product evenly using gentle motions</p>
              <p>3. Allow time for product to set or absorb</p>
              <p>4. Follow with any recommended finishing products</p>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <ReviewsSection
              reviews={[
                {
                  id: 'r1',
                  customerId: 'c1',
                  customerName: 'Sarah M.',
                  rating: 5,
                  date: '2025-01-15',
                  title: 'Amazing quality!',
                  comment: 'This product exceeded my expectations. The quality is outstanding and it lasts all day. Highly recommend!',
                  verified: true,
                  helpful: 12
                },
                {
                  id: 'r2',
                  customerId: 'c2',
                  customerName: 'Michael T.',
                  rating: 4,
                  date: '2025-01-10',
                  title: 'Great value',
                  comment: 'Really good product for the price. Does what it promises.',
                  verified: true,
                  helpful: 8
                },
                {
                  id: 'r3',
                  customerId: 'c3',
                  customerName: 'Jessica L.',
                  rating: 5,
                  date: '2025-01-05',
                  title: 'Will buy again',
                  comment: 'Love this! Already ordered a second one.',
                  verified: false,
                  helpful: 5
                }
              ]}
              averageRating={4.7}
              totalReviews={3}
            />
          </TabsContent>
        </Tabs>

        {/* Recently Viewed */}
        <RecentlyViewed currentProductId={product.id} />

        {/* Related Products */}
        <RelatedProducts 
          products={relatedProducts} 
          onProductClick={(id) => router.push(`/shop/${id}`)}
        />
      </div>

      <StockAlert
        productId={product.id}
        productName={product.name}
        open={stockAlertOpen}
        onOpenChange={setStockAlertOpen}
      />
    </div>
  );
};

export default ProductDetail;
