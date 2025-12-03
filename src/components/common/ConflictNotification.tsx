/**
 * Conflict Notification Component
 *
 * Displays sync conflicts to users and provides resolution options.
 * Used when concurrent edits from multiple devices cause data conflicts.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  X,
  RefreshCw,
  Check,
  Clock,
  User,
  Monitor,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityType } from '@/types/common';

// Types for conflict data
export interface ConflictDetails {
  id: string;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  localVersion: {
    data: Record<string, unknown>;
    modifiedAt: string;
    modifiedBy: string;
    deviceId: string;
  };
  serverVersion: {
    data: Record<string, unknown>;
    modifiedAt: string;
    modifiedBy: string;
    deviceId: string;
  };
  conflictingFields: string[];
  detectedAt: string;
}

export type ConflictResolution = 'keep-local' | 'keep-server' | 'merge';

interface ConflictNotificationProps {
  /** The conflict to display */
  conflict: ConflictDetails;
  /** Callback when user resolves the conflict */
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  /** Callback when user dismisses the notification */
  onDismiss?: (conflictId: string) => void;
  /** Show detailed diff view */
  showDetails?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Get human-readable entity type name
 */
function getEntityTypeName(entityType: EntityType): string {
  const names: Partial<Record<EntityType, string>> = {
    appointment: 'Appointment',
    ticket: 'Ticket',
    transaction: 'Transaction',
    client: 'Client',
    staff: 'Staff Member',
    service: 'Service',
    teamMember: 'Team Member',
  };
  return names[entityType] || entityType;
}

/**
 * Format date for display
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format field name for display
 */
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

export function ConflictNotification({
  conflict,
  onResolve,
  onDismiss,
  showDetails = true,
  className = '',
}: ConflictNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution | null>(null);

  const handleResolve = async (resolution: ConflictResolution) => {
    setIsResolving(true);
    setSelectedResolution(resolution);
    try {
      await onResolve(conflict.id, resolution);
    } finally {
      setIsResolving(false);
      setSelectedResolution(null);
    }
  };

  const entityTypeName = getEntityTypeName(conflict.entityType);

  return (
    <div
      className={cn(
        'bg-amber-50 border border-amber-200 rounded-lg shadow-lg overflow-hidden',
        'animate-slide-in-right',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-amber-100 border-b border-amber-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900">Sync Conflict Detected</h3>
              <p className="text-sm text-amber-700">
                {entityTypeName}
                {conflict.entityName && `: ${conflict.entityName}`}
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(conflict.id)}
              className="p-1 hover:bg-amber-200 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-amber-600" />
            </button>
          )}
        </div>
      </div>

      {/* Conflict summary */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-700 mb-3">
          This {entityTypeName.toLowerCase()} was modified on another device while you were working offline.
          Please choose how to resolve the conflict.
        </p>

        {/* Conflicting fields badge */}
        {conflict.conflictingFields.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="text-xs text-gray-500">Conflicting fields:</span>
            {conflict.conflictingFields.map((field) => (
              <span
                key={field}
                className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full"
              >
                {formatFieldName(field)}
              </span>
            ))}
          </div>
        )}

        {/* Version comparison */}
        {showDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900 mb-3"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show details
              </>
            )}
          </button>
        )}

        {isExpanded && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Local version */}
            <VersionCard
              title="Your Changes"
              icon={<Monitor className="w-4 h-4" />}
              modifiedAt={conflict.localVersion.modifiedAt}
              modifiedBy={conflict.localVersion.modifiedBy}
              changes={conflict.conflictingFields.map((field) => ({
                field,
                value: conflict.localVersion.data[field],
              }))}
              highlight="blue"
            />

            {/* Server version */}
            <VersionCard
              title="Server Version"
              icon={<RefreshCw className="w-4 h-4" />}
              modifiedAt={conflict.serverVersion.modifiedAt}
              modifiedBy={conflict.serverVersion.modifiedBy}
              changes={conflict.conflictingFields.map((field) => ({
                field,
                value: conflict.serverVersion.data[field],
              }))}
              highlight="green"
            />
          </div>
        )}

        {/* Resolution buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleResolve('keep-local')}
            disabled={isResolving}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-blue-100 text-blue-700 hover:bg-blue-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isResolving && selectedResolution === 'keep-local' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Monitor className="w-4 h-4" />
            )}
            Keep My Changes
          </button>

          <button
            onClick={() => handleResolve('keep-server')}
            disabled={isResolving}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-green-100 text-green-700 hover:bg-green-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isResolving && selectedResolution === 'keep-server' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Use Server Version
          </button>
        </div>
      </div>
    </div>
  );
}

// Version card component for side-by-side comparison
interface VersionCardProps {
  title: string;
  icon: React.ReactNode;
  modifiedAt: string;
  modifiedBy: string;
  changes: Array<{ field: string; value: unknown }>;
  highlight: 'blue' | 'green';
}

function VersionCard({ title, icon, modifiedAt, modifiedBy, changes, highlight }: VersionCardProps) {
  const colors = {
    blue: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      title: 'text-blue-900',
      text: 'text-blue-700',
    },
    green: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      title: 'text-green-900',
      text: 'text-green-700',
    },
  };

  const c = colors[highlight];

  return (
    <div className={cn('rounded-lg border p-3', c.border, c.bg)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={c.text}>{icon}</span>
        <span className={cn('font-medium text-sm', c.title)}>{title}</span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <Clock className="w-3 h-3" />
          {formatDateTime(modifiedAt)}
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <User className="w-3 h-3" />
          {modifiedBy || 'Unknown user'}
        </div>
      </div>

      {changes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Changed values:</p>
          <div className="space-y-1">
            {changes.map(({ field, value }) => (
              <div key={field} className="text-xs">
                <span className="text-gray-500">{formatFieldName(field)}:</span>{' '}
                <span className={c.text}>{formatValue(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ============================================
// CONFLICT NOTIFICATION CONTAINER
// ============================================

interface ConflictNotificationContainerProps {
  conflicts: ConflictDetails[];
  onResolve: (conflictId: string, resolution: ConflictResolution) => void;
  onDismiss?: (conflictId: string) => void;
  onDismissAll?: () => void;
  maxVisible?: number;
}

/**
 * Container for displaying multiple conflict notifications
 */
export function ConflictNotificationContainer({
  conflicts,
  onResolve,
  onDismiss,
  onDismissAll,
  maxVisible = 3,
}: ConflictNotificationContainerProps) {
  if (conflicts.length === 0) return null;

  const visibleConflicts = conflicts.slice(0, maxVisible);
  const hiddenCount = conflicts.length - maxVisible;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      {/* Summary if there are many conflicts */}
      {conflicts.length > 1 && (
        <div className="flex items-center justify-between bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{conflicts.length} conflicts need attention</span>
          </div>
          {onDismissAll && (
            <button
              onClick={onDismissAll}
              className="text-xs hover:underline"
            >
              Dismiss all
            </button>
          )}
        </div>
      )}

      {/* Individual conflict notifications */}
      {visibleConflicts.map((conflict) => (
        <ConflictNotification
          key={conflict.id}
          conflict={conflict}
          onResolve={onResolve}
          onDismiss={onDismiss}
          showDetails={visibleConflicts.length === 1}
        />
      ))}

      {/* Hidden count indicator */}
      {hiddenCount > 0 && (
        <div className="text-center text-sm text-gray-500">
          +{hiddenCount} more conflict{hiddenCount > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default ConflictNotification;
