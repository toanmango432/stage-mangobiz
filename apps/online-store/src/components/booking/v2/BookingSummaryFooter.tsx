import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, Clock, DollarSign, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CartItem, Assignment } from './types';

interface BookingSummaryFooterProps {
  cartItems: CartItem[];
  assignments?: Assignment[];
  className?: string;
}

export const BookingSummaryFooter: React.FC<BookingSummaryFooterProps> = ({
  cartItems,
  assignments,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (cartItems.length === 0) return null;

  const totalDuration = cartItems.reduce((sum, item) => sum + item.service.duration, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.service.price, 0);
  const firstItem = cartItems[0];
  const hasMultiple = cartItems.length > 1;

  return (
    <div className={cn("fixed bottom-16 md:bottom-20 left-0 right-0 z-30 bg-gradient-to-t from-muted/50 to-transparent backdrop-blur-sm", className)}>
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/80 transition-all duration-200 rounded-t-xl bg-background/95 border-t border-x shadow-lg"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {firstItem.service.name}
                {hasMultiple && ` +${cartItems.length - 1} more`}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {totalDuration} min
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${totalPrice}
                </span>
              </div>
            </div>
          </div>
          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors border-b"
          >
            <span className="text-sm font-semibold">Booking Summary</span>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="px-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Services */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">SERVICES</h4>
                <div className="space-y-2">
                  {cartItems.map((item, index) => {
                    const assignment = assignments?.find(a => a.cartItemId === item.id);
                    return (
                      <div key={item.id} className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.service.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.service.duration} min
                            </Badge>
                            {assignment && (
                              <>
                                {assignment.staffName && (
                                  <Badge variant="outline" className="text-xs">
                                    <User className="h-3 w-3 mr-1" />
                                    {assignment.staffName}
                                  </Badge>
                                )}
                                {assignment.date && assignment.time && (
                                  <Badge variant="outline" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {assignment.time}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-sm flex-shrink-0">${item.service.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Total</p>
                    <p className="text-xs text-muted-foreground">{totalDuration} minutes total</p>
                  </div>
                  <p className="text-2xl font-bold">${totalPrice}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
