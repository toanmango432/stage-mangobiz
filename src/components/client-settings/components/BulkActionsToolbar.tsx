import React, { useState } from 'react';
import type { LoyaltyTier, ClientTag } from '../../../types';
import { Button } from './SharedComponents';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkTag: (tagId: string) => void;
  onBulkTier: (tier: LoyaltyTier) => void;
  onBulkBlock: () => void;
  onBulkUnblock: () => void;
  onBulkExport: (format: 'csv' | 'excel') => void;
  onBulkEmail: () => void;
  onBulkSms: () => void;
  onBulkDelete?: () => void;
  availableTags: ClientTag[];
  isAllSelected: boolean;
  totalClients: number;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkTag,
  onBulkTier,
  onBulkBlock,
  onBulkUnblock,
  onBulkExport,
  onBulkEmail,
  onBulkSms,
  onBulkDelete,
  availableTags,
  isAllSelected,
  totalClients,
}) => {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showTierMenu, setShowTierMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tierOptions: { value: LoyaltyTier; label: string }[] = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
    { value: 'platinum', label: 'Platinum' },
    { value: 'vip', label: 'VIP' },
  ];

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3 pr-4 border-r border-gray-700">
          <button
            onClick={onClearSelection}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            title="Clear selection"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
          <div>
            <span className="font-bold text-cyan-400">{selectedCount}</span>
            <span className="text-gray-400 text-sm ml-1">
              of {totalClients} selected
            </span>
          </div>
          {!isAllSelected && (
            <button
              onClick={onSelectAll}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              Select all
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Add Tag */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="text-white hover:bg-gray-800"
            >
              <TagIcon className="w-4 h-4" />
              Tag
            </Button>
            {showTagMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                {availableTags.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">No tags available</p>
                ) : (
                  availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => { onBulkTag(tag.id); setShowTagMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-gray-700">{tag.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Change Tier */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTierMenu(!showTierMenu)}
              className="text-white hover:bg-gray-800"
            >
              <StarIcon className="w-4 h-4" />
              Tier
            </Button>
            {showTierMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                {tierOptions.map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => { onBulkTier(tier.value); setShowTierMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Email */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkEmail}
            className="text-white hover:bg-gray-800"
          >
            <MailIcon className="w-4 h-4" />
            Email
          </Button>

          {/* Send SMS */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onBulkSms}
            className="text-white hover:bg-gray-800"
          >
            <MessageIcon className="w-4 h-4" />
            SMS
          </Button>

          {/* Export */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-white hover:bg-gray-800"
            >
              <ExportIcon className="w-4 h-4" />
              Export
            </Button>
            {showExportMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <button
                  onClick={() => { onBulkExport('csv'); setShowExportMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => { onBulkExport('excel'); setShowExportMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as Excel
                </button>
              </div>
            )}
          </div>

          {/* More Actions */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="text-white hover:bg-gray-800"
            >
              <MoreIcon className="w-4 h-4" />
            </Button>
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <button
                  onClick={() => { onBulkBlock(); setShowMoreMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <BlockIcon className="w-4 h-4 text-red-500" />
                  Block Selected
                </button>
                <button
                  onClick={() => { onBulkUnblock(); setShowMoreMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <UnblockIcon className="w-4 h-4 text-green-500" />
                  Unblock Selected
                </button>
                {onBulkDelete && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    {confirmDelete ? (
                      <div className="px-3 py-2">
                        <p className="text-xs text-red-600 mb-2">
                          Delete {selectedCount} clients?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => { onBulkDelete(); setConfirmDelete(false); setShowMoreMenu(false); }}
                            className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete Selected
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const MessageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ExportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const MoreIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

const BlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const UnblockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default BulkActionsToolbar;
