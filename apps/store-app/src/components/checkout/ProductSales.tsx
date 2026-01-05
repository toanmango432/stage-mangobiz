import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Search, Plus, Minus, Check, PackageX } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sku: string;
  inStock: boolean;
  stockQuantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductSalesProps {
  onAddProducts: (items: { productId: string; name: string; price: number; quantity: number }[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MOCK_PRODUCTS: Product[] = [
  { id: "prod-1", name: "Professional Shampoo 16oz", price: 28.00, category: "Hair Care", sku: "SH-001", inStock: true, stockQuantity: 24 },
  { id: "prod-2", name: "Deep Conditioner 12oz", price: 32.00, category: "Hair Care", sku: "CD-001", inStock: true, stockQuantity: 18 },
  { id: "prod-3", name: "Styling Gel 8oz", price: 18.00, category: "Styling", sku: "ST-001", inStock: true, stockQuantity: 35 },
  { id: "prod-4", name: "Heat Protectant Spray", price: 24.00, category: "Styling", sku: "ST-002", inStock: true, stockQuantity: 22 },
  { id: "prod-5", name: "Hair Oil Treatment", price: 45.00, category: "Treatments", sku: "TR-001", inStock: true, stockQuantity: 12 },
  { id: "prod-6", name: "Leave-In Conditioner", price: 26.00, category: "Hair Care", sku: "CD-002", inStock: true, stockQuantity: 15 },
  { id: "prod-7", name: "Volumizing Mousse", price: 22.00, category: "Styling", sku: "ST-003", inStock: true, stockQuantity: 28 },
  { id: "prod-8", name: "Nail Polish Set", price: 35.00, category: "Nails", sku: "NL-001", inStock: true, stockQuantity: 20 },
  { id: "prod-9", name: "Cuticle Oil", price: 12.00, category: "Nails", sku: "NL-002", inStock: true, stockQuantity: 42 },
  { id: "prod-10", name: "Facial Moisturizer", price: 48.00, category: "Skincare", sku: "SK-001", inStock: true, stockQuantity: 16 },
  { id: "prod-11", name: "Eye Cream", price: 55.00, category: "Skincare", sku: "SK-002", inStock: true, stockQuantity: 10 },
  { id: "prod-12", name: "Hair Mask Treatment", price: 38.00, category: "Treatments", sku: "TR-002", inStock: false, stockQuantity: 0 },
];

function ProductSkeletonCard() {
  return (
    <Card>
      <CardContent className="p-3 sm:p-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="py-3 sm:py-4 space-y-4 sm:space-y-6">
      <div>
        <Skeleton className="h-4 w-24 mb-2 sm:mb-3" />
        <div className="grid gap-2 sm:gap-2">
          <ProductSkeletonCard />
          <ProductSkeletonCard />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-20 mb-2 sm:mb-3" />
        <div className="grid gap-2 sm:gap-2">
          <ProductSkeletonCard />
          <ProductSkeletonCard />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-28 mb-2 sm:mb-3" />
        <div className="grid gap-2 sm:gap-2">
          <ProductSkeletonCard />
          <ProductSkeletonCard />
        </div>
      </div>
    </div>
  );
}

function EmptySearchState() {
  return (
    <div className="py-12 text-center text-muted-foreground" data-testid="empty-search-products">
      <PackageX className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>No products found</p>
      <p className="text-sm">Try a different search term</p>
    </div>
  );
}

function EmptyProductsState() {
  return (
    <div className="py-12 text-center text-muted-foreground" data-testid="empty-products">
      <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>No products available</p>
      <p className="text-sm">Check back later or contact support</p>
    </div>
  );
}


export default function ProductSales({
  onAddProducts,
  open,
  onOpenChange,
}: ProductSalesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setProducts(MOCK_PRODUCTS);
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setProducts([]);
      setIsLoading(true);
    }
  }, [open]);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const getCartQuantity = (productId: string) => {
    return cart.find((item) => item.product.id === productId)?.quantity || 0;
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToTicket = () => {
    onAddProducts(
      cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      }))
    );
    setCart([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setCart([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingState />;
    }

    if (products.length === 0) {
      return <EmptyProductsState />;
    }

    if (filteredProducts.length === 0) {
      return <EmptySearchState />;
    }

    return (
      <div className="py-3 sm:py-4 space-y-4 sm:space-y-6">
        {categories.map((category) => {
          const categoryProducts = filteredProducts.filter(
            (p) => p.category === category
          );
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                {category}
              </h3>
              <div className="grid gap-2 sm:gap-2">
                {categoryProducts.map((product) => {
                  const quantity = getCartQuantity(product.id);
                  const isInCart = quantity > 0;

                  return (
                    <Card
                      key={product.id}
                      className={`transition-all ${
                        isInCart ? "border-primary/50 bg-primary/5" : ""
                      } ${!product.inStock ? "opacity-50" : "hover-elevate active-elevate-2 cursor-pointer"}`}
                      onClick={() => product.inStock && addToCart(product)}
                      data-testid={`card-product-${product.id}`}
                    >
                      <CardContent className="p-3 sm:p-3">
                        <div className="flex items-center justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-sm truncate">
                                {product.name}
                              </h4>
                              {!product.inStock && (
                                <Badge variant="secondary" className="text-xs">
                                  Out of Stock
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>SKU: {product.sku}</span>
                              {product.inStock && (
                                <span className="hidden sm:inline">({product.stockQuantity} in stock)</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <span className="font-medium text-sm">
                              ${product.price.toFixed(2)}
                            </span>

                            {isInCart ? (
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 sm:h-7 sm:w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromCart(product.id);
                                  }}
                                  data-testid={`button-remove-${product.id}`}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-6 text-center font-medium text-sm">
                                  {quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 sm:h-7 sm:w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product);
                                  }}
                                  disabled={quantity >= product.stockQuantity}
                                  data-testid={`button-add-${product.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              product.inStock && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 sm:h-7 sm:w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product);
                                  }}
                                  data-testid={`button-quick-add-${product.id}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleClose}
      title={
        <>
          <ShoppingBag className="h-5 w-5" />
          Add Products
        </>
      }
      description="Select products to add to the ticket"
    >
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 sm:h-10"
            data-testid="input-search-products"
            disabled={isLoading}
          />
        </div>
      </div>

      <ResponsiveDialogBody className="px-4 sm:px-6">
        {renderContent()}
      </ResponsiveDialogBody>

      <ResponsiveDialogFooter className="px-4 sm:px-6 py-3 sm:py-4 bg-muted/30">
        {cart.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {cartItemCount} item{cartItemCount !== 1 ? "s" : ""} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setCart([])}
                data-testid="button-clear-cart"
              >
                Clear All
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12 sm:h-10"
                onClick={handleClose}
                data-testid="button-cancel-products"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 sm:h-10"
                onClick={handleAddToTicket}
                data-testid="button-add-products-to-ticket"
              >
                <Check className="h-4 w-4 mr-2" />
                Add ${cartTotal.toFixed(2)}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-12 sm:h-10"
            onClick={handleClose}
            data-testid="button-close-products"
          >
            Close
          </Button>
        )}
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  );
}
