import { useMemo } from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppSelector } from '@/store/hooks';
import {
  selectServicePriceChanges,
  selectUnresolvedPriceChanges,
  type PriceResolutionPayload,
} from '@/store/slices/uiTicketsSlice';
import PriceVarianceLineItem from './PriceVarianceLineItem';

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
}

/**
 * Modal for reviewing and resolving price changes on a ticket.
 * Lists all services with price variance and allows staff to choose
 * which price to charge for each service.
 *
 * Features:
 * - Lists all services with price variance using PriceVarianceLineItem
 * - Shows summary of total services affected and total variance
 * - Responsive design: full-screen on mobile, centered modal on desktop
 * - Future stories will add per-service resolution options and bulk actions
 *
 * @example
 * ```tsx
 * <PriceResolutionModal
 *   isOpen={showResolutionModal}
 *   onClose={() => setShowResolutionModal(false)}
 *   ticketId={currentTicketId}
 *   onResolved={(resolutions) => handleResolutions(resolutions)}
 * />
 * ```
 */
export default function PriceResolutionModal({
  isOpen,
  onClose,
  ticketId,
  onResolved,
}: PriceResolutionModalProps) {
  // Get services with price changes
  const priceChanges = useAppSelector(selectServicePriceChanges(ticketId));
  const unresolvedServices = useAppSelector(selectUnresolvedPriceChanges(ticketId));

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalServices = priceChanges.length;
    const unresolvedCount = unresolvedServices.length;
    const totalVariance = priceChanges.reduce((sum, change) => sum + change.variance, 0);
    const totalIncrease = priceChanges
      .filter(change => change.variance > 0)
      .reduce((sum, change) => sum + change.variance, 0);
    const totalDecrease = priceChanges
      .filter(change => change.variance < 0)
      .reduce((sum, change) => sum + Math.abs(change.variance), 0);

    return {
      totalServices,
      unresolvedCount,
      totalVariance,
      totalIncrease,
      totalDecrease,
    };
  }, [priceChanges, unresolvedServices]);

  // Format currency
  const formatCurrency = (amount: number) => {
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  // Handle applying current price to a single service (placeholder for US-018)
  const handleApplyCurrentPrice = (serviceId: string) => {
    const service = unresolvedServices.find(s => s.id === serviceId);
    if (!service || service.catalogPriceAtCheckout === undefined) return;

    const resolution: PriceResolutionPayload = {
      serviceId,
      finalPrice: service.catalogPriceAtCheckout,
      priceDecision: 'catalog_applied',
    };

    onResolved([resolution]);
  };

  // Handle opening resolution options for a service (placeholder for US-018)
  const handleOpenResolution = (serviceId: string) => {
    // Will be implemented in US-018 - for now just log
    console.log('Open resolution for service:', serviceId);
  };

  // Don't render if no price changes
  if (!isOpen || priceChanges.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Review Price Changes
          </DialogTitle>
          <DialogDescription>
            {summary.totalServices} service{summary.totalServices !== 1 ? 's' : ''} have price changes since booking.
            {summary.unresolvedCount > 0 && (
              <span className="text-amber-600 font-medium">
                {' '}
                {summary.unresolvedCount} need{summary.unresolvedCount === 1 ? 's' : ''} resolution.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

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
              {formatCurrency(summary.totalVariance)}
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

        {/* Service List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 min-h-0">
          {unresolvedServices.map((service) => (
            <PriceVarianceLineItem
              key={service.id}
              service={service}
              onApplyCurrentPrice={() => handleApplyCurrentPrice(service.id)}
              onOpenResolution={() => handleOpenResolution(service.id)}
            />
          ))}

          {/* Show resolved services in a muted section if any */}
          {priceChanges.length > unresolvedServices.length && (
            <>
              <div className="flex items-center gap-2 pt-3 pb-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">Resolved</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {priceChanges
                .filter(change => !unresolvedServices.some(u => u.id === change.serviceId))
                .map((change) => {
                  // Find the full service object for resolved services
                  const resolvedService = unresolvedServices.length === 0
                    ? null
                    : null; // We don't have the resolved services in unresolvedServices

                  // For now, just show basic info for resolved services
                  return (
                    <div
                      key={change.serviceId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 opacity-60"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-600 truncate">
                          {change.serviceName}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          (Resolved)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>

        {/* Empty state if all resolved */}
        {unresolvedServices.length === 0 && priceChanges.length > 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-full bg-green-100 mb-3">
              <AlertCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              All price changes resolved
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You can close this dialog and proceed with payment.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-close-resolution-modal"
          >
            {unresolvedServices.length > 0 ? 'Cancel' : 'Done'}
          </Button>
          {/* Apply button will be implemented in US-020 when Redux is wired */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
