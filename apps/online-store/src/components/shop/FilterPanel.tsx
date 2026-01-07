import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ProductFilters } from "@/lib/utils/productHelpers";

interface FilterPanelProps {
  filters: ProductFilters;
  onFiltersChange: (filters: Partial<ProductFilters>) => void;
  categories: string[];
  maxPrice: number;
}

export const FilterPanel = ({ filters, onFiltersChange, categories, maxPrice }: FilterPanelProps) => {
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
    <div className="w-64 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleClearAll}>
          Clear All
        </Button>
      </div>

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
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
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
              <Label htmlFor="in-stock" className="text-sm font-normal">
                In Stock Only
              </Label>
              <Switch
                id="in-stock"
                checked={filters.inStockOnly}
                onCheckedChange={(checked) => onFiltersChange({ inStockOnly: checked })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
