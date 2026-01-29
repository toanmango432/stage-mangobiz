/**
 * ArchivedServicesTab Component
 *
 * Displays archived services and allows restoring them back to active status.
 * Used in Menu Settings to manage archived services separately from active ones.
 */

import { useState } from 'react';
import { Archive, RotateCcw, Sparkles, Calendar } from 'lucide-react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import { useCatalog } from '@/hooks/useCatalog';
import { selectSalonId, selectCurrentUser, selectTenantId } from '@/store/slices/authSlice';
import { colors } from '@/design-system';
import type { MenuServiceWithEmbeddedVariants, ServiceCategory } from '@/types/catalog';

interface ArchivedServicesTabProps {
  /** List of archived services to display */
  archivedServices: MenuServiceWithEmbeddedVariants[];
  /** List of service categories for displaying category names */
  categories: ServiceCategory[];
  /** Callback when a service is restored */
  onRestore?: (serviceId: string) => void;
}

/**
 * Tab component showing archived services with restore functionality.
 * Follows the same layout pattern as other menu-settings sections.
 */
export function ArchivedServicesTab({
  archivedServices,
  categories,
  onRestore,
}: ArchivedServicesTabProps) {
  const storeId = useSelector(selectSalonId) || '';
  const tenantId = useSelector(selectTenantId) || storeId;
  const currentUser = useSelector(selectCurrentUser);
  const userId = currentUser?.id || 'system';

  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Get catalog hook for restore action
  const { restoreService } = useCatalog({
    storeId: storeId || 'placeholder',
    tenantId: tenantId || 'placeholder',
    userId,
    toast: (message, type) => {
      if (type === 'success') {
        toast.success(message);
      } else {
        toast.error(message);
      }
    },
  });

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  // Format archived date
  const formatArchivedDate = (isoDate?: string): string => {
    if (!isoDate) return 'Unknown date';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Handle restore action
  const handleRestore = async (serviceId: string) => {
    setRestoringId(serviceId);
    try {
      const result = await restoreService(serviceId);
      if (result) {
        onRestore?.(serviceId);
      }
    } finally {
      setRestoringId(null);
    }
  };

  // Empty state when no archived services
  if (archivedServices.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="border-2 border-dashed rounded-xl p-12 text-center"
            style={{
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.light,
            }}
          >
            <Archive
              size={48}
              className="mx-auto mb-4"
              style={{ color: colors.text.muted }}
            />
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: colors.text.primary }}
            >
              No Archived Services
            </h3>
            <p
              className="max-w-md mx-auto"
              style={{ color: colors.text.secondary }}
            >
              Services that you archive will appear here. You can restore them
              at any time to make them available for booking again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: colors.text.primary }}
          >
            Archived Services
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: colors.text.secondary }}
          >
            {archivedServices.length} archived service
            {archivedServices.length !== 1 ? 's' : ''}. Restore to make available
            for booking.
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-3">
          {archivedServices.map((service) => (
            <div
              key={service.id}
              className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4"
              style={{ borderColor: colors.border.light }}
            >
              {/* Service Info */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: colors.background.tertiary,
                  }}
                >
                  <Sparkles
                    size={20}
                    style={{ color: colors.text.muted }}
                  />
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <h4
                    className="font-medium truncate"
                    style={{ color: colors.text.primary }}
                  >
                    {service.name}
                  </h4>
                  <div
                    className="flex items-center gap-3 text-sm mt-0.5"
                    style={{ color: colors.text.secondary }}
                  >
                    <span>{getCategoryName(service.categoryId)}</span>
                    <span>•</span>
                    <span>{formatPrice(service.price)}</span>
                    <span>•</span>
                    <span>{service.duration} min</span>
                  </div>
                </div>
              </div>

              {/* Archived Date */}
              <div
                className="hidden sm:flex items-center gap-1.5 text-sm flex-shrink-0"
                style={{ color: colors.text.muted }}
              >
                <Calendar size={14} />
                <span>Archived {formatArchivedDate(service.archivedAt)}</span>
              </div>

              {/* Restore Button */}
              <button
                onClick={() => handleRestore(service.id)}
                disabled={restoringId === service.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                style={{
                  backgroundColor: colors.status.success.light,
                  color: colors.status.success.dark,
                }}
              >
                {restoringId === service.id ? (
                  <>
                    <span
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                    Restoring...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    Restore
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: colors.status.info.light }}
        >
          <p
            className="text-sm"
            style={{ color: colors.status.info.dark }}
          >
            <strong>Note:</strong> Restoring a service will make it available for
            booking immediately. Any existing appointments with this service will
            continue to work normally.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ArchivedServicesTab;
