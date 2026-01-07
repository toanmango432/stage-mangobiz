import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Product } from '@/types/catalog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ExternalLink } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { VariantSelector } from './VariantSelector';

interface QuickViewModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickViewModal = ({ product, open, onOpenChange }: QuickViewModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (!product) return null;

  const currentPrice = selectedVariant?.price || product.retailPrice;
  const inStock = selectedVariant ? selectedVariant.stockQuantity > 0 : product.stockQuantity > 0;

  const handleAddToCart = () => {
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
    toast.success(`Added ${product.name} to cart`);
    onOpenChange(false);
    setQuantity(1);
  };

  const handleViewDetails = () => {
    navigate(`/shop/${product.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Quick View: {product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-bold text-primary">
                  ${currentPrice.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground line-clamp-3">
              {product.description}
            </p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && selectedVariant && (
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
              />
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!inStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
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

            {/* Actions */}
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleViewDetails}
              >
                View Full Details
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {inStock && (
              <Badge variant="secondary" className="w-fit">
                In Stock
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);
