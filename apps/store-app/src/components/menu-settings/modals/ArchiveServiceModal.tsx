/**
 * ArchiveServiceModal Component
 * Shows warning about upcoming appointments and package dependencies before archiving a service.
 * Follows Vagaro/Fresha pattern: acknowledges impact before archiving, reassures that existing
 * appointments are not affected.
 *
 * @example
 * <ArchiveServiceModal
 *   isOpen={showArchiveDialog}
 *   onClose={() => setShowArchiveDialog(false)}
 *   onConfirm={handleArchiveConfirm}
 *   service={serviceToArchive}
 *   dependencies={dependencies}
 *   isLoading={isArchiving}
 * />
 */

import { useState, useMemo } from 'react';
import { Archive, AlertTriangle, Calendar, Package, CheckCircle2, Eye, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import type { MenuService } from '@/types/catalog';
import type { ServiceArchiveDependencies } from '../../../hooks/useCatalog';
import { formatCurrency } from '../../../utils/formatters';

interface ArchiveServiceModalProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when dialog should close */
  onClose: () => void;
  /** Called when user confirms the archive action */
  onConfirm: () => void;
  /** Called when user wants to view affected appointments */
  onViewAppointments?: () => void;
  /** The service being archived */
  service: MenuService | null;
  /** Dependency information from checkServiceDependencies */
  dependencies: ServiceArchiveDependencies | null;
  /** Whether the archive action is in progress */
  isLoading?: boolean;
}

export function ArchiveServiceModal({
  isOpen,
  onClose,
  onConfirm,
  onViewAppointments,
  service,
  dependencies,
  isLoading = false,
}: ArchiveServiceModalProps) {
  // Track if user has acknowledged the warning
  const [acknowledged, setAcknowledged] = useState(false);

  // Reset acknowledgment when dialog opens/closes
  useMemo(() => {
    if (!isOpen) {
      setAcknowledged(false);
    }
  }, [isOpen]);

  if (!service) return null;

  const hasUpcomingAppointments = (dependencies?.upcomingAppointmentCount ?? 0) > 0;
  const hasPackages = (dependencies?.packageCount ?? 0) > 0;
  const hasDependencies = dependencies?.hasDependencies ?? false;

  // Determine if we need acknowledgment (only when there are significant dependencies)
  const requiresAcknowledgment = hasUpcomingAppointments;
  const canConfirm = !requiresAcknowledgment || acknowledged;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-100">
              <Archive className="w-5 h-5 text-amber-600" />
            </div>
            Archive Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Service Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{service.name}</p>
            <p className="text-sm text-gray-500">
              {formatCurrency(service.price)} &middot; {service.duration} min
            </p>
          </div>

          {/* No Dependencies - Simple confirmation */}
          {!hasDependencies && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">No dependencies found</p>
                <p className="text-sm text-green-700 mt-1">
                  This service has no upcoming appointments or active packages. You can safely archive it.
                </p>
              </div>
            </div>
          )}

          {/* Upcoming Appointments Warning */}
          {hasUpcomingAppointments && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {dependencies!.upcomingAppointmentCount} upcoming appointment
                  {dependencies!.upcomingAppointmentCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  This service has upcoming appointments scheduled. Archiving will not affect these appointments - they can still be checked out normally.
                </p>
                {onViewAppointments && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewAppointments}
                    className="mt-2 text-amber-700 hover:text-amber-800 hover:bg-amber-100 -ml-2"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Appointments
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Package Dependencies Warning */}
          {hasPackages && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Included in {dependencies!.packageCount} package
                  {dependencies!.packageCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {dependencies!.packageNames.slice(0, 3).join(', ')}
                  {dependencies!.packageNames.length > 3 && ` and ${dependencies!.packageNames.length - 3} more`}
                </p>
                <p className="text-sm text-blue-600 mt-2">
                  These packages will still work for existing purchases. Consider updating package configurations after archiving.
                </p>
              </div>
            </div>
          )}

          {/* Reassurance message */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Info className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-700">What happens when you archive?</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Service will be hidden from new bookings</li>
                <li>Existing appointments are not affected</li>
                <li>You can restore the service at any time</li>
              </ul>
            </div>
          </div>

          {/* Acknowledgment checkbox for significant dependencies */}
          {requiresAcknowledgment && (
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="acknowledge-archive"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <label
                htmlFor="acknowledge-archive"
                className="text-sm text-gray-700 cursor-pointer"
              >
                I understand that{' '}
                <span className="font-medium">
                  {dependencies!.upcomingAppointmentCount} upcoming appointment
                  {dependencies!.upcomingAppointmentCount > 1 ? 's' : ''}
                </span>{' '}
                will show this service as archived, but can still be completed normally.
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || !canConfirm}
            className={cn(
              'bg-amber-600 hover:bg-amber-700 text-white',
              (!canConfirm) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Archiving...
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-1" />
                Archive Anyway
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
