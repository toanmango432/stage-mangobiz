import { useState, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Check, Plus, X, ArrowRight, Clock, DollarSign } from "lucide-react";
import { storeAuthManager } from "@/services/storeAuthManager";
import { useCheckoutServices, type CheckoutService, type CheckoutServiceWithVariants } from "./hooks/useCheckoutServices";
import { VariantSelector } from "./VariantSelector";
import { AddOnSelector, type SelectedAddOn } from "./AddOnSelector";

// Re-export for backwards compatibility
export type Service = CheckoutService;

/**
 * Extended service selection including variant and add-on choices
 */
export interface ServiceSelection {
  service: CheckoutServiceWithVariants;
  variantId?: string;
  variantName?: string;
  selectedAddOns: SelectedAddOn[];
  /** Final price after variant and add-on selections */
  finalPrice: number;
  /** Final duration after variant and add-on selections */
  finalDuration: number;
}

export interface StaffMember {
  id: string;
  name: string;
}

interface ServiceGridProps {
  /** Legacy callback for simple service selection (without variants/add-ons) */
  onAddServices: (services: Service[], staffId?: string, staffName?: string) => void;
  /** New callback for service selection with variants and add-ons */
  onAddServiceWithSelection?: (selection: ServiceSelection, staffId?: string, staffName?: string) => void;
  staffMembers?: StaffMember[];
}

export default function ServiceGrid({ onAddServices, onAddServiceWithSelection, staffMembers = [] }: ServiceGridProps) {
  // Get storeId from auth state
  const storeId = storeAuthManager.getState().store?.storeId || '';

  // Load services and categories from catalog database
  const { services, categories, addOnGroupsByService, isLoading } = useCheckoutServices(storeId);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Variant/Add-on selection flow state
  const [selectionFlowService, setSelectionFlowService] = useState<CheckoutServiceWithVariants | null>(null);
  const [selectionFlowStep, setSelectionFlowStep] = useState<'variant' | 'addon' | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ id: string; price: number; duration: number; name: string } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCategory = false;
      if (selectedCategory === "All") {
        matchesCategory = true;
      } else if (selectedCategory === "Popular") {
        // For now, show first 6 services as "popular" (can be enhanced later with usage data)
        matchesCategory = services.indexOf(service) < 6;
      } else {
        matchesCategory = service.category === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  // Check if a service has variants or add-ons (needs selection flow)
  const serviceNeedsSelectionFlow = useCallback((serviceId: string): boolean => {
    const fullService = services.find(s => s.id === serviceId);
    if (!fullService) return false;
    const hasVariants = fullService.hasVariants && fullService.variants.length > 0;
    const hasAddOns = addOnGroupsByService.has(serviceId);
    return hasVariants || hasAddOns;
  }, [services, addOnGroupsByService]);

  // Start the variant/add-on selection flow
  const startSelectionFlow = useCallback((service: CheckoutServiceWithVariants) => {
    setSelectionFlowService(service);
    setSelectedVariant(null);
    setSelectedAddOns([]);

    // If service has variants, start with variant selection
    if (service.hasVariants && service.variants.length > 0) {
      setSelectionFlowStep('variant');
    } else {
      // No variants, check for add-ons
      const hasAddOns = addOnGroupsByService.has(service.id);
      if (hasAddOns) {
        setSelectionFlowStep('addon');
      } else {
        // No variants or add-ons, add directly (shouldn't happen if serviceNeedsSelectionFlow is used correctly)
        handleDirectAdd(service);
      }
    }
  }, [addOnGroupsByService]);

  // Handle direct add for services without variants/add-ons
  const handleDirectAdd = useCallback((service: CheckoutServiceWithVariants) => {
    if (onAddServiceWithSelection) {
      const selection: ServiceSelection = {
        service,
        selectedAddOns: [],
        finalPrice: service.effectivePrice,
        finalDuration: service.effectiveDuration,
      };
      const staff = staffMembers.find(s => s.id === selectedStaffId);
      onAddServiceWithSelection(selection, staff?.id, staff?.name);
    } else {
      // Legacy: add to selected services list
      const legacyService: Service = {
        id: service.id,
        name: service.name,
        category: service.categoryName,
        price: service.effectivePrice,
        duration: service.effectiveDuration,
      };
      setSelectedServices(prev => [...prev, legacyService]);
    }
  }, [onAddServiceWithSelection, staffMembers, selectedStaffId]);

  // Handle variant selection
  const handleVariantSelect = useCallback((variantId: string, price: number, duration: number) => {
    if (!selectionFlowService) return;
    const variant = selectionFlowService.variants.find(v => v.id === variantId);
    setSelectedVariant({
      id: variantId,
      price,
      duration,
      name: variant?.name || '',
    });
  }, [selectionFlowService]);

  // Proceed from variant to add-on selection
  const handleVariantContinue = useCallback(() => {
    if (!selectionFlowService) return;
    const hasAddOns = addOnGroupsByService.has(selectionFlowService.id);
    if (hasAddOns) {
      setSelectionFlowStep('addon');
    } else {
      // No add-ons, complete the selection
      completeSelectionFlow();
    }
  }, [selectionFlowService, addOnGroupsByService]);

  // Handle add-on selection changes
  const handleAddOnsChange = useCallback((addOns: SelectedAddOn[]) => {
    setSelectedAddOns(addOns);
  }, []);

  // Complete the selection flow and add to ticket
  const completeSelectionFlow = useCallback(() => {
    if (!selectionFlowService) return;

    const basePrice = selectedVariant?.price ?? selectionFlowService.effectivePrice;
    const baseDuration = selectedVariant?.duration ?? selectionFlowService.effectiveDuration;
    const addOnPrice = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
    const addOnDuration = selectedAddOns.reduce((sum, a) => sum + a.duration, 0);

    if (onAddServiceWithSelection) {
      const selection: ServiceSelection = {
        service: selectionFlowService,
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name,
        selectedAddOns,
        finalPrice: basePrice + addOnPrice,
        finalDuration: baseDuration + addOnDuration,
      };
      const staff = staffMembers.find(s => s.id === selectedStaffId);
      onAddServiceWithSelection(selection, staff?.id, staff?.name);
    } else {
      // Legacy: create a basic service with final totals
      const legacyService: Service = {
        id: selectionFlowService.id,
        name: selectedVariant?.name
          ? `${selectionFlowService.name} - ${selectedVariant.name}`
          : selectionFlowService.name,
        category: selectionFlowService.categoryName,
        price: basePrice + addOnPrice,
        duration: baseDuration + addOnDuration,
      };
      setSelectedServices(prev => [...prev, legacyService]);
    }

    // Close the selection flow
    closeSelectionFlow();
  }, [selectionFlowService, selectedVariant, selectedAddOns, onAddServiceWithSelection, staffMembers, selectedStaffId]);

  // Close the selection flow sheet
  const closeSelectionFlow = useCallback(() => {
    setSelectionFlowService(null);
    setSelectionFlowStep(null);
    setSelectedVariant(null);
    setSelectedAddOns([]);
  }, []);

  const toggleService = (service: CheckoutServiceWithVariants) => {
    // For services with variants or add-ons, start the selection flow
    if (serviceNeedsSelectionFlow(service.id)) {
      startSelectionFlow(service);
      return;
    }

    // For simple services without variants/add-ons, use existing toggle behavior
    const isSelected = selectedServices.some(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      handleDirectAdd(service);
    }
  };

  const handleAddServices = () => {
    if (selectedServices.length > 0) {
      const staff = staffMembers.find(s => s.id === selectedStaffId);
      onAddServices(selectedServices, staff?.id, staff?.name);
      setSelectedServices([]);
      setSelectedStaffId("");
    }
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Simple Search Bar */}
      <div className="flex-shrink-0 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="pl-10 pr-10 h-11 bg-muted/50 border-0"
            data-testid="input-search-service"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Simple Category Filters */}
      <div className="flex-shrink-0 mb-3 -mx-4 px-4">
        <ScrollArea className="w-full" type="scroll">
          <div className="flex gap-1 pb-1">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    px-3 py-1.5 text-sm whitespace-nowrap
                    ${isActive 
                      ? 'text-foreground font-medium border-b-2 border-primary' 
                      : 'text-muted-foreground'
                    }
                  `}
                  data-testid={`tab-category-${category.toLowerCase()}`}
                >
                  {category}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>
      </div>

      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3" />
            <p className="text-sm text-muted-foreground">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `No results for "${searchQuery}"` : "No services in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 pb-4">
            {filteredServices.map((service) => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              const hasVariants = service.hasVariants && service.variants.length > 0;
              const hasAddOns = addOnGroupsByService.has(service.id);

              return (
                <Card
                  key={service.id}
                  className={`
                    relative p-3.5 cursor-pointer
                    ${isSelected ? 'border-primary bg-primary/5' : ''}
                  `}
                  onClick={() => toggleService(service)}
                  data-testid={`card-service-${service.id}`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <h4 className="font-medium text-sm leading-snug mb-1 pr-5">
                    {service.name}
                  </h4>

                  {/* Show badges for variants/add-ons */}
                  {(hasVariants || hasAddOns) && (
                    <div className="flex gap-1 mb-1.5">
                      {hasVariants && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {service.variants.length} variants
                        </span>
                      )}
                      {hasAddOns && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          + Add-ons
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {service.duration}m
                    </span>
                    <span className="font-semibold">
                      {hasVariants ? (
                        <span>
                          from ${Math.min(...service.variants.map(v => v.price)).toFixed(0)}
                        </span>
                      ) : (
                        <span>${service.price}</span>
                      )}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Clean Action Bar */}
      {selectedServices.length > 0 && (
        <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 lg:relative lg:bottom-auto lg:mt-3 lg:border-t-0 lg:p-0 lg:bg-transparent">
          {/* Summary Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">${totalPrice.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{totalDuration} min total</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedServices([])}
              className="text-muted-foreground h-8"
              data-testid="button-clear-selection"
            >
              Clear
            </Button>
          </div>

          {/* Staff Assignment - Optional */}
          {staffMembers.length > 0 && (
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="h-11 text-sm mb-3" data-testid="select-staff-assignment">
                <SelectValue placeholder="Assign to staff member (optional)" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Add Button */}
          <Button
            className="w-full h-12"
            onClick={handleAddServices}
            data-testid="button-add-selected-services"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {selectedServices.length} {selectedServices.length === 1 ? 'Service' : 'Services'}
          </Button>
        </div>
      )}

      {/* Variant/Add-on Selection Flow Sheet */}
      <Sheet open={selectionFlowStep !== null} onOpenChange={(open) => !open && closeSelectionFlow()}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          {selectionFlowService && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="flex-shrink-0 p-4 border-b">
                <SheetTitle className="text-left">
                  {selectionFlowService.name}
                </SheetTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedVariant?.duration ?? selectionFlowService.effectiveDuration}m
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    ${(selectedVariant?.price ?? selectionFlowService.effectivePrice).toFixed(2)}
                  </span>
                </div>
              </SheetHeader>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Step indicator */}
                {selectionFlowService.hasVariants && selectionFlowService.variants.length > 0 && addOnGroupsByService.has(selectionFlowService.id) && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${selectionFlowStep === 'variant' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      1. Variant
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${selectionFlowStep === 'addon' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      2. Add-ons
                    </div>
                  </div>
                )}

                {/* Variant Selection Step */}
                {selectionFlowStep === 'variant' && (
                  <VariantSelector
                    service={selectionFlowService}
                    onSelect={handleVariantSelect}
                    initialVariantId={selectedVariant?.id}
                  />
                )}

                {/* Add-on Selection Step */}
                {selectionFlowStep === 'addon' && (
                  <AddOnSelector
                    serviceId={selectionFlowService.id}
                    categoryId={selectionFlowService.categoryId}
                    storeId={storeId}
                    onAddOnsChange={handleAddOnsChange}
                    initialSelectedIds={selectedAddOns.map(a => a.optionId)}
                  />
                )}
              </div>

              {/* Footer with running total and action button */}
              <div className="flex-shrink-0 p-4 border-t bg-background">
                {/* Running total */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="font-semibold text-lg">
                      ${(
                        (selectedVariant?.price ?? selectionFlowService.effectivePrice) +
                        selectedAddOns.reduce((sum, a) => sum + a.price, 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">
                      {(selectedVariant?.duration ?? selectionFlowService.effectiveDuration) +
                        selectedAddOns.reduce((sum, a) => sum + a.duration, 0)}m
                    </div>
                  </div>
                </div>

                {/* Selected add-ons summary */}
                {selectionFlowStep === 'addon' && selectedAddOns.length > 0 && (
                  <div className="mb-3 p-2 bg-muted rounded-md">
                    <div className="text-xs text-muted-foreground mb-1">Selected add-ons:</div>
                    <div className="text-sm">
                      {selectedAddOns.map(a => a.name).join(', ')}
                    </div>
                  </div>
                )}

                {/* Action button */}
                {selectionFlowStep === 'variant' ? (
                  <Button
                    className="w-full h-12"
                    onClick={handleVariantContinue}
                    disabled={!selectedVariant && selectionFlowService.hasVariants && selectionFlowService.variants.length > 0}
                  >
                    {addOnGroupsByService.has(selectionFlowService.id) ? (
                      <>
                        Continue to Add-ons
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Ticket
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-12"
                    onClick={completeSelectionFlow}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Ticket
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
