/**
 * PriceResolutionModal - Modal for reviewing and resolving service price changes.
 * @module PriceResolutionModal
 */

import { useState, useMemo, useCallback } from 'react';
import { Zap, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectServicePriceChanges,
  selectUnresolvedPriceChanges,
  applyPriceResolutionsWithLogging,
  type PriceResolutionPayload,
  type CheckoutTicketService,
} from '@/store/slices/uiTicketsSlice';
import { selectStoreId } from '@/store/slices/authSlice';
import { useCatalog } from '@/hooks/useCatalog';
import { useToast } from '@/hooks/use-toast';
import { getPriceDecisionRecommendation } from '@/utils/priceComparisonUtils';
import type { PriceDecision } from '@/types';
import type { PricingPolicySettings } from '@/types/settings';

import { ServiceResolutionRow, type ResolutionOption, type ServiceResolutionState } from './ServiceResolutionRow';
import { PriceResolutionSummary } from './PriceResolutionSummary';

type ResolutionStates = Record<string, ServiceResolutionState>;

export interface PriceResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onResolved: (resolutions: PriceResolutionPayload[]) => void;
  pricingPolicy?: PricingPolicySettings;
  requireOverrideReason?: boolean;
}

export default function PriceResolutionModal({
  isOpen,
  onClose,
  ticketId,
  onResolved,
  pricingPolicy,
  requireOverrideReason = false,
}: PriceResolutionModalProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const currentStaffId = useAppSelector((state) =>
    state.auth.member?.memberId || state.auth.user?.id || 'unknown'
  );

  const storeId = useAppSelector(selectStoreId) || '';
  const { services: catalogServices } = useCatalog({ storeId });
  const priceChanges = useAppSelector(selectServicePriceChanges(ticketId));
  const unresolvedServices = useAppSelector(selectUnresolvedPriceChanges(ticketId));

  const isServiceDeleted = useCallback((service: CheckoutTicketService): boolean => {
    if (!service.serviceId) return false;
    return !catalogServices.some(s => s.id === service.serviceId);
  }, [catalogServices]);

  const [resolutionStates, setResolutionStates] = useState<ResolutionStates>({});

  useMemo(() => {
    const initialStates: ResolutionStates = {};
    unresolvedServices.forEach(service => {
      initialStates[service.id] = resolutionStates[service.id] || {
        option: 'booked',
        customPrice: '',
        reason: '',
      };
    });
    const hasNewServices = unresolvedServices.some(s => !resolutionStates[s.id]);
    if (hasNewServices && Object.keys(initialStates).length > 0) {
      setResolutionStates(prev => ({ ...prev, ...initialStates }));
    }
  }, [unresolvedServices]);

  const summary = useMemo(() => ({
    totalServices: priceChanges.length,
    unresolvedCount: unresolvedServices.length,
    totalVariance: priceChanges.reduce((sum, change) => sum + change.variance, 0),
  }), [priceChanges, unresolvedServices]);

  const getRecommendation = useCallback((service: CheckoutTicketService): ResolutionOption => {
    if (!service.bookedPrice || !service.catalogPriceAtCheckout) return 'booked';

    const mode = pricingPolicy?.defaultMode || 'ask_staff';
    const recommendation = getPriceDecisionRecommendation(
      mode,
      service.bookedPrice,
      service.catalogPriceAtCheckout,
      { depositPaid: service.depositLocked }
    );

    if (recommendation.priceDecision === 'booked_honored' ||
        recommendation.priceDecision === 'deposit_locked') return 'booked';
    if (recommendation.priceDecision === 'catalog_applied' ||
        recommendation.priceDecision === 'lower_applied') return 'current';
    return 'booked';
  }, [pricingPolicy]);

  const handleOptionChange = useCallback((serviceId: string, option: ResolutionOption) => {
    setResolutionStates(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        option,
        customPrice: option === 'custom' ? prev[serviceId]?.customPrice || '' : '',
      },
    }));
  }, []);

  const handleBulkAction = useCallback((option: ResolutionOption) => {
    setResolutionStates(prev => {
      const updated = { ...prev };
      unresolvedServices.forEach(service => {
        if (service.depositLocked || isServiceDeleted(service)) return;
        updated[service.id] = {
          ...prev[service.id],
          option,
          customPrice: '',
          reason: prev[service.id]?.reason || '',
        };
      });
      return updated;
    });
  }, [unresolvedServices, isServiceDeleted]);

  const handleCustomPriceChange = useCallback((serviceId: string, value: string) => {
    setResolutionStates(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], customPrice: value },
    }));
  }, []);

  const handleReasonChange = useCallback((serviceId: string, reason: string) => {
    setResolutionStates(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], reason },
    }));
  }, []);

  const isValidCustomPrice = useCallback((serviceId: string): boolean => {
    const state = resolutionStates[serviceId];
    if (state?.option !== 'custom') return true;
    const price = parseFloat(state.customPrice);
    return !isNaN(price) && price > 0;
  }, [resolutionStates]);

  const canApply = useMemo(() => {
    if (unresolvedServices.length === 0) return false;
    return unresolvedServices.every(service => {
      if (isServiceDeleted(service) || service.depositLocked) return true;
      const state = resolutionStates[service.id];
      if (!state) return false;
      if (state.option === 'custom') {
        if (!isValidCustomPrice(service.id)) return false;
        if (requireOverrideReason && !state.reason.trim()) return false;
      }
      return true;
    });
  }, [unresolvedServices, resolutionStates, isValidCustomPrice, requireOverrideReason, isServiceDeleted]);

  const handleApplyResolutions = async () => {
    try {
      const resolutions: PriceResolutionPayload[] = unresolvedServices.map(service => {
        const state = resolutionStates[service.id];
        const bookedPrice = service.bookedPrice ?? service.price;
        const catalogPrice = service.catalogPriceAtCheckout ?? service.price;
        const isDeleted = isServiceDeleted(service);

        let finalPrice: number;
        let priceDecision: PriceDecision;

        if (isDeleted) {
          finalPrice = bookedPrice;
          priceDecision = 'booked_honored';
        } else if (state?.option === 'current') {
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
          priceOverrideBy: (!isDeleted && state?.option !== 'booked') ? currentStaffId : undefined,
        };
      });

      await dispatch(applyPriceResolutionsWithLogging({ ticketId, resolutions }));
      toast({
        title: 'Price changes resolved',
        description: `${resolutions.length} service${resolutions.length !== 1 ? 's' : ''} updated successfully.`,
      });
      onResolved(resolutions);
      onClose();
    } catch (error) {
      toast({
        title: 'Error applying resolutions',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  const hasChanges = priceChanges.length > 0;
  const resolvedChanges = priceChanges.filter(
    change => !unresolvedServices.some(u => u.id === change.serviceId)
  );

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
                    {' '}{summary.unresolvedCount} need{summary.unresolvedCount === 1 ? 's' : ''} resolution.
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
            <PriceResolutionSummary summary={summary} />

            {unresolvedServices.length > 1 && (
              <div className="flex flex-wrap gap-2 pb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('booked')}
                  className="text-sm"
                  data-testid="button-honor-all-booked"
                >
                  Honor All Booked Prices
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('current')}
                  className="text-sm"
                  data-testid="button-apply-all-current"
                >
                  Apply All Current Prices
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-0">
              {unresolvedServices.map((service) => (
                <ServiceResolutionRow
                  key={service.id}
                  service={service}
                  state={resolutionStates[service.id]}
                  recommendedOption={getRecommendation(service)}
                  isDepositLocked={!!service.depositLocked}
                  isDeleted={isServiceDeleted(service)}
                  requireOverrideReason={requireOverrideReason}
                  onOptionChange={handleOptionChange}
                  onCustomPriceChange={handleCustomPriceChange}
                  onReasonChange={handleReasonChange}
                />
              ))}

              {resolvedChanges.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">Already Resolved</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {resolvedChanges.map((change) => (
                    <div
                      key={change.serviceId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 opacity-60"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-600 truncate">{change.serviceName}</span>
                        <span className="text-xs text-gray-400 ml-2">(Resolved)</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {unresolvedServices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="p-3 rounded-full bg-green-100 mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">All price changes resolved</p>
                <p className="text-xs text-gray-500 mt-1">You can close this dialog and proceed with payment.</p>
              </div>
            )}
          </>
        )}

        {!hasChanges && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-gray-100 mb-3">
              <AlertCircle className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">No price changes to resolve</p>
            <p className="text-xs text-gray-500 mt-1">All services are at their expected prices.</p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-resolution">
            {unresolvedServices.length > 0 ? 'Cancel' : 'Done'}
          </Button>
          {unresolvedServices.length > 0 && (
            <Button
              onClick={handleApplyResolutions}
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
