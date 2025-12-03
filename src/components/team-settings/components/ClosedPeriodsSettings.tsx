import React, { useState, useCallback } from 'react';
import { Card, Button, SectionHeader, EmptyState, Badge } from './SharedComponents';
import { ClosedPeriodModal } from './ClosedPeriodModal';
import {
  useClosedPeriods,
  useClosedPeriodMutations,
  useUpcomingClosedPeriods,
} from '../../../hooks/useSchedule';
import { useScheduleContext } from '../hooks/useScheduleContext';
import type { BusinessClosedPeriod } from '../../../types/schedule';

interface ClosedPeriodsSettingsProps {
  storeId: string;
}

export const ClosedPeriodsSettings: React.FC<ClosedPeriodsSettingsProps> = ({ storeId }) => {
  const context = useScheduleContext();
  const { periods, loading, error, refetch } = useClosedPeriods(storeId);
  const upcomingPeriods = useUpcomingClosedPeriods();
  const { remove, loading: mutationLoading } = useClosedPeriodMutations(context || {
    userId: '',
    userName: '',
    storeId: '',
    tenantId: '',
    deviceId: '',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<BusinessClosedPeriod | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddClick = useCallback(() => {
    setSelectedPeriod(undefined);
    setIsModalOpen(true);
  }, []);

  const handleEditClick = useCallback((period: BusinessClosedPeriod) => {
    setSelectedPeriod(period);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPeriod(undefined);
  }, []);

  const handleDeleteClick = useCallback((periodId: string) => {
    setDeleteConfirmId(periodId);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmId) return;
    try {
      await remove(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch {
      // Error handled by hook
    }
  }, [deleteConfirmId, remove]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmId(null);
  }, []);

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if a period is currently active
  const isCurrentlyActive = (period: BusinessClosedPeriod): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return period.startDate <= today && period.endDate >= today;
  };

  // Check if a period is in the past
  const isPast = (period: BusinessClosedPeriod): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return period.endDate < today;
  };

  if (loading && periods.length === 0) {
    return (
      <Card className="animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <SectionHeader
          title="Business Closures"
          subtitle="Manage days when your business is closed"
          icon={<CalendarOffIcon className="w-5 h-5" />}
          action={
            <Button
              onClick={handleAddClick}
              icon={<PlusIcon className="w-4 h-4" />}
              disabled={!context}
            >
              Add Closure
            </Button>
          }
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-red-600 underline mt-1"
            >
              Try again
            </button>
          </div>
        )}

        {periods.length === 0 ? (
          <EmptyState
            icon={<CalendarOffIcon className="w-8 h-8" />}
            title="No closures scheduled"
            description="Add business closures for holidays, training days, or maintenance periods."
            action={
              <Button
                onClick={handleAddClick}
                icon={<PlusIcon className="w-4 h-4" />}
                disabled={!context}
              >
                Add Closure
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {/* Upcoming closures section */}
            {upcomingPeriods.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Upcoming & Active ({upcomingPeriods.length})
                </h4>
                <div className="space-y-2">
                  {upcomingPeriods.map((period) => (
                    <ClosurePeriodRow
                      key={period.id}
                      period={period}
                      isActive={isCurrentlyActive(period)}
                      isPast={false}
                      onEdit={() => handleEditClick(period)}
                      onDelete={() => handleDeleteClick(period.id)}
                      isDeleting={deleteConfirmId === period.id}
                      onConfirmDelete={handleConfirmDelete}
                      onCancelDelete={handleCancelDelete}
                      isDeleteLoading={mutationLoading}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past closures section */}
            {periods.filter(isPast).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Past Closures
                </h4>
                <div className="space-y-2 opacity-60">
                  {periods.filter(isPast).slice(0, 5).map((period) => (
                    <ClosurePeriodRow
                      key={period.id}
                      period={period}
                      isActive={false}
                      isPast={true}
                      onEdit={() => handleEditClick(period)}
                      onDelete={() => handleDeleteClick(period.id)}
                      isDeleting={deleteConfirmId === period.id}
                      onConfirmDelete={handleConfirmDelete}
                      onCancelDelete={handleCancelDelete}
                      isDeleteLoading={mutationLoading}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <ClosedPeriodModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        existingPeriod={selectedPeriod}
      />
    </>
  );
};

// Individual closure row component
interface ClosurePeriodRowProps {
  period: BusinessClosedPeriod;
  isActive: boolean;
  isPast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  isDeleteLoading: boolean;
  formatDate: (date: string) => string;
}

const ClosurePeriodRow: React.FC<ClosurePeriodRowProps> = ({
  period,
  isActive,
  onEdit,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  isDeleteLoading,
  formatDate,
}) => {
  const isSingleDay = period.startDate === period.endDate;

  return (
    <div
      className={`
        flex items-center gap-4 p-3 rounded-lg border transition-colors
        ${isActive ? 'border-red-200 bg-red-50' : 'border-gray-100 hover:border-gray-200'}
      `}
    >
      {/* Color indicator */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: period.color }}
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{period.name}</span>
          {isActive && (
            <Badge variant="error" size="sm">Active Now</Badge>
          )}
          {period.isAnnual && (
            <Badge variant="info" size="sm">Annual</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
          <span>
            {isSingleDay
              ? formatDate(period.startDate)
              : `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`}
          </span>
          {period.isPartialDay && (
            <>
              <span className="text-gray-300">|</span>
              <span>{period.startTime} - {period.endTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {isDeleting ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Delete?</span>
          <button
            onClick={onConfirmDelete}
            disabled={isDeleteLoading}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isDeleteLoading ? 'Deleting...' : 'Yes'}
          </button>
          <button
            onClick={onCancelDelete}
            disabled={isDeleteLoading}
            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            No
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit"
          >
            <EditIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Icons
const CalendarOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default ClosedPeriodsSettings;
