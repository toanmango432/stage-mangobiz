import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, DollarSign, Barcode } from 'lucide-react';
import type { Product, CreateProductInput } from '@/types/inventory';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  categories: string[];
  onSave: (data: CreateProductInput | Partial<Product>) => void;
}

const DEFAULT_CATEGORIES = ['Hair Care', 'Styling', 'Skincare', 'Nails', 'Treatments', 'Accessories'];

export function ProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
}: ProductModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [description, setDescription] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [size, setSize] = useState('');
  const [isRetail, setIsRetail] = useState(true);
  const [isBackbar, setIsBackbar] = useState(false);
  const [minStockLevel, setMinStockLevel] = useState('10');

  // Available categories (merge existing with defaults)
  const allCategories = useMemo(() => {
    const merged = new Set([...DEFAULT_CATEGORIES, ...categories]);
    return Array.from(merged).sort();
  }, [categories]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setName(product.name);
        setBrand(product.brand || '');
        setSku(product.sku);
        setBarcode(product.barcode || '');
        setCategory(product.category);
        setNewCategory('');
        setDescription(product.description || '');
        setRetailPrice(product.retailPrice.toString());
        setCostPrice(product.costPrice.toString());
        setSize(product.size || '');
        setIsRetail(product.isRetail);
        setIsBackbar(product.isBackbar);
        setMinStockLevel(product.minStockLevel.toString());
      } else {
        setName('');
        setBrand('');
        setSku('');
        setBarcode('');
        setCategory(allCategories[0] || '');
        setNewCategory('');
        setDescription('');
        setRetailPrice('');
        setCostPrice('');
        setSize('');
        setIsRetail(true);
        setIsBackbar(false);
        setMinStockLevel('10');
      }
    }
  }, [isOpen, product, allCategories]);

  // Calculate margin
  const margin = useMemo(() => {
    const retail = parseFloat(retailPrice) || 0;
    const cost = parseFloat(costPrice) || 0;
    if (retail <= 0) return 0;
    return Math.round(((retail - cost) / retail) * 100);
  }, [retailPrice, costPrice]);

  // Handle save
  const handleSave = () => {
    if (!name.trim() || !sku.trim()) return;

    const selectedCategory = newCategory.trim() || category;

    const data: CreateProductInput = {
      name: name.trim(),
      brand: brand.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      category: selectedCategory,
      description: description.trim() || undefined,
      retailPrice: parseFloat(retailPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      size: size.trim() || undefined,
      isRetail,
      isBackbar,
      minStockLevel: parseInt(minStockLevel) || 0,
    };

    onSave(data);
  };

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, name, sku, retailPrice, costPrice, category]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {product ? 'Edit Product' : 'New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center">
              <ShoppingBag size={28} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{name || 'Product Name'}</p>
              <p className="text-sm text-gray-500">{brand || 'Brand'} • {sku || 'SKU'}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">${retailPrice || '0.00'}</p>
              <p className="text-xs text-green-600">{margin}% margin</p>
            </div>
          </div>
        </div>

        {/* Form - Scrollable */}
        <div className="px-6 pb-6 space-y-5 overflow-auto flex-1">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Professional Shampoo"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Brand and SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g., Kerastase"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                SKU <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="SH-001"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="mt-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Or type a new category..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Retail Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cost Price
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Size and Min Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Size/Volume
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g., 16 oz"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Min Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRetail}
                  onChange={(e) => setIsRetail(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Retail (for sale)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBackbar}
                  onChange={(e) => setIsBackbar(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Backbar (used in services)</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description..."
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !sku.trim()}
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
