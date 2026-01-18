import { Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CheckoutTicketService } from '@/store/slices/uiTicketsSlice';

/**
 * Props for the PriceVarianceLineItem component.
 */
interface PriceVarianceLineItemProps {
  /** The service to display with price variance information */
  service: CheckoutTicketService;
  /** Callback when user clicks "Apply Current Price" button */
  onApplyCurrentPrice?: () => void;
  /** Callback when user wants to open the resolution modal for this service */
  onOpenResolution?: () => void;
}

/**
 * Displays a service line item with price variance information.
 * Shows original booked price, current catalog price, and variance with visual indicators.
 *
 * Features:
 * - Lightning bolt icon (⚡) for price variance indicator
 * - Strikethrough on old price when different from new price
 * - Green color for price decrease (customer saves money)
 * - Amber color for price increase
 * - Lock icon when price is deposit-locked
 * - "Apply Current Price" button for unresolved services
 *
 * @example
 * ```tsx
 * <PriceVarianceLineItem
 *   service={checkoutService}
 *   onApplyCurrentPrice={() => handleApply(service.id)}
 *   onOpenResolution={() => setSelectedService(service)}
 * />
 * ```
 */
export default function PriceVarianceLineItem({
  service,
  onApplyCurrentPrice,
  onOpenResolution,
}: PriceVarianceLineItemProps) {
  const {
    serviceName,
    price,
    bookedPrice,
    catalogPriceAtCheckout,
    priceDecision,
    depositLocked,
  } = service;

  // Calculate display values
  const displayName = serviceName || 'Unnamed Service';
  const hasVariance = bookedPrice !== undefined &&
    catalogPriceAtCheckout !== undefined &&
    Math.abs((catalogPriceAtCheckout ?? 0) - (bookedPrice ?? 0)) >= 0.01;

  const variance = (catalogPriceAtCheckout ?? 0) - (bookedPrice ?? 0);
  const variancePercent = bookedPrice && bookedPrice > 0
    ? Math.round((variance / bookedPrice) * 100)
    : 0;

  // Determine direction: increase (positive variance) or decrease (negative)
  const isPriceIncrease = variance > 0;
  const isPriceDecrease = variance < 0;

  // Service is unresolved if there's variance but no decision has been made
  const isUnresolved = hasVariance && !priceDecision;

  // Format currency
  const formatPrice = (amount: number | undefined) => {
    if (amount === undefined) return '--';
    return `$${amount.toFixed(2)}`;
  };

  // Format variance with sign
  const formatVariance = (amount: number) => {
    const sign = amount > 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)} (${sign}${variancePercent}%)`;
  };

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200"
      data-testid={`price-variance-line-item-${service.id}`}
    >
      {/* Variance indicator icon */}
      <div className="flex-shrink-0 pt-0.5">
        {depositLocked ? (
          <div className="p-1.5 rounded-full bg-gray-100">
            <Lock className="h-4 w-4 text-gray-500" aria-label="Price locked by deposit" />
          </div>
        ) : hasVariance ? (
          <div className={`p-1.5 rounded-full ${isPriceIncrease ? 'bg-amber-100' : 'bg-green-100'}`}>
            <Zap
              className={`h-4 w-4 ${isPriceIncrease ? 'text-amber-600' : 'text-green-600'}`}
              aria-label="Price has changed"
            />
          </div>
        ) : (
          <div className="p-1.5 rounded-full bg-gray-50">
            <div className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Service info and pricing */}
      <div className="flex-1 min-w-0">
        {/* Service name */}
        <h4 className="font-medium text-gray-900 text-sm truncate">
          {displayName}
        </h4>

        {/* Price display */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          {/* Original booked price (strikethrough if different from current) */}
          {bookedPrice !== undefined && hasVariance && (
            <span className="text-gray-400 line-through">
              {formatPrice(bookedPrice)}
            </span>
          )}

          {/* Current/catalog price */}
          <span className={`font-medium ${
            isPriceDecrease ? 'text-green-700' :
            isPriceIncrease ? 'text-amber-700' :
            'text-gray-900'
          }`}>
            {formatPrice(catalogPriceAtCheckout ?? price)}
          </span>

          {/* Variance badge */}
          {hasVariance && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              isPriceDecrease
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {formatVariance(variance)}
            </span>
          )}

          {/* Deposit locked badge */}
          {depositLocked && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              Deposit locked
            </span>
          )}
        </div>

        {/* Status message based on decision */}
        {priceDecision && (
          <p className="mt-1 text-xs text-gray-500">
            {priceDecision === 'booked_honored' && 'Original booking price honored'}
            {priceDecision === 'catalog_applied' && 'Current catalog price applied'}
            {priceDecision === 'lower_applied' && 'Lower price automatically applied'}
            {priceDecision === 'manual_override' && 'Custom price set by staff'}
            {priceDecision === 'deposit_locked' && 'Price locked by deposit payment'}
            {priceDecision === 'walk_in_current' && 'Current price (walk-in)'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* Apply Current Price button - only show for unresolved services */}
        {isUnresolved && onApplyCurrentPrice && !depositLocked && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onApplyCurrentPrice}
            data-testid={`button-apply-current-${service.id}`}
          >
            Apply Current
          </Button>
        )}

        {/* Open resolution - for more options */}
        {isUnresolved && onOpenResolution && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-gray-600"
            onClick={onOpenResolution}
            data-testid={`button-open-resolution-${service.id}`}
          >
            Options
          </Button>
        )}
      </div>
    </div>
  );
}
