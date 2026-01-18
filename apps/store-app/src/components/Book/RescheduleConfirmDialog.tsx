/**
 * RescheduleConfirmDialog Component
 * Shows when rescheduling an appointment to allow staff to choose price handling
 *
 * @example
 * <RescheduleConfirmDialog
 *   isOpen={showRescheduleDialog}
 *   onClose={() => setShowRescheduleDialog(false)}
 *   onConfirm={(keepOriginalPrice) => handleRescheduleConfirm(keepOriginalPrice)}
 *   appointment={appointmentToReschedule}
 *   newStaffId={targetStaffId}
 *   newTime={targetTime}
 * />
 */

import { useState, useMemo } from 'react';
import { Calendar, Clock, DollarSign, AlertCircle, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/Button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';
import { useAppSelector } from '../../store/hooks';
import { selectCheckoutSettings } from '../../store/slices/settingsSlice';
import { selectAllStaff } from '../../store/slices/uiStaffSlice';
import { DEFAULT_PRICING_POLICY } from '../../types/settings';
import { useCatalog } from '../../hooks/useCatalog';
import { selectStoreId } from '../../store/slices/authSlice';
import { formatCurrency } from '../../utils/formatters';

interface RescheduleConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when dialog should close */
  onClose: () => void;
  /**
   * Called when user confirms the reschedule
   * @param keepOriginalPrice - true to keep booked price, false to update to current
   */
  onConfirm: (keepOriginalPrice: boolean) => void;
  /** The appointment being rescheduled */
  appointment: LocalAppointment | null;
  /** The new staff ID (may be different from original) */
  newStaffId: string;
  /** The new scheduled start time */
  newTime: Date;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
}

/**
 * Format time for display (e.g., "2:30 PM")
 */
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RescheduleConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  newStaffId,
  newTime,
  isLoading = false,
}: RescheduleConfirmDialogProps) {
  // Get settings for default behavior
  const checkoutSettings = useAppSelector(selectCheckoutSettings);
  const pricingPolicy = checkoutSettings?.pricingPolicy ?? DEFAULT_PRICING_POLICY;
  const allStaff = useAppSelector(selectAllStaff);

  // Get catalog services for current price lookup
  const storeId = useAppSelector(selectStoreId);
  const { services: catalogServices } = useCatalog({ storeId: storeId || '' });

  // Default to setting value
  const defaultKeepOriginal = pricingPolicy.keepPriceOnReschedule;

  // Local state for the radio selection
  const [keepOriginalPrice, setKeepOriginalPrice] = useState(defaultKeepOriginal);

  // Reset to default when dialog opens
  useMemo(() => {
    if (isOpen) {
      setKeepOriginalPrice(defaultKeepOriginal);
    }
  }, [isOpen, defaultKeepOriginal]);

  // Calculate price information
  const priceInfo = useMemo(() => {
    if (!appointment) return null;

    // Get original staff name
    const originalStaff = allStaff.find((s) => s.id === appointment.staffId);
    const newStaff = allStaff.find((s) => s.id === newStaffId);

    // Calculate original total (booked prices)
    let originalTotal = 0;
    let currentTotal = 0;
    let hasBookedPrice = false;
    let hasPriceChange = false;

    const serviceDetails = appointment.services.map((service) => {
      const bookedPrice = service.bookedPrice ?? service.price;
      const catalogService = catalogServices.find((cs) => cs.id === service.serviceId);
      const currentPrice = catalogService?.price ?? service.price;

      originalTotal += bookedPrice;
      currentTotal += currentPrice;

      if (service.bookedPrice !== undefined) {
        hasBookedPrice = true;
      }

      const priceDiff = currentPrice - bookedPrice;
      if (Math.abs(priceDiff) > 0.01) {
        hasPriceChange = true;
      }

      return {
        serviceName: service.serviceName,
        bookedPrice,
        currentPrice,
        priceDiff,
      };
    });

    return {
      originalStaffName: originalStaff?.name ?? appointment.staffName,
      newStaffName: newStaff?.name ?? 'Unknown',
      isStaffChange: newStaffId !== appointment.staffId,
      originalTime: new Date(appointment.scheduledStartTime),
      originalTotal,
      currentTotal,
      hasBookedPrice,
      hasPriceChange,
      totalDiff: currentTotal - originalTotal,
      serviceDetails,
    };
  }, [appointment, allStaff, newStaffId, catalogServices]);

  if (!appointment || !priceInfo) return null;

  const handleConfirm = () => {
    onConfirm(keepOriginalPrice);
  };

  // Show price option only if there are booked prices to preserve
  const showPriceOption = priceInfo.hasBookedPrice;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{appointment.clientName}</p>
              <p className="text-sm text-gray-500">
                {appointment.services.map((s) => s.serviceName).join(', ')}
              </p>
            </div>
          </div>

          {/* Time Change Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">From:</span>
              <span className="font-medium text-gray-900">
                {formatDate(priceInfo.originalTime)}, {formatTime(priceInfo.originalTime)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-gray-600">To:</span>
              <span className="font-medium text-purple-700">
                {formatDate(newTime)}, {formatTime(newTime)}
              </span>
            </div>
            {priceInfo.isStaffChange && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600">Staff change:</span>
                <span className="font-medium">
                  {priceInfo.originalStaffName} → {priceInfo.newStaffName}
                </span>
              </div>
            )}
          </div>

          {/* Price Option - Only show if there are booked prices */}
          {showPriceOption && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-600" />
                <span className="font-medium text-gray-900">Price Handling</span>
              </div>

              {/* Price variance warning */}
              {priceInfo.hasPriceChange && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800">
                    Service prices have changed since booking.
                    {priceInfo.totalDiff > 0 && (
                      <span className="font-medium">
                        {' '}
                        Current price is {formatCurrency(priceInfo.totalDiff)} higher.
                      </span>
                    )}
                    {priceInfo.totalDiff < 0 && (
                      <span className="font-medium">
                        {' '}
                        Current price is {formatCurrency(Math.abs(priceInfo.totalDiff))} lower.
                      </span>
                    )}
                  </p>
                </div>
              )}

              <RadioGroup
                value={keepOriginalPrice ? 'keep' : 'update'}
                onValueChange={(value) => setKeepOriginalPrice(value === 'keep')}
                className="space-y-2"
              >
                <div
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    keepOriginalPrice
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <RadioGroupItem value="keep" id="keep-price" className="mt-0.5" />
                  <Label htmlFor="keep-price" className="cursor-pointer flex-1">
                    <p className="font-medium text-gray-900">
                      Keep original price ({formatCurrency(priceInfo.originalTotal)})
                    </p>
                    <p className="text-sm text-gray-500">
                      Honor the price shown when the client booked
                    </p>
                  </Label>
                </div>

                <div
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    !keepOriginalPrice
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <RadioGroupItem value="update" id="update-price" className="mt-0.5" />
                  <Label htmlFor="update-price" className="cursor-pointer flex-1">
                    <p className="font-medium text-gray-900">
                      Update to current price ({formatCurrency(priceInfo.currentTotal)})
                    </p>
                    <p className="text-sm text-gray-500">Use the current catalog prices</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
