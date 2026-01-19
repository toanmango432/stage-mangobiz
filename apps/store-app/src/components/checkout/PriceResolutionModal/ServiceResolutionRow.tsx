import { Star, DollarSign, Check, AlertTriangle } from 'lucide-react';
import { colors } from '@/design-system';
import { Input } from '@/components/ui/Input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { CheckoutTicketService } from '@/store/slices/uiTicketsSlice';

/** Resolution option type for radio buttons */
export type ResolutionOption = 'booked' | 'current' | 'custom';

/** State for a single service's resolution */
export interface ServiceResolutionState {
  option: ResolutionOption;
  customPrice: string;
  reason: string;
}

/**
 * Props for the ServiceResolutionRow component.
 */
export interface ServiceResolutionRowProps {
  /** The service with price change to resolve */
  service: CheckoutTicketService;
  /** Current resolution state for this service */
  state: ServiceResolutionState | undefined;
  /** The recommended resolution option based on pricing policy */
  recommendedOption: ResolutionOption;
  /** Whether this service has a deposit locked */
  isDepositLocked: boolean;
  /** Whether this service has been deleted from the catalog */
  isDeleted: boolean;
  /** Whether a reason is required for custom price overrides */
  requireOverrideReason: boolean;
  /** Callback when resolution option changes */
  onOptionChange: (serviceId: string, option: ResolutionOption) => void;
  /** Callback when custom price changes */
  onCustomPriceChange: (serviceId: string, value: string) => void;
  /** Callback when reason changes */
  onReasonChange: (serviceId: string, reason: string) => void;
}

/**
 * Renders a single service row with price resolution options.
 * Handles three states:
 * 1. Deleted service - Shows warning and forces booked price
 * 2. Deposit locked - Shows info and forces booked price
 * 3. Normal - Shows radio options for booked/current/custom
 *
 * @example
 * ```tsx
 * <ServiceResolutionRow
 *   service={service}
 *   state={resolutionStates[service.id]}
 *   recommendedOption="booked"
 *   isDepositLocked={false}
 *   isDeleted={false}
 *   requireOverrideReason={true}
 *   onOptionChange={handleOptionChange}
 *   onCustomPriceChange={handleCustomPriceChange}
 *   onReasonChange={handleReasonChange}
 * />
 * ```
 */
export function ServiceResolutionRow({
  service,
  state,
  recommendedOption,
  isDepositLocked,
  isDeleted,
  requireOverrideReason,
  onOptionChange,
  onCustomPriceChange,
  onReasonChange,
}: ServiceResolutionRowProps) {
  const bookedPrice = service.bookedPrice ?? service.price;
  const catalogPrice = service.catalogPriceAtCheckout ?? service.price;
  const variance = catalogPrice - bookedPrice;
  const isIncrease = variance > 0;

  /** Format currency with optional sign for variance display */
  const formatCurrency = (amount: number, showSign = false) => {
    if (showSign) {
      const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
      return `${sign}$${Math.abs(amount).toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  /** Check if custom price is valid (positive number) */
  const isValidCustomPrice = (): boolean => {
    if (state?.option !== 'custom') return true;
    const price = parseFloat(state.customPrice);
    return !isNaN(price) && price > 0;
  };

  /** Check if this service needs a reason for the override */
  const needsReason = (): boolean => {
    if (!requireOverrideReason) return false;
    return state?.option === 'custom';
  };

  return (
    <div
      className="p-4 rounded-lg space-y-3"
      style={{
        border: `1px solid ${colors.border.light}`,
        backgroundColor: colors.background.primary,
      }}
      data-testid={`resolution-service-${service.id}`}
    >
      {/* Service Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate" style={{ color: colors.text.primary }}>
              {service.serviceName}
            </span>
            {isDepositLocked && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: colors.status.info.light, color: colors.status.info.dark }}
              >
                Deposit Locked
              </span>
            )}
            {isDeleted && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: colors.status.error.light, color: colors.status.error.dark }}
              >
                Service Removed
              </span>
            )}
          </div>
          {/* Price info - hide variance for deleted services (no current price) */}
          {isDeleted ? (
            <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: colors.text.secondary }}>
              <span>Booked: {formatCurrency(bookedPrice)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: colors.text.secondary }}>
              <span>Booked: {formatCurrency(bookedPrice)}</span>
              <span style={{ color: colors.border.medium }}>→</span>
              <span style={{ color: isIncrease ? colors.status.warning.dark : colors.status.success.dark }}>
                Current: {formatCurrency(catalogPrice)}
              </span>
              <span className="text-xs" style={{ color: isIncrease ? colors.status.warning.main : colors.status.success.main }}>
                ({formatCurrency(variance, true)})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Options */}
      {/* Deleted services - can only use booked price */}
      {isDeleted ? (
        <div
          className="flex items-start gap-2 p-3 rounded-md"
          style={{
            backgroundColor: colors.status.error.light,
            border: `1px solid ${colors.status.error.main}`,
          }}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: colors.status.error.dark }} />
          <div className="flex-1">
            <span className="text-sm font-medium" style={{ color: colors.status.error.dark }}>
              This service has been removed from your catalog
            </span>
            <p className="text-xs mt-1" style={{ color: colors.status.error.main }}>
              The booked price of {formatCurrency(bookedPrice)} will be used.
            </p>
          </div>
        </div>
      ) : isDepositLocked ? (
        <div
          className="flex items-center gap-2 p-3 rounded-md"
          style={{
            backgroundColor: colors.status.info.light,
            border: `1px solid ${colors.status.info.main}`,
          }}
        >
          <Check className="h-4 w-4" style={{ color: colors.status.info.dark }} />
          <span className="text-sm" style={{ color: colors.status.info.dark }}>
            Price locked at {formatCurrency(bookedPrice)} due to deposit
          </span>
        </div>
      ) : (
        <RadioGroup
          name={`price-resolution-${service.id}`}
          aria-label={`Select price resolution for ${service.serviceName}`}
          value={state?.option || 'booked'}
          onValueChange={(value) => onOptionChange(service.id, value as ResolutionOption)}
          className="space-y-2"
        >
          {/* Honor Booked Option */}
          <Label
            htmlFor={`${service.id}-booked`}
            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all border-primary bg-primary/5"
            style={
              state?.option !== 'booked'
                ? { borderColor: colors.border.light, backgroundColor: 'transparent' }
                : undefined
            }
          >
            <RadioGroupItem value="booked" id={`${service.id}-booked`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  Honor Booked Price
                </span>
                {recommendedOption === 'booked' && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: colors.status.warning.light, color: colors.status.warning.dark }}
                  >
                    <Star className="h-3 w-3" />
                    Recommended
                  </span>
                )}
              </div>
              <span className="text-sm" style={{ color: colors.text.secondary }}>
                Charge {formatCurrency(bookedPrice)} (original booking price)
              </span>
            </div>
          </Label>

          {/* Use Current Option */}
          <Label
            htmlFor={`${service.id}-current`}
            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all border-primary bg-primary/5"
            style={
              state?.option !== 'current'
                ? { borderColor: colors.border.light, backgroundColor: 'transparent' }
                : undefined
            }
          >
            <RadioGroupItem value="current" id={`${service.id}-current`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  Use Current Price
                </span>
                {recommendedOption === 'current' && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: colors.status.warning.light, color: colors.status.warning.dark }}
                  >
                    <Star className="h-3 w-3" />
                    Recommended
                  </span>
                )}
              </div>
              <span className="text-sm" style={{ color: colors.text.secondary }}>
                Charge {formatCurrency(catalogPrice)} (current catalog price)
              </span>
            </div>
          </Label>

          {/* Custom Price Option */}
          <div
            className="rounded-lg border transition-all border-primary bg-primary/5"
            style={
              state?.option !== 'custom'
                ? { borderColor: colors.border.light, backgroundColor: 'transparent' }
                : undefined
            }
          >
            <Label
              htmlFor={`${service.id}-custom`}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <RadioGroupItem value="custom" id={`${service.id}-custom`} />
              <div className="flex-1">
                <span className="font-medium text-sm">Custom Price</span>
                <span className="text-sm ml-2" style={{ color: colors.text.secondary }}>
                  Enter a different amount
                </span>
              </div>
            </Label>

            {/* Custom Price Input */}
            {state?.option === 'custom' && (
              <div className="px-3 pb-3 space-y-2">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: colors.text.muted }} />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    aria-label="Custom price amount"
                    value={state.customPrice}
                    onChange={(e) => onCustomPriceChange(service.id, e.target.value)}
                    className="pl-8"
                    style={
                      state.customPrice && !isValidCustomPrice()
                        ? { borderColor: colors.status.error.main }
                        : undefined
                    }
                    data-testid={`input-custom-price-${service.id}`}
                  />
                </div>
                {state.customPrice && !isValidCustomPrice() && (
                  <p className="text-xs" style={{ color: colors.status.error.main }}>
                    Please enter a valid price greater than $0
                  </p>
                )}

                {/* Reason Input */}
                {needsReason() && (
                  <div className="space-y-1">
                    <Label className="text-xs" style={{ color: colors.text.secondary }}>
                      Reason for override (required)
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter reason for custom price..."
                      aria-label="Override reason"
                      value={state.reason}
                      onChange={(e) => onReasonChange(service.id, e.target.value)}
                      style={
                        needsReason() && !state.reason.trim()
                          ? { borderColor: colors.status.warning.main }
                          : undefined
                      }
                      data-testid={`input-reason-${service.id}`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </RadioGroup>
      )}
    </div>
  );
}
