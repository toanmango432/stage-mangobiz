import React, { useState } from 'react';
import type { PatchTest } from '../../../types';
import { Button, Badge, Card } from './SharedComponents';

interface PatchTestCardProps {
  patchTests: PatchTest[];
  onAddTest: () => void;
  onEditTest: (test: PatchTest) => void;
  onDeleteTest?: (testId: string) => void;
  canEdit?: boolean;
}

export const PatchTestCard: React.FC<PatchTestCardProps> = ({
  patchTests,
  onAddTest,
  onEditTest,
  onDeleteTest,
  canEdit = true,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTestStatus = (test: PatchTest) => {
    const now = new Date();
    const expiresAt = new Date(test.expiresAt);
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (test.result === 'fail') {
      return { status: 'failed', label: 'Failed', variant: 'error' as const };
    }
    if (test.result === 'pending') {
      return { status: 'pending', label: 'Pending', variant: 'warning' as const };
    }
    if (expiresAt < now) {
      return { status: 'expired', label: 'Expired', variant: 'error' as const };
    }
    if (daysUntilExpiry <= 14) {
      return { status: 'expiring', label: `Expires in ${daysUntilExpiry}d`, variant: 'warning' as const };
    }
    return { status: 'valid', label: 'Valid', variant: 'success' as const };
  };

  const sortedTests = [...patchTests].sort((a, b) => {
    // Sort by expiry date, nearest first
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });

  const hasExpiringTests = sortedTests.some(test => {
    const status = getTestStatus(test);
    return status.status === 'expiring' || status.status === 'expired';
  });

  const handleDelete = (testId: string) => {
    if (deleteConfirmId === testId) {
      onDeleteTest?.(testId);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(testId);
    }
  };

  return (
    <Card
      title="Patch Tests"
      description="Required safety tests for certain services"
      actions={
        canEdit && (
          <Button variant="outline" size="sm" onClick={onAddTest}>
            <PlusIcon className="w-4 h-4" />
            Add Test
          </Button>
        )
      }
    >
      {/* Warning Banner */}
      {hasExpiringTests && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-3">
          <WarningIcon className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">Patch Test Attention Required</p>
            <p className="text-xs text-orange-600 mt-1">
              Some patch tests have expired or are expiring soon. Please schedule retests.
            </p>
          </div>
        </div>
      )}

      {/* Test List */}
      {sortedTests.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <TestTubeIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No patch tests recorded</p>
          {canEdit && (
            <p className="text-xs text-gray-400 mt-1">
              Add a patch test when required for specific services
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTests.map((test) => {
            const testStatus = getTestStatus(test);

            return (
              <div
                key={test.id}
                className={`
                  p-4 rounded-lg border transition-colors
                  ${testStatus.status === 'failed' || testStatus.status === 'expired'
                    ? 'bg-red-50 border-red-200'
                    : testStatus.status === 'expiring'
                      ? 'bg-orange-50 border-orange-200'
                      : testStatus.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-white border-gray-200'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {test.serviceName || 'Unknown Service'}
                      </span>
                      <Badge variant={testStatus.variant} size="sm">
                        {testStatus.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Tested: {formatDate(test.testDate)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>Expires: {formatDate(test.expiresAt)}</span>
                      </div>
                      {test.performedByName && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>By: {test.performedByName}</span>
                        </div>
                      )}
                      {test.result !== 'pending' && (
                        <div className="flex items-center gap-1">
                          {test.result === 'pass' ? (
                            <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <XIcon className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className={test.result === 'pass' ? 'text-green-600' : 'text-red-600'}>
                            {test.result === 'pass' ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      )}
                    </div>

                    {test.notes && (
                      <p className="mt-2 text-xs text-gray-500 bg-white/50 rounded p-2">
                        {test.notes}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => onEditTest(test)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit test"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      {onDeleteTest && (
                        deleteConfirmId === test.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Cancel"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(test.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Confirm delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete test"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Patch tests are required for services involving chemical treatments. Results typically expire after 6 months.
        </p>
      </div>
    </Card>
  );
};

// Icons
const TestTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

export default PatchTestCard;
