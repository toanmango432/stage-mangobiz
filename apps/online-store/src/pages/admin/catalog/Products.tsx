import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { CatalogTable, Column } from "@/components/admin/catalog/CatalogTable";
import { SearchFilter } from "@/components/admin/catalog/SearchFilter";
import { BulkActions } from "@/components/admin/catalog/BulkActions";
import { Product } from "@/types/catalog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct } from "@/lib/services/catalogSyncService";
import { useStoreContext } from "@/hooks/useStoreContext";

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { storeId } = useStoreContext();

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loaded = await getProducts(storeId);
      setProducts(loaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load products";
      setError(message);
      toast.error(message);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (product.sku || "").toLowerCase().includes(searchValue.toLowerCase());
    const matchesFilter = filterValue === "all" ||
      (filterValue === "in-stock" && product.stockQuantity > 0) ||
      (filterValue === "low-stock" && product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0) ||
      (filterValue === "out-of-stock" && product.stockQuantity === 0);
    return matchesSearch && matchesFilter;
  });

  const columns: Column<Product>[] = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    {
      key: "retailPrice",
      label: "Price",
      render: (value) => `$${Number(value ?? 0).toFixed(2)}`,
    },
    {
      key: "stockQuantity",
      label: "Inventory",
      render: (value, item) => {
        const qty = Number(value ?? 0);
        return (
          <Badge variant={qty === 0 ? "destructive" : qty <= item.lowStockThreshold ? "secondary" : "outline"}>
            {qty} in stock
          </Badge>
        );
      },
    },
    { key: "category", label: "Category" },
  ];

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? filteredProducts.map((p) => p.id) : []);
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted");
      await loadProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
      toast.error(message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedItems.map((id) => deleteProduct(id)));
      setSelectedItems([]);
      toast.success(`${selectedItems.length} products deleted`);
      await loadProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete products";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your retail products</p>
          </div>
        </div>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={loadProducts}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your retail products</p>
        </div>
        <Button onClick={() => navigate("/admin/catalog/products/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={[
          { label: "In Stock", value: "in-stock" },
          { label: "Low Stock", value: "low-stock" },
          { label: "Out of Stock", value: "out-of-stock" },
        ]}
        filterLabel="Stock Status"
      />

      <BulkActions
        selectedCount={selectedItems.length}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedItems([])}
      />

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No products yet</p>
          <Button onClick={() => navigate("/admin/catalog/products/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <CatalogTable
          columns={columns}
          data={filteredProducts}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          onEdit={(product) => navigate(`/admin/catalog/products/${product.id}`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
