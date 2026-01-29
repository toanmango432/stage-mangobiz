/**
 * ServiceCatalog - Service selection grid with category tabs and search
 *
 * @see US-061 - Variant selector integration for booking
 * @see US-062 - Availability badges and disabled services
 */

import { useState, useCallback } from 'react';
import { Search, User, CheckCircle2, AlertCircle, Clock, DollarSign, Check, ChevronRight, X, Globe, Store, Ban, Droplet } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Service, BookingGuest, BookingAvailability } from './types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ServiceCatalogProps {
  services: Service[];
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  serviceSearch: string;
  onServiceSearchChange: (search: string) => void;
  filteredServices: Service[];
  activeStaffId: string | null;
  activeStaffName: string | null;
  /** Called when adding a service - includes variant selection if applicable */
  onAddService: (service: Service, variantSelection?: { variantId: string; variantName: string; price: number; duration: number }) => void;
  onGoToStaffTab: () => void;
  justAddedService: string | null;
  bookingMode: 'individual' | 'group';
  groupStep: 'guests' | 'services';
  activeGuestId: string | null;
  bookingGuests: BookingGuest[];
}

/**
 * Check if a service is disabled for booking (in-store context)
 * Services with bookingAvailability='disabled' cannot be booked
 */
function isServiceDisabled(service: Service): boolean {
  return service.bookingAvailability === 'disabled';
}

/**
 * Get availability badge info for a service
 */
function getAvailabilityBadge(service: Service): { label: string; icon: React.ReactNode; colorClass: string } | null {
  switch (service.bookingAvailability) {
    case 'online':
      return {
        label: 'Online Only',
        icon: <Globe className="h-2.5 w-2.5" />,
        colorClass: 'bg-blue-100 text-blue-700',
      };
    case 'in-store':
      return {
        label: 'In-Store Only',
        icon: <Store className="h-2.5 w-2.5" />,
        colorClass: 'bg-purple-100 text-purple-700',
      };
    case 'disabled':
      return {
        label: 'Unavailable',
        icon: <Ban className="h-2.5 w-2.5" />,
        colorClass: 'bg-gray-100 text-gray-500',
      };
    default:
      // 'both' or undefined - no badge needed
      return null;
  }
}

export function ServiceCatalog({
  categories,
  selectedCategory,
  onCategoryChange,
  serviceSearch,
  onServiceSearchChange,
  filteredServices,
  activeStaffId,
  activeStaffName,
  onAddService,
  onGoToStaffTab,
  justAddedService,
  bookingMode,
  groupStep,
  activeGuestId,
  bookingGuests,
}: ServiceCatalogProps) {
  const activeGuest = bookingGuests.find(g => g.id === activeGuestId);

  // Variant selection state
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [selectedServiceForVariant, setSelectedServiceForVariant] = useState<Service | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  /**
   * Handle service card click - opens variant selector if service has variants
   * Disabled services (bookingAvailability='disabled') cannot be clicked
   */
  const handleServiceClick = useCallback((service: Service) => {
    // Prevent selecting disabled services
    if (isServiceDisabled(service)) {
      return;
    }

    if (service.hasVariants && service.variants && service.variants.length > 0) {
      // Service has variants - open variant selection sheet
      setSelectedServiceForVariant(service);
      // Pre-select default variant or first variant
      const defaultVariant = service.variants.find(v => v.isDefault) || service.variants[0];
      setSelectedVariantId(defaultVariant?.id || null);
      setVariantSheetOpen(true);
    } else {
      // No variants - add service directly
      onAddService(service);
    }
  }, [onAddService]);

  /**
   * Handle variant selection confirmation
   */
  const handleVariantConfirm = useCallback(() => {
    if (!selectedServiceForVariant || !selectedVariantId) return;

    const variant = selectedServiceForVariant.variants?.find(v => v.id === selectedVariantId);
    if (variant) {
      onAddService(selectedServiceForVariant, {
        variantId: variant.id,
        variantName: variant.name,
        price: variant.price,
        duration: variant.duration,
      });
    }

    // Reset state and close sheet
    setVariantSheetOpen(false);
    setSelectedServiceForVariant(null);
    setSelectedVariantId(null);
  }, [selectedServiceForVariant, selectedVariantId, onAddService]);

  /**
   * Close variant sheet and reset state
   */
  const handleVariantSheetClose = useCallback(() => {
    setVariantSheetOpen(false);
    setSelectedServiceForVariant(null);
    setSelectedVariantId(null);
  }, []);

  // Get currently selected variant details
  const selectedVariant = selectedServiceForVariant?.variants?.find(v => v.id === selectedVariantId);

  return (
    <div className="space-y-3">
      {/* Staff indicator */}
      {activeStaffName && (
        <div className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-xs text-amber-900 flex-1">
            {bookingMode === 'group' && groupStep === 'services' && activeGuestId ? (
              <>
                Adding to: <span className="font-semibold">{activeGuest?.name}</span>
                <span className="text-amber-700"> with {activeStaffName}</span>
              </>
            ) : (
              <>
                Adding to: <span className="font-semibold">{activeStaffName}</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* No staff selected warning */}
      {!activeStaffId && (
        <div className="px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-blue-900 font-medium">Select a staff member first</p>
            <button
              onClick={onGoToStaffTab}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 hover:underline"
            >
              Go to Staff tab →
            </button>
          </div>
        </div>
      )}

      {/* Search + Categories */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={serviceSearch}
            onChange={(e) => onServiceSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all',
                selectedCategory === cat
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Service Grid */}
      {bookingMode === 'group' && groupStep === 'services' && !activeGuestId ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
            <User className="w-7 h-7 text-amber-600" />
          </div>
          <p className="text-sm text-gray-700 mb-2 font-medium">Select a guest first</p>
          <p className="text-xs text-gray-500">Choose which guest to add services for</p>
        </div>
      ) : activeStaffId ? (
        <div className="grid grid-cols-3 gap-2">
          {filteredServices.map(service => {
            const disabled = isServiceDisabled(service);
            const availabilityBadge = getAvailabilityBadge(service);

            return (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service)}
                disabled={disabled}
                className={cn(
                  'text-left p-2.5 rounded-lg transition-all text-xs relative overflow-hidden group',
                  disabled
                    ? 'bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border border-gray-200 hover:border-brand-500 hover:shadow-md hover:scale-[1.03] active:scale-[0.97]',
                  justAddedService === service.id && !disabled && 'ring-2 ring-brand-500 border-brand-500'
                )}
                aria-disabled={disabled}
              >
                {justAddedService === service.id && !disabled && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                  </div>
                )}

                {/* Availability badge - top right corner when NOT just added */}
                {availabilityBadge && justAddedService !== service.id && (
                  <div className="absolute top-1 right-1">
                    <span className={cn(
                      'text-[8px] px-1 py-0.5 rounded font-medium flex items-center gap-0.5',
                      availabilityBadge.colorClass
                    )}>
                      {availabilityBadge.icon}
                      {availabilityBadge.label}
                    </span>
                  </div>
                )}

                <p className={cn(
                  'font-medium mb-1.5 line-clamp-2 leading-tight pr-4',
                  disabled ? 'text-gray-500' : 'text-gray-900'
                )}>
                  {service.name}
                </p>

                {/* Requires Patch Test warning */}
                {service.requiresPatchTest && (
                  <div className="flex items-center gap-1 mb-1">
                    <Droplet className="h-2.5 w-2.5 text-orange-500" />
                    <span className="text-[9px] text-orange-600 font-medium">Requires Patch Test</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-[10px]',
                    disabled ? 'text-gray-400' : 'text-gray-500'
                  )}>
                    {service.duration}m
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Show "from" prefix if service has variants */}
                    {service.hasVariants && service.variants && service.variants.length > 0 && (
                      <span className="text-[9px] text-gray-400">from</span>
                    )}
                    <span className={cn(
                      'font-bold',
                      disabled ? 'text-gray-500' : 'text-gray-900'
                    )}>
                      ${service.price}
                    </span>
                  </div>
                </div>

                {/* Variant badge - bottom right, only if not showing availability badge */}
                {service.hasVariants && service.variants && service.variants.length > 0 && !disabled && (
                  <div className="absolute bottom-1 right-1">
                    <span className="text-[8px] bg-brand-100 text-brand-700 px-1 py-0.5 rounded font-medium">
                      {service.variants.length} options
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mb-2">Select a staff member first</p>
          <button
            onClick={onGoToStaffTab}
            className="text-sm text-brand-600 font-medium hover:underline"
          >
            Go to Staff →
          </button>
        </div>
      )}

      {/* Variant Selection Sheet */}
      <Sheet open={variantSheetOpen} onOpenChange={setVariantSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl">
          {selectedServiceForVariant && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-lg font-semibold">
                      {selectedServiceForVariant.name}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select an option
                    </p>
                  </div>
                  <button
                    onClick={handleVariantSheetClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </SheetHeader>

              <div className="py-4 space-y-2 overflow-y-auto max-h-[40vh]">
                {selectedServiceForVariant.variants?.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedVariantId === variant.id
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {variant.name}
                          </span>
                          {variant.isDefault && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {variant.duration}m
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${variant.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {selectedVariantId === variant.id && (
                        <div className="ml-2 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer with confirm button */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Selected option:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedVariant ? (
                      <>
                        {selectedVariant.name} - ${selectedVariant.price.toFixed(2)} ({selectedVariant.duration}m)
                      </>
                    ) : (
                      'None selected'
                    )}
                  </span>
                </div>
                <button
                  onClick={handleVariantConfirm}
                  disabled={!selectedVariantId}
                  className={cn(
                    'w-full py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2',
                    selectedVariantId
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Add to Appointment
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
