import { cn } from '@/lib/utils';
import type { Product } from '@/data/mockProducts';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  className?: string;
}

export function ProductGrid({ products, onSelectProduct, className }: ProductGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4', className)}>
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onSelectProduct(product)}
          className="group bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 text-left"
        >
          {/* Product Icon/Image placeholder */}
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-gray-50 transition-colors">
            <span className="text-xl">📦</span>
          </div>

          {/* Product Name */}
          <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
            {product.name}
          </h3>

          {/* Size */}
          <p className="text-xs text-gray-500 mb-2">{product.size}</p>

          {/* Price */}
          <p className="font-semibold text-gray-900">${product.price}</p>
        </button>
      ))}
    </div>
  );
}

export default ProductGrid;
