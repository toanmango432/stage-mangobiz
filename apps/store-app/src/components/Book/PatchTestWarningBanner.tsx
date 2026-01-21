import React, { useState } from 'react';

interface PatchTestWarningBannerProps {
  clientName: string;
  serviceName: string;
  reason: 'required' | 'expired';
  onOverride: (overrideReason: string) => void;
  onCancel: () => void;
}

/**
 * Warning banner shown when booking a service that requires a patch test.
 * Displays for two scenarios:
 * - reason='required': Client has never had a patch test for this service
 * - reason='expired': Client's patch test has expired
 *
 * Staff can override with a required reason, or cancel the booking.
 */
export const PatchTestWarningBanner: React.FC<PatchTestWarningBannerProps> = ({
  clientName,
  serviceName,
  reason,
  onOverride,
  onCancel,
}) => {
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const handleOverride = () => {
    if (overrideReason.trim()) {
      onOverride(overrideReason.trim());
    }
  };

  const getMessage = () => {
    if (reason === 'expired') {
      return `Patch test expired for ${serviceName}`;
    }
    return `Patch test required for ${serviceName}`;
  };

  const getDescription = () => {
    if (reason === 'expired') {
      return `${clientName}'s patch test for ${serviceName} has expired. A new patch test should be performed before proceeding.`;
    }
    return `${clientName} has not had a patch test for ${serviceName}. This service requires a patch test before it can be performed.`;
  };

  return (
    <div
      className="bg-amber-50 border-2 border-amber-400 rounded-lg overflow-hidden"
      role="alert"
      data-testid="patch-test-warning-banner"
    >
      {/* Warning header */}
      <div className="bg-amber-400 px-4 py-2 flex items-center gap-2">
        <TestTubeIcon className="w-5 h-5 text-amber-900" />
        <span className="font-bold text-amber-900 uppercase text-sm tracking-wide">
          Patch Test Warning
        </span>
      </div>

      {/* Warning content */}
      <div className="p-4">
        <p className="text-amber-900 font-semibold text-lg" data-testid="patch-test-message">
          {getMessage()}
        </p>
        <p className="text-amber-800 text-sm mt-1">
          {getDescription()}
        </p>

        {!showOverrideForm ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setShowOverrideForm(true)}
              className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              data-testid="override-button"
            >
              Override & Proceed
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium bg-white border border-amber-400 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
              data-testid="cancel-booking-button"
            >
              Cancel Booking
            </button>
          </div>
        ) : (
          <div className="mt-4 bg-white border border-amber-300 rounded-lg p-4">
            <label
              htmlFor="override-reason"
              className="block text-sm font-semibold text-amber-800 mb-2"
            >
              Override Reason (Required)
            </label>
            <textarea
              id="override-reason"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Enter reason for overriding patch test requirement..."
              rows={2}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              autoFocus
              data-testid="override-reason-input"
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowOverrideForm(false);
                  setOverrideReason('');
                }}
                className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                data-testid="override-cancel-button"
              >
                Back
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${overrideReason.trim()
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
                data-testid="confirm-override-button"
              >
                Confirm Override
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// TestTube icon for patch test warning
const TestTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 5.902a2.25 2.25 0 01-2.228 2.798H5.026a2.25 2.25 0 01-2.228-2.798L4.2 15.3"
    />
  </svg>
);

export default PatchTestWarningBanner;
