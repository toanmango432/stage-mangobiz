import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ProductFilters } from "@/lib/utils/productHelpers";
import { Badge } from "@/components/ui/badge";

interface FilterDrawerProps {
  filters: ProductFilters;
  onFiltersChange: (filters: Partial<ProductFilters>) => void;
  categories: string[];
  maxPrice: number;
  activeFilterCount: number;
}

export const FilterDrawer = ({ filters, onFiltersChange, categories, maxPrice, activeFilterCount }: FilterDrawerProps) => {
  const handleCategoryToggle = (category: string) => {
    const updated = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ categories: updated });
  };

  const handleClearAll = () => {
    onFiltersChange({
      priceMin: 0,
      priceMax: maxPrice,
      categories: [],
      inStockOnly: false,
      minRating: 0,
      searchQuery: '',
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-2 px-1.5 py-0.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          <Accordion type="multiple" defaultValue={["price", "category", "stock"]} className="w-full">
            <AccordionItem value="price">
              <AccordionTrigger>Price Range</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <Slider
                  value={[filters.priceMin, filters.priceMax]}
                  min={0}
                  max={maxPrice}
                  step={5}
                  onValueChange={([min, max]) => onFiltersChange({ priceMin: min, priceMax: max })}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>${filters.priceMin}</span>
                  <span>${filters.priceMax}</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="category">
              <AccordionTrigger>Category</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {categories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mobile-category-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label
                      htmlFor={`mobile-category-${category}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="stock">
              <AccordionTrigger>Availability</AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-in-stock" className="text-sm font-normal">
                    In Stock Only
                  </Label>
                  <Switch
                    id="mobile-in-stock"
                    checked={filters.inStockOnly}
                    onCheckedChange={(checked) => onFiltersChange({ inStockOnly: checked })}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={handleClearAll} className="flex-1">
            Clear All
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
