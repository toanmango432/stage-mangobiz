import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ProductFilters } from "@/lib/utils/productHelpers";

interface FilterChipsProps {
  filters: ProductFilters;
  onRemoveFilter: (filterType: keyof ProductFilters, value?: string) => void;
  maxPrice: number;
}

export const FilterChips = ({ filters, onRemoveFilter, maxPrice }: FilterChipsProps) => {
  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.priceMin > 0 ||
    filters.priceMax < maxPrice ||
    filters.inStockOnly ||
    filters.searchQuery;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.categories.map(category => (
        <Badge key={category} variant="secondary" className="gap-1">
          {category}
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter('categories', category)}
          />
        </Badge>
      ))}
      
      {(filters.priceMin > 0 || filters.priceMax < maxPrice) && (
        <Badge variant="secondary" className="gap-1">
          ${filters.priceMin} - ${filters.priceMax}
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => {
              onRemoveFilter('priceMin');
              onRemoveFilter('priceMax');
            }}
          />
        </Badge>
      )}
      
      {filters.inStockOnly && (
        <Badge variant="secondary" className="gap-1">
          In Stock Only
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter('inStockOnly')}
          />
        </Badge>
      )}

      {filters.searchQuery && (
        <Badge variant="secondary" className="gap-1">
          Search: "{filters.searchQuery}"
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter('searchQuery')}
          />
        </Badge>
      )}
    </div>
  );
};
