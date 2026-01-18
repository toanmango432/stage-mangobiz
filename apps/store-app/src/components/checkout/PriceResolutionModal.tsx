import { useState, useMemo, useCallback } from 'react';
import { Zap, AlertCircle, Check, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAppSelector } from '@/store/hooks';
import {
  selectServicePriceChanges,
  selectUnresolvedPriceChanges,
  type PriceResolutionPayload,
  type CheckoutTicketService,
} from '@/store/slices/uiTicketsSlice';
import { getPriceDecisionRecommendation } from '@/utils/priceComparisonUtils';
import type { PriceDecision } from '@/types';
import type { PricingPolicySettings } from '@/types/settings';

// Note: PriceVarianceLineItem is available for use in other components
// but this modal uses inline rendering for better control over resolution options

/** Resolution option type for radio buttons */
type ResolutionOption = 'booked' | 'current' | 'custom';

/** State for a single service's resolution */
interface ServiceResolutionState {
  option: ResolutionOption;
  customPrice: string;
  reason: string;
}

/** Map of serviceId to resolution state */
type ResolutionStates = Record<string, ServiceResolutionState>;

/**
 * Props for the PriceResolutionModal component.
 */
interface PriceResolutionModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** The ID of the ticket to resolve prices for */
  ticketId: string;
  /** Callback when resolutions are applied */
  onResolved: (resolutions: PriceResolutionPayload[]) => void;
  /** Optional pricing policy settings for recommendations */
  pricingPolicy?: PricingPolicySettings;
  /** Whether to require reason for custom price overrides */
  requireOverrideReason?: boolean;
}

/**
 * Modal for reviewing and resolving price changes on a ticket.
 * Lists all services with price variance and allows staff to choose
 * which price to charge for each service.
 *
 * Features:
 * - Per-service resolution options: Honor booked, Use current, Custom price
 * - Radio buttons for each service with clear price display
 * - Custom price input with validation (positive numbers only)
 * - Reason input when custom/override selected (if requireOverrideReason)
 * - Shows "Recommended" badge based on pricing policy
 * - Apply button disabled until all services have a selection
 * - Responsive design: full-screen on mobile, centered modal on desktop
 *
 * @example
 * ```tsx
 * <PriceResolutionModal
 *   isOpen={showResolutionModal}
 *   onClose={() => setShowResolutionModal(false)}
 *   ticketId={currentTicketId}
 *   onResolved={(resolutions) => handleResolutions(resolutions)}
 *   pricingPolicy={policySettings}
 *   requireOverrideReason={true}
 * />
 * ```
 */
export default function PriceResolutionModal({
  isOpen,
  onClose,
  ticketId,
  onResolved,
  pricingPolicy,
  requireOverrideReason = false,
}: PriceResolutionModalProps) {
  // Get services with price changes
  const priceChanges = useAppSelector(selectServicePriceChanges(ticketId));
  const unresolvedServices = useAppSelector(selectUnresolvedPriceChanges(ticketId));

  // Local state for resolution selections
  const [resolutionStates, setResolutionStates] = useState<ResolutionStates>({});

  // Initialize resolution states when modal opens or services change
  useMemo(() => {
    const initialStates: ResolutionStates = {};
    unresolvedServices.forEach(service => {
      if (!resolutionStates[service.id]) {
        initialStates[service.id] = {
          option: 'booked', // Default to booked (client-friendly)
          customPrice: '',
          reason: '',
        };
      } else {
        initialStates[service.id] = resolutionStates[service.id];
      }
    });
    // Only update if there are new services to add
    const hasNewServices = unresolvedServices.some(s => !resolutionStates[s.id]);
    if (hasNewServices && Object.keys(initialStates).length > 0) {
      setResolutionStates(prev => ({ ...prev, ...initialStates }));
    }
  }, [unresolvedServices]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalServices = priceChanges.length;
    const unresolvedCount = unresolvedServices.length;
    const totalVariance = priceChanges.reduce((sum, change) => sum + change.variance, 0);

    return {
      totalServices,
      unresolvedCount,
      totalVariance,
    };
  }, [priceChanges, unresolvedServices]);

  // Format currency (with optional sign)
  const formatCurrency = (amount: number, showSign = false) => {
    if (showSign) {
      const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
      return `${sign}$${Math.abs(amount).toFixed(2)}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  // Get recommended option for a service based on policy
  const getRecommendation = useCallback((service: CheckoutTicketService): ResolutionOption => {
    if (!service.bookedPrice || !service.catalogPriceAtCheckout) {
      return 'booked';
    }

    const mode = pricingPolicy?.defaultMode || 'ask_staff';
    const recommendation = getPriceDecisionRecommendation(
      mode,
      service.bookedPrice,
      service.catalogPriceAtCheckout,
      { depositPaid: service.depositLocked }
    );

    // Map recommendation to option type
    if (recommendation.priceDecision === 'booked_honored' ||
        recommendation.priceDecision === 'deposit_locked') {
      return 'booked';
    }
    if (recommendation.priceDecision === 'catalog_applied' ||
        recommendation.priceDecision === 'lower_applied') {
      return 'current';
    }
    return 'booked'; // Default for 'ask_staff' with increases
  }, [pricingPolicy]);

  // Handle option change for a service
  const handleOptionChange = useCallback((serviceId: string, option: ResolutionOption) => {
    setResolutionStates(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        option,
        // Clear custom price if switching away from custom
        customPrice: option === 'custom' ? prev[serviceId]?.customPrice || '' : '',
      },
    }));
  }, []);

  // Bulk action: Honor all booked prices
  const handleHonorAllBooked = useCallback(() => {
    setResolutionStates(prev => {
      const updated = { ...prev };
      unresolvedServices.forEach(service => {
        // Skip deposit-locked services (they're already locked to booked price)
        if (service.depositLocked) return;
        updated[service.id] = {
          ...prev[service.id],
          option: 'booked',
          customPrice: '',
          reason: prev[service.id]?.reason || '',
        };
      });
      return updated;
    });
  }, [unresolvedServices]);

  // Bulk action: Apply all current prices
  const handleApplyAllCurrent = useCallback(() => {
    setResolutionStates(prev => {
      const updated = { ...prev };
      unresolvedServices.forEach(service => {
        // Skip deposit-locked services (they're already locked to booked price)
        if (service.depositLocked) return;
        updated[service.id] = {
          ...prev[service.id],
          option: 'current',
          customPrice: '',
          reason: prev[service.id]?.reason || '',
        };
      });
      return updated;
    });
  }, [unresolvedServices]);

  // Handle custom price change
  const handleCustomPriceChange = useCallback((serviceId: string, value: string) => {
    setResolutionStates(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        customPrice: value,
      },
    }));
  }, []);

  // Handle reason change
  const handleReasonChange = useCallback((serviceId: string, reason: string) => {
    setResolutionStates(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        reason,
      },
    }));
  }, []);

  // Check if a service needs a reason (custom price or override)
  const needsReason = useCallback((serviceId: string): boolean => {
    if (!requireOverrideReason) return false;
    const state = resolutionStates[serviceId];
    return state?.option === 'custom';
  }, [requireOverrideReason, resolutionStates]);

  // Validate custom price
  const isValidCustomPrice = useCallback((serviceId: string): boolean => {
    const state = resolutionStates[serviceId];
    if (state?.option !== 'custom') return true;
    const price = parseFloat(state.customPrice);
    return !isNaN(price) && price > 0;
  }, [resolutionStates]);

  // Check if all services have valid selections
  const canApply = useMemo(() => {
    if (unresolvedServices.length === 0) return false;

    return unresolvedServices.every(service => {
      const state = resolutionStates[service.id];
      if (!state) return false;

      // For custom option, need valid price and possibly reason
      if (state.option === 'custom') {
        if (!isValidCustomPrice(service.id)) return false;
        if (needsReason(service.id) && !state.reason.trim()) return false;
      }

      return true;
    });
  }, [unresolvedServices, resolutionStates, isValidCustomPrice, needsReason]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Early return if no price changes (but still show empty state in dialog)
  const hasChanges = priceChanges.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Review Price Changes
          </DialogTitle>
          <DialogDescription>
            {hasChanges ? (
              <>
                {summary.totalServices} service{summary.totalServices !== 1 ? 's' : ''} have price changes since booking.
                {summary.unresolvedCount > 0 && (
                  <span className="text-amber-600 font-medium">
                    {' '}
                    {summary.unresolvedCount} need{summary.unresolvedCount === 1 ? 's' : ''} resolution.
                  </span>
                )}
              </>
            ) : (
              'No price changes detected for this ticket.'
            )}
          </DialogDescription>
        </DialogHeader>

        {hasChanges && (
          <>
            {/* Summary Card */}
            <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex-1 min-w-[100px]">
                <p className="text-xs text-gray-500">Services Affected</p>
                <p className="text-lg font-semibold text-gray-900">
                  {summary.totalServices}
                </p>
              </div>
              <div className="flex-1 min-w-[100px]">
                <p className="text-xs text-gray-500">Total Variance</p>
                <p className={`text-lg font-semibold ${
                  summary.totalVariance > 0 ? 'text-amber-600' :
                  summary.totalVariance < 0 ? 'text-green-600' :
                  'text-gray-900'
                }`}>
                  {formatCurrency(summary.totalVariance, true)}
                </p>
              </div>
              {summary.unresolvedCount > 0 && (
                <div className="flex-1 min-w-[100px]">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-lg font-semibold text-amber-600">
                    {summary.unresolvedCount}
                  </p>
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {unresolvedServices.length > 1 && (
              <div className="flex flex-wrap gap-2 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleHonorAllBooked}
                  className="text-sm"
                  data-testid="button-honor-all-booked"
                >
                  Honor All Booked Prices
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyAllCurrent}
                  className="text-sm"
                  data-testid="button-apply-all-current"
                >
                  Apply All Current Prices
                </Button>
              </div>
            )}

            {/* Service List with Resolution Options */}
            <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0">
              {unresolvedServices.map((service) => {
                const state = resolutionStates[service.id];
                const bookedPrice = service.bookedPrice ?? service.price;
                const catalogPrice = service.catalogPriceAtCheckout ?? service.price;
                const recommendedOption = getRecommendation(service);
                const isDeposit = service.depositLocked;
                const variance = (catalogPrice - bookedPrice);
                const isIncrease = variance > 0;

                return (
                  <div
                    key={service.id}
                    className="p-4 rounded-lg border border-gray-200 bg-white space-y-3"
                    data-testid={`resolution-service-${service.id}`}
                  >
                    {/* Service Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {service.serviceName}
                          </span>
                          {isDeposit && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              Deposit Locked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span>Booked: {formatCurrency(bookedPrice)}</span>
                          <span className="text-gray-300">→</span>
                          <span className={isIncrease ? 'text-amber-600' : 'text-green-600'}>
                            Current: {formatCurrency(catalogPrice)}
                          </span>
                          <span className={`text-xs ${isIncrease ? 'text-amber-500' : 'text-green-500'}`}>
                            ({formatCurrency(variance, true)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resolution Options */}
                    {isDeposit ? (
                      <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 border border-blue-200">
                        <Check className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700">
                          Price locked at {formatCurrency(bookedPrice)} due to deposit
                        </span>
                      </div>
                    ) : (
                      <RadioGroup
                        value={state?.option || 'booked'}
                        onValueChange={(value) => handleOptionChange(service.id, value as ResolutionOption)}
                        className="space-y-2"
                      >
                        {/* Honor Booked Option */}
                        <Label
                          htmlFor={`${service.id}-booked`}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            state?.option === 'booked'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <RadioGroupItem value="booked" id={`${service.id}-booked`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                Honor Booked Price
                              </span>
                              {recommendedOption === 'booked' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                  <Star className="h-3 w-3" />
                                  Recommended
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              Charge {formatCurrency(bookedPrice)} (original booking price)
                            </span>
                          </div>
                        </Label>

                        {/* Use Current Option */}
                        <Label
                          htmlFor={`${service.id}-current`}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            state?.option === 'current'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <RadioGroupItem value="current" id={`${service.id}-current`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                Use Current Price
                              </span>
                              {recommendedOption === 'current' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                  <Star className="h-3 w-3" />
                                  Recommended
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              Charge {formatCurrency(catalogPrice)} (current catalog price)
                            </span>
                          </div>
                        </Label>

                        {/* Custom Price Option */}
                        <div
                          className={`rounded-lg border transition-all ${
                            state?.option === 'custom'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200'
                          }`}
                        >
                          <Label
                            htmlFor={`${service.id}-custom`}
                            className="flex items-center gap-3 p-3 cursor-pointer"
                          >
                            <RadioGroupItem value="custom" id={`${service.id}-custom`} />
                            <div className="flex-1">
                              <span className="font-medium text-sm">Custom Price</span>
                              <span className="text-sm text-gray-500 ml-2">
                                Enter a different amount
                              </span>
                            </div>
                          </Label>

                          {/* Custom Price Input */}
                          {state?.option === 'custom' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  placeholder="0.00"
                                  value={state.customPrice}
                                  onChange={(e) => handleCustomPriceChange(service.id, e.target.value)}
                                  className={`pl-8 ${
                                    state.customPrice && !isValidCustomPrice(service.id)
                                      ? 'border-red-300 focus:ring-red-500'
                                      : ''
                                  }`}
                                  data-testid={`input-custom-price-${service.id}`}
                                />
                              </div>
                              {state.customPrice && !isValidCustomPrice(service.id) && (
                                <p className="text-xs text-red-500">
                                  Please enter a valid price greater than $0
                                </p>
                              )}

                              {/* Reason Input */}
                              {needsReason(service.id) && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">
                                    Reason for override (required)
                                  </Label>
                                  <Input
                                    type="text"
                                    placeholder="Enter reason for custom price..."
                                    value={state.reason}
                                    onChange={(e) => handleReasonChange(service.id, e.target.value)}
                                    className={
                                      needsReason(service.id) && !state.reason.trim()
                                        ? 'border-amber-300'
                                        : ''
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
              })}

              {/* Show resolved services in a muted section if any */}
              {priceChanges.length > unresolvedServices.length && (
                <>
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">Already Resolved</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {priceChanges
                    .filter(change => !unresolvedServices.some(u => u.id === change.serviceId))
                    .map((change) => (
                      <div
                        key={change.serviceId}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 opacity-60"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-600 truncate">
                            {change.serviceName}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            (Resolved)
                          </span>
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>

            {/* Empty state if all resolved */}
            {unresolvedServices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="p-3 rounded-full bg-green-100 mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  All price changes resolved
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You can close this dialog and proceed with payment.
                </p>
              </div>
            )}
          </>
        )}

        {/* No changes state */}
        {!hasChanges && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <AlertCircle className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              No price changes to resolve
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All services are at their expected prices.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-resolution"
          >
            {unresolvedServices.length > 0 ? 'Cancel' : 'Done'}
          </Button>
          {unresolvedServices.length > 0 && (
            <Button
              onClick={() => {
                // Build resolutions from state (will be wired in US-020)
                const resolutions: PriceResolutionPayload[] = unresolvedServices.map(service => {
                  const state = resolutionStates[service.id];
                  const bookedPrice = service.bookedPrice ?? service.price;
                  const catalogPrice = service.catalogPriceAtCheckout ?? service.price;

                  let finalPrice: number;
                  let priceDecision: PriceDecision;

                  if (state?.option === 'current') {
                    finalPrice = catalogPrice;
                    priceDecision = 'catalog_applied';
                  } else if (state?.option === 'custom') {
                    finalPrice = parseFloat(state.customPrice) || bookedPrice;
                    priceDecision = 'manual_override';
                  } else {
                    finalPrice = bookedPrice;
                    priceDecision = 'booked_honored';
                  }

                  return {
                    serviceId: service.id,
                    finalPrice,
                    priceDecision,
                    priceOverrideReason: state?.option === 'custom' ? state.reason : undefined,
                  };
                });

                onResolved(resolutions);
              }}
              disabled={!canApply}
              data-testid="button-apply-resolutions"
            >
              Apply Resolutions
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
