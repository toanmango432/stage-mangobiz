import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Clock, DollarSign, ShoppingBag } from 'lucide-react';
import type { BookingService } from '../types/booking.types';
import { TimeUtils } from '../utils/timeUtils';

interface CartProps {
  open: boolean;
  onClose: () => void;
  services: BookingService[];
  onRemoveService: (serviceId: string) => void;
  onCheckout: () => void;
}

export const Cart: React.FC<CartProps> = ({
  open,
  onClose,
  services,
  onRemoveService,
  onCheckout,
}) => {
  // Calculate totals
  const totalPrice = services.reduce((sum, service) => {
    let price = service.price;
    
    // Add add-on prices
    if (service.selectedAddOns && service.addOns) {
      service.selectedAddOns.forEach(selected => {
        const addOn = service.addOns!.find(a => a.id === selected.id);
        if (addOn) {
          price += addOn.price * selected.quantity;
        }
      });
    }
    
    return sum + price;
  }, 0);

  const totalDuration = services.reduce((sum, service) => {
    let duration = service.duration;
    
    // Add add-on durations
    if (service.selectedAddOns && service.addOns) {
      service.selectedAddOns.forEach(selected => {
        const addOn = service.addOns!.find(a => a.id === selected.id);
        if (addOn) {
          duration += addOn.duration * selected.quantity;
        }
      });
    }
    
    return sum + duration;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Services
          </SheetTitle>
          <SheetDescription>
            {services.length} {services.length === 1 ? 'service' : 'services'} selected
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {/* Services List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {services.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No services selected yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => {
                  // Calculate service total with add-ons
                  let servicePrice = service.price;
                  let serviceDuration = service.duration;

                  if (service.selectedAddOns && service.addOns) {
                    service.selectedAddOns.forEach(selected => {
                      const addOn = service.addOns!.find(a => a.id === selected.id);
                      if (addOn) {
                        servicePrice += addOn.price * selected.quantity;
                        serviceDuration += addOn.duration * selected.quantity;
                      }
                    });
                  }

                  return (
                    <div
                      key={service.id}
                      className="bg-muted/50 rounded-lg p-4 relative"
                    >
                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => onRemoveService(service.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      {/* Service info */}
                      <div className="pr-8">
                        <h4 className="font-semibold mb-1">{service.title}</h4>
                        <Badge variant="secondary" className="text-xs mb-2">
                          {service.categoryName}
                        </Badge>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {TimeUtils.formatDuration(serviceDuration)}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${servicePrice.toFixed(2)}
                          </div>
                        </div>

                        {/* Add-ons */}
                        {service.selectedAddOns && service.selectedAddOns.length > 0 && (
                          <div className="mt-2 pl-4 border-l-2 border-primary/20">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Add-ons:
                            </p>
                            {service.selectedAddOns.map(selected => {
                              const addOn = service.addOns?.find(a => a.id === selected.id);
                              if (!addOn) return null;

                              return (
                                <div
                                  key={selected.id}
                                  className="text-xs text-muted-foreground"
                                >
                                  • {addOn.title} {selected.quantity > 1 && `(x${selected.quantity})`}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Summary */}
          {services.length > 0 && (
            <>
              <Separator className="my-4" />

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Duration</span>
                  <span className="font-medium">
                    {TimeUtils.formatDuration(totalDuration)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Price</span>
                  <span className="font-bold text-xl">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout button */}
              <Button
                onClick={onCheckout}
                className="w-full"
                size="lg"
              >
                Continue to Staff Selection
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
