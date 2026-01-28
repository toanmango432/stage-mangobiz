import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/catalog";
import { Heart, Eye } from "lucide-react";
import { useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { QuickViewModal } from "./shop/QuickViewModal";
import { calculateDiscount } from "@/lib/utils/productHelpers";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  
  const inStock = product.stockQuantity > 0;
  const inWishlist = isInWishlist(product.id);
  const discount = calculateDiscount(product.retailPrice, product.compareAtPrice);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product.id);
      toast.success('Added to wishlist');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inStock) return;
    
    addToCart({
      id: product.id,
      type: 'product',
      name: product.name,
      price: product.retailPrice,
      quantity: 1,
      image: product.images[0],
      sku: product.sku,
      inStock,
    });
    toast.success(`Added ${product.name} to cart`);
  };
  return (
    <>
      <Card 
        className="overflow-hidden shadow-card hover:shadow-elevated transition-all group cursor-pointer"
        onClick={onClick}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Wishlist & Quick View buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current text-primary' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full shadow-lg"
              onClick={handleQuickView}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Sale badge */}
          {discount > 0 && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              {discount}% OFF
            </Badge>
          )}
        </div>
        
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold line-clamp-2 text-sm">{product.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">${product.retailPrice.toFixed(2)}</span>
              {product.compareAtPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            {inStock ? (
              <Badge variant="secondary" className="text-xs">In Stock</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
            )}
          </div>
          <Button 
            onClick={handleAddToCart} 
            disabled={!inStock}
            className="w-full"
          >
            Add to Cart
          </Button>
        </CardContent>
      </Card>

      <QuickViewModal
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  );
};
