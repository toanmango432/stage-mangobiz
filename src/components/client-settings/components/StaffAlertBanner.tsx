import React, { useState } from 'react';
import type { StaffAlert } from '../../../types';
import { Button } from './SharedComponents';

interface StaffAlertBannerProps {
  alert?: StaffAlert;
  onSetAlert: (message: string) => void;
  onClearAlert: () => void;
  canEdit?: boolean;
}

export const StaffAlertBanner: React.FC<StaffAlertBannerProps> = ({
  alert,
  onSetAlert,
  onClearAlert,
  canEdit = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newMessage, setNewMessage] = useState(alert?.message || '');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = () => {
    if (newMessage.trim()) {
      onSetAlert(newMessage.trim());
      setIsEditing(false);
    }
  };

  const handleClear = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      return;
    }
    onClearAlert();
    setShowClearConfirm(false);
    setNewMessage('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewMessage(alert?.message || '');
    setShowClearConfirm(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // No alert and not editing - show "Add Alert" button
  if (!alert && !isEditing) {
    if (!canEdit) return null;

    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-colors"
      >
        <AlertIcon className="w-5 h-5" />
        <span className="font-medium">Add Staff Alert</span>
      </button>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-amber-800 mb-2">
              Staff Alert Message
            </label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter an important message for staff to see when viewing this client..."
              rows={3}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none bg-white"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <button
                onClick={handleSave}
                disabled={!newMessage.trim()}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${newMessage.trim()
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Save Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display alert
  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-lg overflow-hidden animate-pulse-subtle">
      {/* High-visibility header */}
      <div className="bg-amber-400 px-4 py-2 flex items-center gap-2">
        <AlertIcon className="w-5 h-5 text-amber-900" />
        <span className="font-bold text-amber-900 uppercase text-sm tracking-wide">
          Staff Alert
        </span>
      </div>

      {/* Alert content */}
      <div className="p-4">
        <p className="text-amber-900 font-medium text-lg leading-relaxed">
          {alert?.message}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-amber-700">
            Added by {alert?.createdByName || 'Staff'} on {formatDate(alert?.createdAt || '')}
          </p>

          {canEdit && (
            <div className="flex items-center gap-2">
              {showClearConfirm ? (
                <>
                  <span className="text-xs text-amber-800 mr-2">Clear this alert?</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)}>
                    No
                  </Button>
                  <button
                    onClick={handleClear}
                    className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Yes, Clear
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setNewMessage(alert?.message || '');
                      setIsEditing(true);
                    }}
                    className="p-1.5 text-amber-700 hover:bg-amber-100 rounded transition-colors"
                    title="Edit alert"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-1.5 text-amber-700 hover:bg-amber-100 rounded transition-colors"
                    title="Clear alert"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add subtle pulse animation via style
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse-subtle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }
  .animate-pulse-subtle {
    animation: pulse-subtle 3s ease-in-out infinite;
  }
`;
if (typeof document !== 'undefined' && !document.getElementById('staff-alert-styles')) {
  style.id = 'staff-alert-styles';
  document.head.appendChild(style);
}

// Icons
const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default StaffAlertBanner;
