import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CatalogTable, Column } from "@/components/admin/catalog/CatalogTable";
import { SearchFilter } from "@/components/admin/catalog/SearchFilter";
import { BulkActions } from "@/components/admin/catalog/BulkActions";
import { Product } from "@/types/catalog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const mockProducts: Product[] = [
  {
    id: "1",
    name: "OPI Nail Polish - Big Apple Red",
    sku: "OPI-BAR-001",
    vendor: "OPI",
    category: "Nail Polish",
    description: "Classic red nail polish",
    costPrice: 5,
    retailPrice: 12.99,
    taxable: true,
    trackInventory: true,
    stockQuantity: 45,
    lowStockThreshold: 10,
    allowBackorders: false,
    images: [],
    requiresShipping: true,
    collections: ["Best Sellers"],
    tags: ["red", "classic"],
    showOnline: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  useEffect(() => {
    const stored = localStorage.getItem("catalog_products");
    setProducts(stored ? JSON.parse(stored) : mockProducts);
  }, []);

  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem("catalog_products", JSON.stringify(updatedProducts));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchValue.toLowerCase());
    const matchesFilter = filterValue === "all" || 
      (filterValue === "in-stock" && product.stockQuantity > 0) ||
      (filterValue === "low-stock" && product.stockQuantity <= product.lowStockThreshold && product.stockQuantity > 0) ||
      (filterValue === "out-of-stock" && product.stockQuantity === 0);
    return matchesSearch && matchesFilter;
  });

  const columns: Column[] = [
    { key: "name", label: "Product" },
    { key: "sku", label: "SKU" },
    {
      key: "retailPrice",
      label: "Price",
      render: (value) => `$${value.toFixed(2)}`,
    },
    {
      key: "stockQuantity",
      label: "Inventory",
      render: (value, item) => (
        <Badge variant={value === 0 ? "destructive" : value <= item.lowStockThreshold ? "secondary" : "outline"}>
          {value} in stock
        </Badge>
      ),
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

  const handleDelete = (product: Product) => {
    saveProducts(products.filter((p) => p.id !== product.id));
    toast.success("Product deleted");
  };

  const handleBulkDelete = () => {
    saveProducts(products.filter((p) => !selectedItems.includes(p.id)));
    setSelectedItems([]);
    toast.success(`${selectedItems.length} products deleted`);
  };

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

      <CatalogTable
        columns={columns}
        data={filteredProducts}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onEdit={(product) => navigate(`/admin/catalog/products/${product.id}`)}
        onDelete={handleDelete}
      />
    </div>
  );
}
