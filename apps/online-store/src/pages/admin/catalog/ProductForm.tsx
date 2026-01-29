import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types/catalog";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { getProductById, createProduct, updateProduct } from "@/lib/services/catalogSyncService";
import { useStoreContext } from "@/hooks/useStoreContext";

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { storeId, tenantId } = useStoreContext();
  const isNew = id === "new";

  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    sku: "",
    vendor: "",
    category: "",
    description: "",
    costPrice: 0,
    retailPrice: 0,
    taxable: true,
    trackInventory: false,
    stockQuantity: 0,
    lowStockThreshold: 5,
    allowBackorders: false,
    showOnline: true,
    featured: false,
    images: [],
    collections: [],
    tags: [],
  });

  const [isLoadingProduct, setIsLoadingProduct] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing product when editing
  useEffect(() => {
    if (isNew) return;
    const loadProduct = async () => {
      try {
        const product = await getProductById(id!);
        if (product) {
          setFormData(product);
        } else {
          toast.error("Product not found");
          navigate("/admin/catalog/products");
        }
      } catch (error) {
        console.error("Failed to load product:", error);
        toast.error("Failed to load product");
      } finally {
        setIsLoadingProduct(false);
      }
    };
    loadProduct();
  }, [id, isNew, navigate]);

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please enter a product name");
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        await createProduct(storeId, tenantId, formData as Omit<Product, "id" | "createdAt" | "updatedAt">);
        toast.success("Product created");
      } else {
        await updateProduct(id!, formData);
        toast.success("Product updated");
      }
      navigate("/admin/catalog/products");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save product";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/catalog/products")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{isNew ? "New Product" : "Edit Product"}</h1>
          <p className="text-muted-foreground">Configure product details</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential product details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Keratin Treatment Kit"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., KTK-001"
                />
              </div>
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="e.g., Professional Hair Co."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Hair Care"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the product..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set cost and retail pricing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="retailPrice">Retail Price ($) *</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Taxable</Label>
                <p className="text-sm text-muted-foreground">Apply tax to this product</p>
              </div>
              <Switch
                checked={formData.taxable}
                onCheckedChange={(checked) => setFormData({ ...formData, taxable: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Track stock levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Track Inventory</Label>
                <p className="text-sm text-muted-foreground">Enable stock tracking for this product</p>
              </div>
              <Switch
                checked={formData.trackInventory}
                onCheckedChange={(checked) => setFormData({ ...formData, trackInventory: checked })}
              />
            </div>

            {formData.trackInventory && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            {formData.trackInventory && (
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Backorders</Label>
                  <p className="text-sm text-muted-foreground">Allow orders when out of stock</p>
                </div>
                <Switch
                  checked={formData.allowBackorders}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowBackorders: checked })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
            <CardDescription>Control online display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Online</Label>
                <p className="text-sm text-muted-foreground">Display this product in the online store</p>
              </div>
              <Switch
                checked={formData.showOnline}
                onCheckedChange={(checked) => setFormData({ ...formData, showOnline: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Featured</Label>
                <p className="text-sm text-muted-foreground">Highlight this product on the storefront</p>
              </div>
              <Switch
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Product
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => navigate("/admin/catalog/products")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
