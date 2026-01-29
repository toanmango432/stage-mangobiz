import { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  ShoppingBag,
  Copy,
  EyeOff,
  Eye,
  ChevronRight,
  Package,
  Barcode,
  Tag,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react';
import type { Product, CreateProductInput, InventoryLevel } from '@/types/inventory';
import type { CatalogViewMode } from '@/types/catalog';
import { formatPrice } from '../constants';
import { ProductModal } from '../modals/ProductModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProductCardSkeleton } from '../components/skeletons/ProductCardSkeleton';

interface ProductsSectionProps {
  products: Product[];
  productCategories: string[];
  viewMode: CatalogViewMode;
  searchQuery?: string;
  isLoading?: boolean;
  /** Inventory levels by product ID - enables low stock indicators */
  inventoryLevels?: Map<string, InventoryLevel>;
  onCreate?: (data: CreateProductInput) => Promise<Product | null>;
  onUpdate?: (id: string, data: Partial<Product>) => Promise<number | null>;
  onDelete?: (id: string) => Promise<boolean | null>;
  onArchive?: (id: string) => Promise<Product | null | undefined>;
}

export function ProductsSection({
  products,
  productCategories,
  viewMode,
  searchQuery = '',
  isLoading = false,
  inventoryLevels,
  onCreate,
  onUpdate,
  onDelete,
  onArchive,
}: ProductsSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter products
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Handle save product
  const handleSaveProduct = async (productData: CreateProductInput | Partial<Product>) => {
    if (editingProduct) {
      // Update existing
      if (onUpdate) {
        await onUpdate(editingProduct.id, productData);
      }
    } else {
      // Create new
      if (onCreate) {
        await onCreate(productData as CreateProductInput);
      }
    }
    setShowModal(false);
    setEditingProduct(undefined);
  };

  // Handle delete - opens confirmation dialog
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!productToDelete || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && onUpdate) {
      await onUpdate(productId, { isActive: !product.isActive });
    }
  };

  // Handle duplicate
  const handleDuplicate = async (product: Product) => {
    if (onCreate) {
      await onCreate({
        sku: `${product.sku}-COPY`,
        barcode: undefined,
        name: `${product.name} (Copy)`,
        brand: product.brand,
        category: product.category,
        description: product.description,
        retailPrice: product.retailPrice,
        costPrice: product.costPrice,
        isRetail: product.isRetail,
        isBackbar: product.isBackbar,
        minStockLevel: product.minStockLevel,
        supplierId: product.supplierId,
        imageUrl: product.imageUrl,
        size: product.size,
      });
    }
  };

  // Calculate margin
  const getMargin = (product: Product) => {
    if (product.retailPrice <= 0) return 0;
    return Math.round(((product.retailPrice - product.costPrice) / product.retailPrice) * 100);
  };

  // Check if product is low stock
  const isLowStock = (product: Product): boolean => {
    const level = inventoryLevels?.get(product.id);
    if (level) {
      // Use inventory level data if available
      return level.quantityAvailable < product.minStockLevel;
    }
    return false;
  };

  // Get stock quantity for display
  const getStockQuantity = (product: Product): number | undefined => {
    const level = inventoryLevels?.get(product.id);
    return level?.quantityAvailable;
  };

  // Render Skeleton Loading View
  const renderSkeletonView = () => (
    <div className="space-y-6">
      <div>
        <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );

  // Render Grid View
  const renderGridView = () => (
    <div className="space-y-6">
      {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-gray-500 mb-3">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryProducts.map((product) => {
              const margin = getMargin(product);

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
                    !product.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                          {!product.isActive && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full flex-shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>
                        {product.brand && (
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setExpandedMenuId(expandedMenuId === product.id ? null : product.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {expandedMenuId === product.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setShowModal(true);
                                  setExpandedMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit3 size={14} /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDuplicate(product);
                                  setExpandedMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Copy size={14} /> Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  handleToggleActive(product.id);
                                  setExpandedMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                {product.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                {product.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  handleDeleteClick(product);
                                  setExpandedMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SKU, Barcode, and Stock */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1" title="SKU">
                        <Tag size={14} />
                        {product.sku}
                      </span>
                      {product.barcode && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span className="flex items-center gap-1" title="Barcode">
                            <Barcode size={14} />
                            {product.barcode}
                          </span>
                        </>
                      )}
                      {product.size && (
                        <>
                          <span className="text-gray-400">|</span>
                          <span>{product.size}</span>
                        </>
                      )}
                    </div>

                    {/* Low Stock Warning */}
                    {isLowStock(product) && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium mb-3">
                        <AlertTriangle size={14} />
                        Low Stock ({getStockQuantity(product)} left)
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500">Cost: {formatPrice(product.costPrice)}</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(product.retailPrice)}</p>
                      </div>
                      <div className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                        {margin}% margin
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-3">
                      {product.isRetail && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex items-center gap-1">
                          <ShoppingCart size={12} /> Retail
                        </span>
                      )}
                      {product.isBackbar && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full flex items-center gap-1">
                          <Package size={12} /> Backbar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="space-y-2">
      {filteredProducts.map((product) => {
        const margin = getMargin(product);

        return (
          <div
            key={product.id}
            className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all ${
              !product.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={24} className="text-orange-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  {!product.isActive && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                  {isLowStock(product) && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Low Stock
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {product.brand ? `${product.brand} • ` : ''}{product.category}
                </p>
              </div>

              {/* SKU */}
              <div className="text-center px-4 hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{product.sku}</p>
                <p className="text-xs text-gray-500">SKU</p>
              </div>

              {/* Barcode */}
              {product.barcode && (
                <div className="text-center px-4 hidden lg:block">
                  <p className="text-sm font-medium text-gray-900">{product.barcode}</p>
                  <p className="text-xs text-gray-500">Barcode</p>
                </div>
              )}

              {/* Cost */}
              <div className="text-center px-4 hidden md:block">
                <p className="text-sm text-gray-500">{formatPrice(product.costPrice)}</p>
                <p className="text-xs text-gray-400">Cost</p>
              </div>

              {/* Retail Price */}
              <div className="text-center px-4">
                <p className="text-lg font-bold text-gray-900">{formatPrice(product.retailPrice)}</p>
                <p className="text-xs text-green-600 font-medium">{margin}% margin</p>
              </div>

              {/* Actions */}
              <div className="relative">
                <button
                  onClick={() => setExpandedMenuId(expandedMenuId === product.id ? null : product.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical size={18} />
                </button>
                {expandedMenuId === product.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExpandedMenuId(null)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowModal(true);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(product);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        onClick={() => {
                          handleToggleActive(product.id);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {product.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        {product.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          handleDeleteClick(product);
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage retail products and backbar inventory
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          renderSkeletonView()
        ) : filteredProducts.length > 0 ? (
          viewMode === 'grid' || viewMode === 'compact' ? renderGridView() : renderListView()
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">
              Add products to sell to your clients or track backbar inventory
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(undefined);
        }}
        product={editingProduct}
        categories={productCategories}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
